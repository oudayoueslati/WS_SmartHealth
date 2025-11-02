const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const FUSEKI_URL = process.env.FUSEKI_URL || "http://localhost:3030/usersDB";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const generateToken = (username, email) => {
  return jwt.sign({ username, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Register endpoint
router.post("/signup", async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

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
        ?u a ex:User ;
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Fuseki
    const userTTL = `
      @prefix ex: <http://example.org/> .
      ex:${username} a ex:User ;
          ex:username "${username}" ;
          ex:firstName "${firstName}" ;
          ex:lastName "${lastName}" ;
          ex:email "${email}" ;
          ex:password "${hashedPassword}" .
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
      user: { username, email, firstName, lastName }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Login endpoint - Maintenant avec EMAIL
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
    SELECT ?username ?password ?firstName ?lastName
    WHERE {
      ?u a ex:User ;
         ex:email "${email}" ;
         ex:username ?username ;
         ex:password ?password ;
         ex:firstName ?firstName ;
         ex:lastName ?lastName .
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

      // Compare password
      const isMatch = await bcrypt.compare(password, hashedPassword);

      if (isMatch) {
        // Generate JWT token
        const token = generateToken(username, email);

        res.json({ 
          success: true, 
          token,
          user: { username, email, firstName, lastName }
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

// Logout endpoint
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

module.exports = router;