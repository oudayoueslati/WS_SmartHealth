const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const FUSEKI_URL = process.env.FUSEKI_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE;

const generateToken = (username, email) => {
  return jwt.sign({ username, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// ============================================
// SIGNUP - Register endpoint avec ex:Utilisateur
// ============================================
router.post("/signup", async (req, res) => {
  const { username, password, email, firstName, lastName, age } = req.body;

  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  try {
    // Check if email already exists
    const checkEmailQuery = `
      PREFIX ex: <http://example.org/>
      ASK WHERE {
        ?u a ex:Utilisateur ;
           ex:email "${email}" .
      }
    `;

    const checkEmailResponse = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query: checkEmailQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (checkEmailResponse.data.boolean) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Check if username already exists
    const checkUsernameQuery = `
      PREFIX ex: <http://example.org/>
      ASK WHERE {
        ?u a ex:Utilisateur ;
           ex:username "${username}" .
      }
    `;

    const checkUsernameResponse = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query: checkUsernameQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (checkUsernameResponse.data.boolean) {
      return res.status(400).json({ 
        success: false, 
        message: "Username already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique user ID
    const userId = `user_${Date.now()}`;

    // Create user in Fuseki with ex:Utilisateur class
    const userTTL = `
      @prefix ex: <http://example.org/> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      
      ex:${userId} a ex:Utilisateur ;
          ex:username "${username}" ;
          ex:firstName "${firstName}" ;
          ex:lastName "${lastName}" ;
          ex:email "${email}" ;
          ex:password "${hashedPassword}" ;
          ex:age ${age || 0} ;
          ex:role "user" ;
          ex:createdAt "${new Date().toISOString()}"^^xsd:dateTime .
    `;

    await axios.post(`${FUSEKI_URL}/data`, userTTL, {
      headers: { "Content-Type": "text/turtle" },
    });

    // Generate JWT token
    const token = generateToken(username, email);

    res.status(201).json({ 
      success: true, 
      message: "User created successfully",
      token,
      user: { 
        id: userId,
        username, 
        email, 
        firstName, 
        lastName,
        age: age || 0
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ============================================
// LOGIN - Login endpoint avec EMAIL
// ============================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required" 
    });
  }

  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?user ?username ?password ?firstName ?lastName ?age ?role
    WHERE {
      ?user a ex:Utilisateur ;
         ex:email "${email}" ;
         ex:username ?username ;
         ex:password ?password ;
         ex:firstName ?firstName ;
         ex:lastName ?lastName .
      OPTIONAL { ?user ex:age ?age . }
      OPTIONAL { ?user ex:role ?role . }
    }
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (response.data.results.bindings.length > 0) {
      const userData = response.data.results.bindings[0];
      const hashedPassword = userData.password.value;
      const username = userData.username.value;
      const firstName = userData.firstName.value;
      const lastName = userData.lastName.value;
      const userId = userData.user.value.split('/').pop();
      const age = userData.age?.value || 0;
      const role = userData.role?.value || "user";

      // Compare password
      const isMatch = await bcrypt.compare(password, hashedPassword);

      if (isMatch) {
        // Generate JWT token
        const token = generateToken(username, email);

        res.json({ 
          success: true, 
          token,
          user: { 
            id: userId,
            username, 
            email, 
            firstName, 
            lastName,
            age: parseInt(age),
            role
          }
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }
    } else {
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ============================================
// LOGOUT - Logout endpoint
// ============================================
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// ============================================
// VERIFY - Verify token endpoint
// ============================================
router.get("/verify", async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Optionnel: Vérifier si l'utilisateur existe toujours dans Fuseki
    const query = `
      PREFIX ex: <http://example.org/>
      SELECT ?user ?firstName ?lastName ?age ?role
      WHERE {
        ?user a ex:Utilisateur ;
           ex:username "${decoded.username}" ;
           ex:email "${decoded.email}" .
        OPTIONAL { ?user ex:firstName ?firstName . }
        OPTIONAL { ?user ex:lastName ?lastName . }
        OPTIONAL { ?user ex:age ?age . }
        OPTIONAL { ?user ex:role ?role . }
      }
    `;

    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (response.data.results.bindings.length > 0) {
      const userData = response.data.results.bindings[0];
      res.json({ 
        success: true, 
        user: {
          username: decoded.username,
          email: decoded.email,
          firstName: userData.firstName?.value || "",
          lastName: userData.lastName?.value || "",
          age: parseInt(userData.age?.value) || 0,
          role: userData.role?.value || "user"
        }
      });
    } else {
      res.status(401).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// ============================================
// GET - Récupérer tous les utilisateurs
// ============================================
router.get("/users", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?user ?username ?email ?firstName ?lastName ?age ?role ?createdAt
    WHERE {
      ?user a ex:Utilisateur .
      OPTIONAL { ?user ex:username ?username . }
      OPTIONAL { ?user ex:email ?email . }
      OPTIONAL { ?user ex:firstName ?firstName . }
      OPTIONAL { ?user ex:lastName ?lastName . }
      OPTIONAL { ?user ex:age ?age . }
      OPTIONAL { ?user ex:role ?role . }
      OPTIONAL { ?user ex:createdAt ?createdAt . }
    }
    ORDER BY DESC(?createdAt)
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const users = response.data.results.bindings.map(b => ({
      id: b.user.value.split('/').pop(),
      username: b.username?.value || '',
      email: b.email?.value || '',
      firstName: b.firstName?.value || '',
      lastName: b.lastName?.value || '',
      age: parseInt(b.age?.value) || 0,
      role: b.role?.value || 'user',
      createdAt: b.createdAt?.value || ''
    }));

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// GET - Récupérer un utilisateur par ID
// ============================================
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?username ?email ?firstName ?lastName ?age ?role ?createdAt
    WHERE {
      ex:${id} a ex:Utilisateur .
      OPTIONAL { ex:${id} ex:username ?username . }
      OPTIONAL { ex:${id} ex:email ?email . }
      OPTIONAL { ex:${id} ex:firstName ?firstName . }
      OPTIONAL { ex:${id} ex:lastName ?lastName . }
      OPTIONAL { ex:${id} ex:age ?age . }
      OPTIONAL { ex:${id} ex:role ?role . }
      OPTIONAL { ex:${id} ex:createdAt ?createdAt . }
    }
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (response.data.results.bindings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userData = response.data.results.bindings[0];

    res.json({
      success: true,
      user: {
        id,
        username: userData.username?.value || '',
        email: userData.email?.value || '',
        firstName: userData.firstName?.value || '',
        lastName: userData.lastName?.value || '',
        age: parseInt(userData.age?.value) || 0,
        role: userData.role?.value || 'user',
        createdAt: userData.createdAt?.value || ''
      }
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// PUT - Mettre à jour un utilisateur
// ============================================
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, age, role } = req.body;

  try {
    // Supprimer les anciennes données (sauf le mot de passe)
    const deleteQuery = `
      PREFIX ex: <http://example.org/>
      DELETE {
        ex:${id} ex:username ?oldUsername .
        ex:${id} ex:email ?oldEmail .
        ex:${id} ex:firstName ?oldFirstName .
        ex:${id} ex:lastName ?oldLastName .
        ex:${id} ex:age ?oldAge .
        ex:${id} ex:role ?oldRole .
      }
      WHERE {
        OPTIONAL { ex:${id} ex:username ?oldUsername . }
        OPTIONAL { ex:${id} ex:email ?oldEmail . }
        OPTIONAL { ex:${id} ex:firstName ?oldFirstName . }
        OPTIONAL { ex:${id} ex:lastName ?oldLastName . }
        OPTIONAL { ex:${id} ex:age ?oldAge . }
        OPTIONAL { ex:${id} ex:role ?oldRole . }
      }
    `;

    await axios.post(`${FUSEKI_URL}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    // Insérer les nouvelles données
    const insertQuery = `
      PREFIX ex: <http://example.org/>
      INSERT DATA {
        ex:${id} ex:username "${username}" ;
                 ex:email "${email}" ;
                 ex:firstName "${firstName}" ;
                 ex:lastName "${lastName}" ;
                 ex:age ${age || 0} ;
                 ex:role "${role || 'user'}" .
      }
    `;

    await axios.post(`${FUSEKI_URL}/update`, insertQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      user: { id, username, email, firstName, lastName, age, role }
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// DELETE - Supprimer un utilisateur
// ============================================
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = `
    PREFIX ex: <http://example.org/>
    DELETE WHERE {
      ex:${id} ?p ?o .
    }
  `;

  try {
    await axios.post(`${FUSEKI_URL}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;