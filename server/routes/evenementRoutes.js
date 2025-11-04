const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// ✅ GET all événements
router.get("/", async (req, res) => {
  try {
    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?evenement ?psDateDebut ?psDateFin ?psStatus ?psDescription ?aTitle ?aLocalisation
      WHERE {
        ?evenement a sh:Evenement .
        OPTIONAL { ?evenement sh:psDateDebut ?psDateDebut. }
        OPTIONAL { ?evenement sh:psDateFin ?psDateFin. }
        OPTIONAL { ?evenement sh:psStatus ?psStatus. }
        OPTIONAL { ?evenement sh:psDescription ?psDescription. }
        OPTIONAL { ?evenement sh:aTitle ?aTitle. }
        OPTIONAL { ?evenement sh:aLocalisation ?aLocalisation. }
      }
      ORDER BY DESC(?psDateDebut)
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const results = response.data.results.bindings.map((binding) => ({
      evenement: { value: binding.evenement?.value || "" },
      psDateDebut: { value: binding.psDateDebut?.value || "" },
      psDateFin: { value: binding.psDateFin?.value || "" },
      psStatus: { value: binding.psStatus?.value || "" },
      psDescription: { value: binding.psDescription?.value || "" },
      aTitle: { value: binding.aTitle?.value || "" },
      aLocalisation: { value: binding.aLocalisation?.value || "" }
    }));

    res.json({ results: { bindings: results } });
  } catch (error) {
    console.error("❌ Error fetching événements:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET single événement by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?psDateDebut ?psDateFin ?psStatus ?psDescription ?aTitle ?aLocalisation
      WHERE {
        sh:${id} a sh:Evenement ;
          sh:psDateDebut ?psDateDebut ;
          sh:psDateFin ?psDateFin ;
          sh:psStatus ?psStatus ;
          sh:psDescription ?psDescription ;
          sh:aTitle ?aTitle ;
          sh:aLocalisation ?aLocalisation .
      }
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (response.data.results.bindings.length === 0) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const result = response.data.results.bindings[0];
    res.json({
      psDateDebut: result.psDateDebut?.value,
      psDateFin: result.psDateFin?.value,
      psStatus: result.psStatus?.value,
      psDescription: result.psDescription?.value,
      aTitle: result.aTitle?.value,
      aLocalisation: result.aLocalisation?.value
    });
  } catch (error) {
    console.error("❌ Error fetching événement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE new événement
router.post("/", async (req, res) => {
  try {
    const { psDateDebut, psDateFin, psStatus, psDescription, aTitle, aLocalisation } = req.body;
    
    if (!aTitle || !aLocalisation || !psDateDebut || !psDateFin || !psStatus) {
      return res.status(400).json({ 
        error: "Les champs aTitle, aLocalisation, psDateDebut, psDateFin et psStatus sont obligatoires" 
      });
    }

    const evenementId = `evenement_${Date.now()}`;

    const query = `
      PREFIX sh: <${PREFIX}>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      INSERT DATA {
        sh:${evenementId} a sh:Evenement ;
          sh:psDateDebut "${psDateDebut}"^^xsd:dateTime ;
          sh:psDateFin "${psDateFin}"^^xsd:dateTime ;
          sh:psStatus "${psStatus}" ;
          sh:psDescription "${psDescription || ''}" ;
          sh:aTitle "${aTitle}" ;
          sh:aLocalisation "${aLocalisation}" .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({ 
      success: true, 
      message: "✅ Événement ajouté avec succès",
      id: evenementId
    });
  } catch (error) {
    console.error("❌ Error creating événement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATE événement
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { psDateDebut, psDateFin, psStatus, psDescription, aTitle, aLocalisation } = req.body;

    // Vérifier si l'événement existe
    const checkQuery = `
      PREFIX sh: <${PREFIX}>
      ASK { sh:${id} a sh:Evenement }
    `;

    const checkResponse = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query: checkQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (!checkResponse.data.boolean) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    // Construire la requête UPDATE dynamiquement
    let updateParts = [];
    if (psDateDebut) updateParts.push(`sh:psDateDebut "${psDateDebut}"^^xsd:dateTime`);
    if (psDateFin) updateParts.push(`sh:psDateFin "${psDateFin}"^^xsd:dateTime`);
    if (psStatus) updateParts.push(`sh:psStatus "${psStatus}"`);
    if (psDescription !== undefined) updateParts.push(`sh:psDescription "${psDescription}"`);
    if (aTitle) updateParts.push(`sh:aTitle "${aTitle}"`);
    if (aLocalisation) updateParts.push(`sh:aLocalisation "${aLocalisation}"`);

    if (updateParts.length === 0) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }

    const updateQuery = `
      PREFIX sh: <${PREFIX}>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      DELETE {
        sh:${id} ?p ?o .
      }
      INSERT {
        sh:${id} a sh:Evenement ;
          ${updateParts.join(" ;\n          ")} .
      }
      WHERE {
        sh:${id} a sh:Evenement ;
          ?p ?o .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, updateQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({ 
      success: true, 
      message: "✅ Événement modifié avec succès" 
    });
  } catch (error) {
    console.error("❌ Error updating événement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE événement
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'événement existe
    const checkQuery = `
      PREFIX sh: <${PREFIX}>
      ASK { sh:${id} a sh:Evenement }
    `;

    const checkResponse = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query: checkQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (!checkResponse.data.boolean) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const deleteQuery = `
      PREFIX sh: <${PREFIX}>

      DELETE {
        sh:${id} ?p ?o .
      }
      WHERE {
        sh:${id} ?p ?o .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({ 
      success: true, 
      message: "✅ Événement supprimé avec succès" 
    });
  } catch (error) {
    console.error("❌ Error deleting événement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ SEARCH événements
router.get("/search/:term", async (req, res) => {
  try {
    const { term } = req.params;

    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?evenement ?psDateDebut ?psDateFin ?psStatus ?psDescription ?aTitle ?aLocalisation
      WHERE {
        ?evenement a sh:Evenement .
        OPTIONAL { ?evenement sh:psDateDebut ?psDateDebut. }
        OPTIONAL { ?evenement sh:psDateFin ?psDateFin. }
        OPTIONAL { ?evenement sh:psStatus ?psStatus. }
        OPTIONAL { ?evenement sh:psDescription ?psDescription. }
        OPTIONAL { ?evenement sh:aTitle ?aTitle. }
        OPTIONAL { ?evenement sh:aLocalisation ?aLocalisation. }
        FILTER (
          REGEX(STR(?aTitle), "${term}", "i") ||
          REGEX(STR(?aLocalisation), "${term}", "i") ||
          REGEX(STR(?psStatus), "${term}", "i") ||
          REGEX(STR(?psDescription), "${term}", "i") ||
          REGEX(STR(?psDateDebut), "${term}", "i") ||
          REGEX(STR(?psDateFin), "${term}", "i")
        )
      }
      ORDER BY DESC(?psDateDebut)
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const results = response.data.results.bindings.map((binding) => ({
      evenement: { value: binding.evenement?.value || "" },
      psDateDebut: { value: binding.psDateDebut?.value || "" },
      psDateFin: { value: binding.psDateFin?.value || "" },
      psStatus: { value: binding.psStatus?.value || "" },
      psDescription: { value: binding.psDescription?.value || "" },
      aTitle: { value: binding.aTitle?.value || "" },
      aLocalisation: { value: binding.aLocalisation?.value || "" }
    }));

    res.json({ results: { bindings: results } });
  } catch (error) {
    console.error("❌ Error searching événements:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;