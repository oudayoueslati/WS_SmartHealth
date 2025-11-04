const express = require("express");
const axios = require("axios");

const router = express.Router();
const FUSEKI_ENDPOINT = "http://localhost:3030/smarthealth";

// ✅ 1. GET all HabitudeLogs - VERSION SIMPLIFIÉE POUR TEST
router.get("/", async (_, res) => {
  try {
    console.log("🔍 GET_LOGS - Début de la requête");
    
    const query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      SELECT ?log ?type ?date ?value ?habitId ?userId
      WHERE {
        ?log a ?type ;
             ont:aDateLog ?date ;
             ont:aValeur ?value .
        OPTIONAL { ?log ont:LogHabitude ?habitId . }
        OPTIONAL { ?log ont:LogHabitude ?userId . }
      }
      ORDER BY DESC(?date)
      LIMIT 100
    `;

    console.log("📤 GET_LOGS - Envoi requête SPARQL...");
    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
      timeout: 10000
    });

    console.log("✅ GET_LOGS - Réponse reçue:", response.data.results.bindings.length, "logs");
    res.json(response.data.results.bindings);
  } catch (error) {
    console.error("❌ GET_LOGS - Erreur détaillée:");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// ✅ 2. CREATE Log - VERSION SIMPLIFIÉE ET SÉCURISÉE
router.post("/", async (req, res) => {
  try {
    const { type, date, value, habitId, userId } = req.body;
    
    console.log("🔄 CREATE_LOG - Données reçues:", { 
      type, 
      date, 
      value, 
      habitId, 
      userId 
    });

    // Validation des données
    if (!type || !date || value === undefined || !habitId) {
      return res.status(400).json({ 
        success: false, 
        error: "Données manquantes: type, date, value et habitId sont requis" 
      });
    }

    const logId = `Log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Nettoyer les IDs (enlever le préfixe s'il existe)
    const cleanHabitId = habitId.replace('ontologie:', '').replace('ont:', '');
    const cleanUserId = (userId || "default_user").replace('ontologie:', '').replace('ont:', '');

    console.log("🆔 CREATE_LOG - IDs nettoyés:", { 
      logId, 
      cleanHabitId, 
      cleanUserId 
    });

    // REQUÊTE SPARQL SIMPLIFIÉE - UNE SEULE RELATION LogHabitude
    const query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      INSERT DATA {
        ont:${logId} a ont:${type} ;
          ont:aDateLog "${date}"^^xsd:dateTime ;
          ont:aValeur "${parseFloat(value)}"^^xsd:decimal ;
          ont:LogHabitude ont:${cleanHabitId} .
      }
    `;

    console.log("📤 CREATE_LOG - Requête SPARQL:");
    console.log(query);

    const response = await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { 
        "Content-Type": "application/sparql-update",
        "Accept": "application/json"
      },
      timeout: 15000
    });

    console.log("✅ CREATE_LOG - Succès, réponse Fuseki:", response.status);
    res.json({ 
      success: true, 
      message: "Log ajouté avec succès", 
      id: logId 
    });

  } catch (error) {
    console.error("❌ CREATE_LOG - Erreur détaillée:");
    console.error("Message:", error.message);
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Aucune réponse reçue - Request:", error.request);
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ 3. UPDATE Log
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date, value } = req.body;

    console.log("🔄 UPDATE_LOG - Données:", { id, type, date, value });

    if (!type || !date || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: "Données manquantes" 
      });
    }

    const cleanId = id.replace('ontologie:', '').replace('ont:', '');

    const query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      DELETE {
        ont:${cleanId} ont:aDateLog ?oldDate ;
                  ont:aValeur ?oldValue .
      }
      INSERT {
        ont:${cleanId} ont:aDateLog "${date}"^^xsd:dateTime ;
                  ont:aValeur "${parseFloat(value)}"^^xsd:decimal .
      }
      WHERE {
        ont:${cleanId} a ont:${type} ;
                  ont:aDateLog ?oldDate ;
                  ont:aValeur ?oldValue .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    console.log("✅ UPDATE_LOG - Succès");
    res.json({ success: true, message: "Log mis à jour avec succès" });

  } catch (error) {
    console.error("❌ UPDATE_LOG - Erreur:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// ✅ 4. DELETE Log
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace('ontologie:', '').replace('ont:', '');

    console.log("🔄 DELETE_LOG - ID:", cleanId);

    const query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      DELETE WHERE {
        ont:${cleanId} ?p ?o .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    console.log("✅ DELETE_LOG - Succès");
    res.json({ success: true, message: "Log supprimé avec succès" });

  } catch (error) {
    console.error("❌ DELETE_LOG - Erreur:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// ✅ 5. TEST ENDPOINT - Pour debug
router.get("/test", async (_, res) => {
  try {
    console.log("🧪 TEST_ENDPOINT - Vérification connexion Fuseki");
    
    const query = `
      SELECT ?s ?p ?o WHERE {
        ?s ?p ?o
      } LIMIT 5
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    console.log("✅ TEST_ENDPOINT - Connexion OK");
    res.json({ 
      success: true, 
      message: "Connexion Fuseki fonctionnelle",
      data: response.data.results.bindings 
    });

  } catch (error) {
    console.error("❌ TEST_ENDPOINT - Erreur connexion Fuseki:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Impossible de se connecter à Fuseki",
      details: error.message 
    });
  }
});

module.exports = router;