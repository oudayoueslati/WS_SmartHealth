const express = require("express");
const axios = require("axios");
const router = express.Router();

// Configuration
const FUSEKI_URL = "http://localhost:3030";
const DATASET_NAME = "SmartHealth";
const FUSEKI_ENDPOINT = `${FUSEKI_URL}/${DATASET_NAME}`;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log(`🔧 Configuration Fuseki: ${FUSEKI_ENDPOINT}`);

// Test de connexion Fuseki
async function testFusekiConnection() {
  try {
    const query = "SELECT * WHERE { ?s ?p ?o } LIMIT 1";
    const params = new URLSearchParams();
    params.append('query', query);
    
    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json'
      },
      timeout: 8000
    });

    console.log('✅ Connexion Fuseki RÉUSSIE !');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur connexion Fuseki:', error.message);
    return false;
  }
}

// Exécution SPARQL
async function executeSparqlQuery(sparqlQuery, queryType = 'SELECT') {
  try {
    const url = queryType === 'SELECT' || queryType === 'ASK' 
      ? `${FUSEKI_ENDPOINT}/query` 
      : `${FUSEKI_ENDPOINT}/update`;

    const config = {
      headers: {
        'Accept': 'application/sparql-results+json'
      },
      timeout: 10000
    };

    let response;

    if (queryType === 'SELECT' || queryType === 'ASK') {
      const params = new URLSearchParams();
      params.append('query', sparqlQuery);
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      response = await axios.post(url, params, config);
    } else {
      config.headers['Content-Type'] = 'application/sparql-update';
      response = await axios.post(url, sparqlQuery, config);
    }

    console.log(`✅ Requête exécutée - ${response.data.results?.bindings?.length || 0} résultats`);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur SPARQL:', error.message);
    throw error;
  }
}

// Logique SAIF
class SaifAISparqlLogic {
  constructor() {
    this.contextHistory = [];
  }

  analyzeSemanticIntent(userPrompt) {
    const intent = {
      action: this.detectAction(userPrompt),
      entity: this.extractEntity(userPrompt)
    };

    this.contextHistory.push({ timestamp: new Date().toISOString(), prompt: userPrompt, intent: intent });
    return intent;
  }

  detectAction(prompt) {
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('créer') || promptLower.includes('ajouter')) return 'create';
    if (promptLower.includes('supprimer') || promptLower.includes('effacer')) return 'delete';
    if (promptLower.includes('modifier') || promptLower.includes('changer')) return 'update';
    return 'read';
  }

  extractEntity(prompt) {
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('nutrition') || promptLower.includes('calories') || promptLower.includes('manger') || promptLower.includes('repas')) 
      return { type: 'Nutrition', category: 'nutrition' };
    if (promptLower.includes('sommeil') || promptLower.includes('dormir') || promptLower.includes('nuit')) 
      return { type: 'Sommeil', category: 'sommeil' };
    if (promptLower.includes('activité') || promptLower.includes('sport') || promptLower.includes('exercice') || promptLower.includes('course') || promptLower.includes('pas')) 
      return { type: 'ActivitéPhysique', category: 'activité' };
    if (promptLower.includes('stress') || promptLower.includes('anxiété')) 
      return { type: 'Stress', category: 'stress' };
    return { type: 'Habitude', category: 'général' };
  }

  generateContextualSparql(intent) {
    const baseQuery = `
PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?habitude ?type ?titre ?description ?calories ?heures ?pas ?niveau ?date
WHERE {
  ?habitude a ?type .
  FILTER(STRSTARTS(STR(?type), "http://www.smarthealth-tracker.com/ontologie#"))
  OPTIONAL { ?habitude ont:aTitle ?titre . }
  OPTIONAL { ?habitude ont:aDescription ?description . }
  OPTIONAL { ?habitude ont:aCaloriesConsommées ?calories . }
  OPTIONAL { ?habitude ont:aNombreHeuresSommeil ?heures . }
  OPTIONAL { ?habitude ont:aPasEffectués ?pas . }
  OPTIONAL { ?habitude ont:aNiveauStress ?niveau . }
  OPTIONAL { ?habitude ont:aDateLog ?date . }`;

    if (intent.entity.type !== 'Habitude') {
      return baseQuery + `
  FILTER(?type = ont:${intent.entity.type})
}
ORDER BY DESC(?date) DESC(?habitude)
LIMIT 50`;
    }
    
    return baseQuery + `
}
ORDER BY DESC(?date) DESC(?habitude)
LIMIT 50`;
  }
}

