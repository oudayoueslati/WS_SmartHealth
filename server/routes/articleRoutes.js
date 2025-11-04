const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// ✅ GET all articles with event relations
router.get("/", async (req, res) => {
  try {
    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?article ?aNom ?aDescriptionArc ?aTypePai ?aImageArct ?evenement ?evenementTitre
      WHERE {
        ?article a sh:Article .
        OPTIONAL { ?article sh:aNom ?aNom. }
        OPTIONAL { ?article sh:aDescriptionArc ?aDescriptionArc. }
        OPTIONAL { ?article sh:aTypePai ?aTypePai. }
        OPTIONAL { ?article sh:aImageArct ?aImageArct. }
        OPTIONAL { 
          ?article sh:estLieA ?evenement .
          OPTIONAL { ?evenement sh:aTitle ?evenementTitre. }
        }
      }
      ORDER BY DESC(?article)
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const results = response.data.results.bindings.map((binding) => ({
      article: { value: binding.article?.value || "" },
      aNom: { value: binding.aNom?.value || "" },
      aDescriptionArc: { value: binding.aDescriptionArc?.value || "" },
      aTypePai: { value: binding.aTypePai?.value || "" },
      aImageArct: { value: binding.aImageArct?.value || "" },
      evenementLie: { value: binding.evenement?.value || "" },
      evenementTitre: { value: binding.evenementTitre?.value || "" }
    }));

    res.json({ 
      success: true,
      count: results.length,
      results: { bindings: results } 
    });
  } catch (error) {
    console.error("❌ Error fetching articles:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors du chargement des articles: " + error.message 
    });
  }
});

// ✅ CREATE new article
router.post("/", async (req, res) => {
  try {
    const { aNom, aDescriptionArc, aTypePai, aImageArct, evenementLie } = req.body;
    
    console.log("📝 Création d'un nouvel article:", { 
      aNom, 
      aTypePai, 
      evenementLie 
    });

    if (!aNom || !aDescriptionArc || !aTypePai) {
      return res.status(400).json({ 
        success: false,
        error: "Les champs aNom, aDescriptionArc et aTypePai sont obligatoires" 
      });
    }

    const articleId = `article_${Date.now()}`;

    // Create base article
    let query = `
      PREFIX sh: <${PREFIX}>

      INSERT DATA {
        sh:${articleId} a sh:Article ;
          sh:aNom "${aNom.replace(/"/g, '\\"')}" ;
          sh:aDescriptionArc "${aDescriptionArc.replace(/"/g, '\\"')}" ;
          sh:aTypePai "${aTypePai}" ;
          sh:aImageArct "${aImageArct || ''}" .
    `;

    // Add event relation if specified
    if (evenementLie && evenementLie.trim() !== "") {
      query += `
          sh:${articleId} sh:estLieA sh:${evenementLie} .
      `;
    }

    query += `}`;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({ 
      success: true, 
      message: "✅ Article ajouté avec succès" + (evenementLie ? " (avec relation)" : ""),
      id: articleId
    });

  } catch (error) {
    console.error("❌ Error creating article:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la création de l'article: " + (error.response?.data || error.message) 
    });
  }
});

