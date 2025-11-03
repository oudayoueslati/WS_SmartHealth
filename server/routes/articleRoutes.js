const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// ✅ CREATE new article with relation - VERSION SIMPLIFIÉE
router.post("/", async (req, res) => {
  try {
    const { aNom, aDescriptionArc, aTypePai, aImageArct, evenementLie } = req.body;
    
    console.log("📝 Création d'un nouvel article:", { 
      aNom, 
      aTypePai, 
      evenementLie,
      hasEvenement: !!evenementLie 
    });

    // Validation basique
    if (!aNom || !aDescriptionArc || !aTypePai) {
      return res.status(400).json({ 
        success: false,
        error: "Les champs aNom, aDescriptionArc et aTypePai sont obligatoires" 
      });
    }

    const articleId = `article_${Date.now()}`;

    // Créer d'abord l'article sans relation
    let baseQuery = `
      PREFIX sh: <${PREFIX}>

      INSERT DATA {
        sh:${articleId} a sh:Article ;
          sh:aNom "${aNom}" ;
          sh:aDescriptionArc "${aDescriptionArc}" ;
          sh:aTypePai "${aTypePai}" ;
          sh:aImageArct "${aImageArct || ''}" .
      }
    `;

    console.log("📤 Requête de base:", baseQuery);

    // Exécuter la création de base de l'article
    await axios.post(`${FUSEKI_ENDPOINT}/update`, baseQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    console.log("✅ Article de base créé avec ID:", articleId);

    // Si un événement est spécifié, créer la relation
    if (evenementLie && evenementLie.trim() !== "") {
      try {
        console.log(`🔗 Tentative de création de relation avec événement: ${evenementLie}`);
        
        // Vérifier si l'événement existe
        const checkEventQuery = `
          PREFIX sh: <${PREFIX}>
          ASK WHERE { 
            sh:${evenementLie} a sh:Evenement 
          }
        `;

        console.log("🔍 Vérification événement:", checkEventQuery);

        const checkResponse = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
          params: { query: checkEventQuery },
          headers: { Accept: "application/sparql-results+json" },
        });

        console.log("✅ Réponse vérification événement:", checkResponse.data);

        if (checkResponse.data.boolean) {
          // Créer la relation
          const relationQuery = `
            PREFIX sh: <${PREFIX}>

            INSERT DATA {
              sh:${articleId} sh:estLieA sh:${evenementLie} .
            }
          `;

          console.log("📤 Requête de relation:", relationQuery);

          await axios.post(`${FUSEKI_ENDPOINT}/update`, relationQuery, {
            headers: { "Content-Type": "application/sparql-update" },
          });

          console.log(`✅ Relation créée entre ${articleId} et ${evenementLie}`);
        } else {
          console.warn(`⚠️ Événement ${evenementLie} non trouvé, création sans relation`);
        }
      } catch (relationError) {
        console.error("❌ Erreur création relation:", relationError.message);
        // Continuer même si la relation échoue
      }
    }

    res.json({ 
      success: true, 
      message: "✅ Article ajouté avec succès" + (evenementLie ? " (relation en cours)" : ""),
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

// ✅ GET all articles with event relations - VERSION SIMPLIFIÉE
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
      ORDER BY ?aNom
    `;

    console.log("🔍 Exécution requête articles...");

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    console.log(`📦 ${response.data.results.bindings.length} articles trouvés`);

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

// ✅ GET available evenements for linking
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

    console.log(`📋 ${results.length} événements disponibles`);

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

// ✅ Test endpoint pour vérifier les données
router.get("/test/data", async (req, res) => {
  try {
    // Vérifier les articles
    const articlesQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT (COUNT(?a) as ?articleCount)
      WHERE { ?a a sh:Article . }
    `;

    // Vérifier les événements
    const eventsQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT (COUNT(?e) as ?eventCount)
      WHERE { ?e a sh:Evenement . }
    `;

    // Vérifier les relations
    const relationsQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT (COUNT(?r) as ?relationCount)
      WHERE { ?a sh:estLieA ?e . }
    `;

    const [articlesRes, eventsRes, relationsRes] = await Promise.all([
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: articlesQuery },
        headers: { Accept: "application/sparql-results+json" },
      }),
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: eventsQuery },
        headers: { Accept: "application/sparql-results+json" },
      }),
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: relationsQuery },
        headers: { Accept: "application/sparql-results+json" },
      })
    ]);

    res.json({
      success: true,
      data: {
        articles: parseInt(articlesRes.data.results.bindings[0]?.articleCount?.value || 0),
        evenements: parseInt(eventsRes.data.results.bindings[0]?.eventCount?.value || 0),
        relations: parseInt(relationsRes.data.results.bindings[0]?.relationCount?.value || 0),
        fuseki: "Connecté"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur test données: " + error.message
    });
  }
});

// ✅ CREATE simple test article
router.post("/test/create-simple", async (req, res) => {
  try {
    const articleId = `test_article_${Date.now()}`;
    
    const query = `
      PREFIX sh: <${PREFIX}>

      INSERT DATA {
        sh:${articleId} a sh:Article ;
          sh:aNom "Article Test" ;
          sh:aDescriptionArc "Description de test" ;
          sh:aTypePai "Standard" ;
          sh:aImageArct "" .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({ 
      success: true, 
      message: "✅ Article test créé avec succès",
      id: articleId
    });
  } catch (error) {
    console.error("❌ Error creating test article:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false,
      error: "Erreur création test: " + (error.response?.data || error.message) 
    });
  }
});

// Les autres routes (GET single, PUT, DELETE, SEARCH) restent similaires...

module.exports = router;