const saifAI = new SaifAISparqlLogic();

// Formatage des résultats
function formatResults(resultatExecution) {
  if (!resultatExecution?.results?.bindings) return [];
  
  return resultatExecution.results.bindings.map(binding => {
    const resultat = {};
    Object.keys(binding).forEach(key => {
      if (binding[key]?.value) {
        let value = binding[key].value;
        
        // Nettoyer les URLs
        if (typeof value === 'string') {
          if (value.includes('#')) {
            value = value.split('#').pop();
          }
          if (value.includes('http://')) {
            const parts = value.split('/');
            value = parts[parts.length - 1] || parts[parts.length - 2] || value;
          }
        }
        
        resultat[key] = value;
      }
    });
    
    // Titres et descriptions par défaut
    const typeName = resultat.type ? resultat.type.replace('ont:', '') : 'Habitude';
    
    if (!resultat.titre || resultat.titre === 'undefined') {
      if (resultat.calories) {
        resultat.titre = `Nutrition - ${resultat.calories} calories`;
      } else if (resultat.heures) {
        resultat.titre = `Sommeil - ${resultat.heures} heures`;
      } else if (resultat.pas) {
        resultat.titre = `Activité - ${resultat.pas} pas`;
      } else if (resultat.niveau) {
        resultat.titre = `Stress - Niveau ${resultat.niveau}`;
      } else {
        resultat.titre = `${typeName}`;
      }
    }
    
    if (!resultat.description || resultat.description === 'undefined') {
      if (resultat.calories) {
        resultat.description = `Apport calorique de ${resultat.calories} calories`;
      } else if (resultat.heures) {
        resultat.description = `${resultat.heures} heures de sommeil`;
      } else if (resultat.pas) {
        resultat.description = `Activité physique de ${resultat.pas} pas`;
      } else if (resultat.niveau) {
        resultat.description = `Niveau de stress: ${resultat.niveau}`;
      } else {
        resultat.description = `${typeName} enregistrée`;
      }
    }
    
    // Nettoyer l'ID
    if (resultat.habitude) {
      resultat.habitude = resultat.habitude
        .replace('ont:', '')
        .replace('http://example.org/', '')
        .replace('http://www.smarthealth-tracker.com/ontologie#', '');
    }
    
    return resultat;
  });
}

// Données de simulation
function getSimulationData(intent) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (intent.entity.type === 'ActivitéPhysique') {
    return [
      {
        habitude: "activite_1",
        type: "ActivitéPhysique",
        titre: "Course matinale",
        description: "30 minutes de course au parc",
        pas: "8500",
        calories: "320",
        date: today
      },
      {
        habitude: "activite_2",
        type: "ActivitéPhysique", 
        titre: "Yoga du soir",
        description: "Session de yoga relaxante",
        pas: "1200",
        calories: "180",
        date: yesterday
      }
    ];
  } else if (intent.entity.type === 'Nutrition') {
    return [
      {
        habitude: "nutrition_1",
        type: "Nutrition",
        titre: "Petit déjeuner équilibré",
        description: "Omelette, toast, smoothie",
        calories: "450",
        date: today
      },
      {
        habitude: "nutrition_2",
        type: "Nutrition",
        titre: "Déjeuner protéiné",
        description: "Poulet grillé, quinoa, légumes",
        calories: "520",
        date: yesterday
      }
    ];
  } else if (intent.entity.type === 'Sommeil') {
    return [
      {
        habitude: "sommeil_1",
        type: "Sommeil",
        titre: "Nuit réparatrice",
        description: "Sommeil profond et continu",
        heures: "7.5",
        date: today
      }
    ];
  }
  
  return [
    {
      habitude: "habitude_1",
      type: "Habitude",
      titre: "Habitude santé",
      description: "Habitude générale de santé",
      date: today
    }
  ];
}