// ✅ GET single article by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?aNom ?aDescriptionArc ?aTypePai ?aImageArct ?evenement ?evenementTitre
      WHERE {
        sh:${id} a sh:Article ;
          sh:aNom ?aNom ;
          sh:aDescriptionArc ?aDescriptionArc ;
          sh:aTypePai ?aTypePai ;
          sh:aImageArct ?aImageArct .
        OPTIONAL { 
          sh:${id} sh:estLieA ?evenement .
          OPTIONAL { ?evenement sh:aTitle ?evenementTitre. }
        }
      }
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (response.data.results.bindings.length === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    const result = response.data.results.bindings[0];
    res.json({
      aNom: result.aNom?.value,
      aDescriptionArc: result.aDescriptionArc?.value,
      aTypePai: result.aTypePai?.value,
      aImageArct: result.aImageArct?.value,
      evenementLie: result.evenement?.value ? result.evenement.value.split('#')[1] : null,
      evenementTitre: result.evenementTitre?.value
    });
  } catch (error) {
    console.error("❌ Error fetching article:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATE article
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { aNom, aDescriptionArc, aTypePai, aImageArct, evenementLie } = req.body;

    // Check if article exists
    const checkQuery = `
      PREFIX sh: <${PREFIX}>
      ASK { sh:${id} a sh:Article }
    `;

    const checkResponse = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query: checkQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (!checkResponse.data.boolean) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    // Build update query
    let updateParts = [];
    if (aNom) updateParts.push(`sh:aNom "${aNom.replace(/"/g, '\\"')}"`);
    if (aDescriptionArc) updateParts.push(`sh:aDescriptionArc "${aDescriptionArc.replace(/"/g, '\\"')}"`);
    if (aTypePai) updateParts.push(`sh:aTypePai "${aTypePai}"`);
    if (aImageArct !== undefined) updateParts.push(`sh:aImageArct "${aImageArct}"`);

    if (updateParts.length === 0) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }

    const updateQuery = `
      PREFIX sh: <${PREFIX}>

      DELETE {
        sh:${id} ?p ?o .
      }
      INSERT {
        sh:${id} a sh:Article ;
          ${updateParts.join(" ;\n          ")} .
        ${evenementLie ? `sh:${id} sh:estLieA sh:${evenementLie} .` : ''}
      }
      WHERE {
        sh:${id} a sh:Article ;
          ?p ?o .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, updateQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({ 
      success: true, 
      message: "✅ Article modifié avec succès" 
    });
  } catch (error) {
    console.error("❌ Error updating article:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE article
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if article exists
    const checkQuery = `
      PREFIX sh: <${PREFIX}>
      ASK { sh:${id} a sh:Article }
    `;

    const checkResponse = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query: checkQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (!checkResponse.data.boolean) {
      return res.status(404).json({ error: "Article non trouvé" });
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
      message: "✅ Article supprimé avec succès" 
    });
  } catch (error) {
    console.error("❌ Error deleting article:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET available events for linking
router.get("/evenements/disponibles", async (req, res) => {
  try {
    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?evenement ?titre
      WHERE {
        ?evenement a sh:Evenement .
        OPTIONAL { ?evenement sh:aTitle ?titre. }
      }
      ORDER BY ?titre
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const results = response.data.results.bindings.map((binding) => ({
      id: binding.evenement?.value.split('#')[1] || '',
      titre: binding.titre?.value || 'Sans titre'
    }));

    res.json({ 
      success: true,
      evenements: results 
    });
  } catch (error) {
    console.error("❌ Error fetching available evenements:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors du chargement des événements disponibles: " + error.message 
    });
  }
});

// ✅ SEARCH articles
router.get("/search/:term", async (req, res) => {
  try {
    const { term } = req.params;

    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?article ?aNom ?aDescriptionArc ?aTypePai ?aImageArct ?evenement ?evenementTitre
      WHERE {
        ?article a sh:Article .
        OPTIONAL { ?article sh:aNom ?aNom. }
        OPTIONAL { ?article sh:aDescriptionArc ?aDescriptionArc. }
        OPTIONAL { ?article sh:aTypePai ?aTypePai. }
        OPTIONAL { ?article sh:aImageArct ?aImageArct. }
        OPTIONAL { 
          ?article sh:estLieA ?evenement .
          OPTIONAL { ?evenement sh:aTitle ?evenementTitre. }
        }
        FILTER (
          REGEX(STR(?aNom), "${term}", "i") ||
          REGEX(STR(?aDescriptionArc), "${term}", "i") ||
          REGEX(STR(?aTypePai), "${term}", "i") ||
          REGEX(STR(?evenementTitre), "${term}", "i")
        )
      }
      ORDER BY ?aNom
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const results = response.data.results.bindings.map((binding) => ({
      article: { value: binding.article?.value || "" },
      aNom: { value: binding.aNom?.value || "" },
      aDescriptionArc: { value: binding.aDescriptionArc?.value || "" },
      aTypePai: { value: binding.aTypePai?.value || "" },
      aImageArct: { value: binding.aImageArct?.value || "" },
      evenementLie: { value: binding.evenement?.value || "" },
      evenementTitre: { value: binding.evenementTitre?.value || "" }
    }));

    res.json({ results: { bindings: results } });
  } catch (error) {
    console.error("❌ Error searching articles:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;