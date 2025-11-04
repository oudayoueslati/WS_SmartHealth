const express = require("express");
const axios = require("axios");
const { PREFIXES, Habitude } = require("../models/Habitude");

const router = express.Router();
const FUSEKI_ENDPOINT = "http://localhost:3030/smarthealth";

// ✅ 1. GET_ALL_HABITUDES - Récupérer TOUTES les données des habitudes
router.get("/", async (_, res) => {
  try {
    const query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      SELECT ?habit ?type ?title ?desc ?calories ?hours ?steps
      WHERE {
        ?habit a ?type ;
               ont:aTitle ?title ;
               ont:aDescription ?desc .
        OPTIONAL { ?habit ont:aCaloriesConsommées ?calories . }
        OPTIONAL { ?habit ont:aNombreHeuresSommeil ?hours . }
        OPTIONAL { ?habit ont:aPasEffectués ?steps . }
      }
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    console.log("📊 GET_ALL_HABITUDES - Données récupérées:", response.data.results.bindings.length, "habitudes");
    res.json(response.data.results.bindings);
  } catch (error) {
    console.error("❌ GET_ALL_HABITUDES - Erreur:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ 2. CREATE_HABITUDE - Créer une nouvelle habitude
router.post("/", async (req, res) => {
  try {
    const habit = new Habitude(req.body);
    const query = `
      ${PREFIXES}
      INSERT DATA {
        ${habit.toTTL()}
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    console.log("✅ CREATE_HABITUDE - Habitude créée:", habit.id);
    res.json({ success: true, message: "Habitude ajoutée avec succès", id: habit.id });
  } catch (error) {
    console.error("❌ CREATE_HABITUDE - Erreur:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ 3. UPDATE_HABITUDE - Mettre à jour une habitude avec TOUS les champs
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, calories, hours, steps, type } = req.body;

    console.log("🔄 UPDATE_HABITUDE - Données reçues:", { id, title, description, calories, hours, steps, type });

    let query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      DELETE {
        ont:${id} ont:aTitle ?oldTitle ;
                  ont:aDescription ?oldDesc ;
                  ont:aCaloriesConsommées ?oldCalories ;
                  ont:aNombreHeuresSommeil ?oldHours ;
                  ont:aPasEffectués ?oldSteps .
      }
      INSERT {
        ont:${id} ont:aTitle "${title}" ;
                  ont:aDescription "${description}" .
    `;

    // Ajouter les champs spécifiques selon le type
    if (type === "Nutrition" && calories) {
      query += `ont:${id} ont:aCaloriesConsommées "${calories}"^^xsd:int .\n`;
    } else if (type === "Sommeil" && hours) {
      query += `ont:${id} ont:aNombreHeuresSommeil "${hours}"^^xsd:decimal .\n`;
    } else if (type === "ActivitéPhysique" && steps) {
      query += `ont:${id} ont:aPasEffectués "${steps}"^^xsd:int .\n`;
    }

    query += `
      }
      WHERE {
        ont:${id} a ont:${type} ;
                  ont:aTitle ?oldTitle ;
                  ont:aDescription ?oldDesc .
        OPTIONAL { ont:${id} ont:aCaloriesConsommées ?oldCalories . }
        OPTIONAL { ont:${id} ont:aNombreHeuresSommeil ?oldHours . }
        OPTIONAL { ont:${id} ont:aPasEffectués ?oldSteps . }
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    console.log("✅ UPDATE_HABITUDE - Habitude mise à jour:", id);
    res.json({ success: true, message: "Habitude mise à jour avec succès" });
  } catch (error) {
    console.error("❌ UPDATE_HABITUDE - Erreur:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ 4. DELETE_HABITUDE - Supprimer une habitude
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
      DELETE WHERE {
        ont:${id} ?p ?o .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    console.log("✅ DELETE_HABITUDE - Habitude supprimée:", id);
    res.json({ success: true, message: "Habitude supprimée avec succès" });
  } catch (error) {
    console.error("❌ DELETE_HABITUDE - Erreur:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;