// ROUTES

// Route principale
router.post("/executer", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt requis" });
    }

    console.log("🚀 SAIF AI - Prompt:", prompt);

    const intent = saifAI.analyzeSemanticIntent(prompt);
    const sparqlQuery = saifAI.generateContextualSparql(intent);

    const fusekiConnected = await testFusekiConnection();

    if (!fusekiConnected) {
      return res.json({
        success: true,
        prompt,
        analyse: {
          intention: intent.action,
          entite: intent.entity.type,
          categorie: intent.entity.category
        },
        requeteSparql: sparqlQuery,
        resultats: getSimulationData(intent),
        mode: "Simulation",
        message: "❌ Fuseki non accessible - Mode simulation activé"
      });
    }

    try {
      const resultatExecution = await executeSparqlQuery(sparqlQuery);
      const resultatsFormates = formatResults(resultatExecution);

      res.json({
        success: true,
        prompt,
        analyse: {
          intention: intent.action,
          entite: intent.entity.type,
          categorie: intent.entity.category
        },
        requeteSparql: sparqlQuery,
        resultats: resultatsFormates,
        mode: "Données réelles",
        message: `✅ ${resultatsFormates.length} résultat(s) trouvé(s)`
      });

    } catch (queryError) {
      res.json({
        success: true,
        prompt,
        analyse: {
          intention: intent.action,
          entite: intent.entity.type,
          categorie: intent.entity.category
        },
        requeteSparql: sparqlQuery,
        resultats: getSimulationData(intent),
        mode: "Simulation",
        message: "❌ Erreur requête SPARQL - Mode simulation activé"
      });
    }

  } catch (error) {
    console.error("❌ Erreur backend:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route generate (pour le frontend)
router.post("/generate", async (req, res) => {
  try {
    const { prompt, messages } = req.body;

    if (!prompt && !messages) {
      return res.status(400).json({ 
        success: false, 
        message: "Prompt ou messages requis" 
      });
    }

    console.log("🤖 Génération IA - Données reçues:", { prompt, messages });

    const userMessage = prompt || (messages && messages[messages.length - 1]?.content) || "";
    const intent = saifAI.analyzeSemanticIntent(userMessage);
    const sparqlQuery = saifAI.generateContextualSparql(intent);

    console.log("📊 Intention détectée:", intent);
    console.log("🔍 Requête SPARQL générée:", sparqlQuery);

    const fusekiConnected = await testFusekiConnection();
    let resultats = [];
    let mode = "Simulation";

    if (fusekiConnected) {
      try {
        const resultatExecution = await executeSparqlQuery(sparqlQuery);
        resultats = formatResults(resultatExecution);
        mode = "Données réelles";
      } catch (error) {
        console.log("❌ Erreur requête SPARQL, utilisation des données simulées");
        resultats = getSimulationData(intent);
      }
    } else {
      resultats = getSimulationData(intent);
    }

    // Générer une réponse naturelle
    let responseText = "";
    
    if (resultats.length > 0) {
      if (intent.entity.type === 'ActivitéPhysique') {
        responseText = `🏃 **${resultats.length} activité(s) physique(s) trouvée(s)**\n\n`;
      } else if (intent.entity.type === 'Nutrition') {
        responseText = `🍎 **${resultats.length} entrée(s) nutritionnelle(s) trouvée(s)**\n\n`;
      } else if (intent.entity.type === 'Sommeil') {
        responseText = `💤 **${resultats.length} entrée(s) de sommeil trouvée(s)**\n\n`;
      } else {
        responseText = `📊 **${resultats.length} habitude(s) santé trouvée(s)**\n\n`;
      }
    } else {
      responseText = "🔍 **Aucune donnée trouvée** correspondant à votre recherche.\n\n";
      responseText += "💡 *Essayez d'ajouter des données ou utilisez des termes plus généraux.*";
    }

    res.json({
      success: true,
      response: responseText,
      results: resultats,
      analysis: {
        intent: intent.action,
        entity: intent.entity.type,
        category: intent.entity.category
      },
      sparql_query: sparqlQuery,
      mode: mode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erreur génération IA:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: "Désolé, une erreur s'est produite lors du traitement de votre demande."
    });
  }
});

// Route habitudes
router.get("/habits", async (req, res) => {
  try {
    console.log("📊 GET_ALL_HABITUDES - Début de la requête");
    
    const fusekiConnected = await testFusekiConnection();
    
    if (!fusekiConnected) {
      console.log("🔄 Habitudes - Mode simulation");
      const simulatedData = getSimulationData({ entity: { type: 'Habitude' } });
      return res.json({
        success: true,
        habits: simulatedData,
        count: simulatedData.length,
        mode: "Simulation",
        message: "Fuseki non accessible - Données simulées"
      });
    }

    const query = `
PREFIX ont: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?habitude ?type ?titre ?description ?calories ?heures ?pas ?niveau ?date
WHERE {
  ?habitude a ?type .
  FILTER(STRSTARTS(STR(?type), "http://www.smarthealth-tracker.com/ontologie#"))
  OPTIONAL { ?habitude ont:aTitle ?titre . }
  OPTIONAL { ?habitude ont:aDescription ?description . }
  OPTIONAL { ?habitude ont:aCaloriesConsommées ?calories . }
  OPTIONAL { ?habitude ont:aNombreHeuresSommeil ?heures . }
  OPTIONAL { ?habitude ont:aPasEffectués ?pas . }
  OPTIONAL { ?habitude ont:aNiveauStress ?niveau . }
  OPTIONAL { ?habitude ont:aDateLog ?date . }
}
ORDER BY DESC(?date) DESC(?habitude)`;

    console.log("📤 GET_ALL_HABITUDES - Envoi requête SPARQL...");
    const data = await executeSparqlQuery(query);
    const habits = formatResults(data);

    console.log(`📊 GET_ALL_HABITUDES - Données récupérées: ${habits.length} habitudes`);
    
    res.json({
      success: true,
      habits: habits,
      count: habits.length,
      mode: "Données réelles",
      message: `✅ ${habits.length} habitude(s) trouvée(s)`
    });

  } catch (error) {
    console.error("❌ Erreur récupération habitudes:", error);
    const simulatedData = getSimulationData({ entity: { type: 'Habitude' } });
    res.json({
      success: true,
      habits: simulatedData,
      count: simulatedData.length,
      mode: "Simulation",
      message: "Erreur - Données simulées"
    });
  }
});

// Route santé
router.get("/health", async (req, res) => {
  try {
    const fusekiConnected = await testFusekiConnection();
    
    res.json({
      success: true,
      status: "🟢 En ligne",
      timestamp: new Date().toISOString(),
      services: {
        backend: "🟢 Opérationnel",
        fuseki: fusekiConnected ? "🟢 Connecté" : "🔴 Déconnecté",
        dataset: DATASET_NAME,
        groq: GROQ_API_KEY ? "🟢 Configuré" : "🔴 Non configuré"
      },
      endpoints: {
        generate: "/api/saif-ai/generate",
        habits: "/api/saif-ai/habits",
        health: "/api/saif-ai/health",
        statut: "/api/saif-ai/statut"
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      status: "🔴 Erreur",
      error: error.message 
    });
  }
});

// Route statut
router.get("/statut", async (req, res) => {
  try {
    const fusekiConnected = await testFusekiConnection();
    
    res.json({
      success: true,
      systeme: "Saif AI - SmartHealth",
      backend: "🟢 En ligne",
      baseDeDonnees: {
        statut: fusekiConnected ? "🟢 Connecté" : "🔴 Déconnecté",
        nom: DATASET_NAME,
        url: FUSEKI_ENDPOINT
      },
      message: fusekiConnected 
        ? "✅ Système opérationnel - Prêt à recevoir des requêtes"
        : "❌ Fuseki inaccessible - Mode simulation activé"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route test
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend Saif AI fonctionnel",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

module.exports = router;
