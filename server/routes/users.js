const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_URL = process.env.FUSEKI_URL;

/**
 * GET /api/users
 * Récupère la liste de tous les utilisateurs depuis Fuseki
 */
router.get("/", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?username ?email ?firstName ?lastName
    WHERE {
      ?user a ex:User ;
            ex:username ?username ;
            ex:email ?email .
      OPTIONAL { ?user ex:firstName ?firstName . }
      OPTIONAL { ?user ex:lastName ?lastName . }
    }
    ORDER BY ?username
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const bindings = response.data.results.bindings;
    const users = bindings.map((b) => ({
      username: b.username?.value || "",
      email: b.email?.value || "",
      firstName: b.firstName?.value || "",
      lastName: b.lastName?.value || "",
      fullName: `${b.firstName?.value || ""} ${b.lastName?.value || ""}`.trim() || b.username?.value
    }));

    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch users",
      message: err.message 
    });
  }
});

module.exports = router;
