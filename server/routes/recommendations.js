const express = require("express");
const axios = require("axios");
const router = express.Router();
const {
  recommendServices,
  getSmartSuggestions,
  calculateIMC
} = require("../services/recommendationService");

const FUSEKI_URL = process.env.FUSEKI_URL;

/**
 * POST /api/recommendations/search
 * Recherche intelligente de services avec recommandations
 */
router.post("/search", async (req, res) => {
  const { query, userProfile = {}, includeHistory = false } = req.body;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Query is required"
    });
  }

  try {
    // 1. Récupérer tous les services disponibles
    const servicesQuery = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
      
      SELECT ?service ?type ?label WHERE {
        ?service rdf:type ?type .
        FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
        OPTIONAL { ?service sh:label ?label }
      }
      ORDER BY ?service
    `;

    const servicesResponse = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query: servicesQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    const bindings = servicesResponse.data.results.bindings;
    const availableServices = bindings.map((b) => {
      const uri = b.service.value;
      const id = uri.split('#').pop();
      const typeUri = b.type.value;
      const type = typeUri.split('#').pop();
      
      return {
        id,
        uri,
        type,
        label: b.label?.value || id
      };
    });

    // 2. Récupérer l'historique utilisateur si demandé
    let userHistory = [];
    if (includeHistory && userProfile.username) {
      const historyQuery = `
        PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
        
        SELECT ?service ?date WHERE {
          ?payment a sh:PaiementFacture ;
                   sh:effectuéPar sh:Utilisateur_${userProfile.username} ;
                   sh:correspondÀ ?service ;
                   sh:datePaiement ?date .
        }
        ORDER BY DESC(?date)
        LIMIT 10
      `;

      try {
        const historyResponse = await axios.get(`${FUSEKI_URL}/query`, {
          params: { query: historyQuery },
          headers: { Accept: "application/sparql-results+json" },
        });

        userHistory = historyResponse.data.results.bindings.map(b => ({
          serviceUri: b.service.value,
          serviceType: b.service.value.split('#').pop(),
          date: b.date.value
        }));
      } catch (err) {
        console.warn("Could not fetch user history:", err.message);
      }
    }

    // 3. Générer les recommandations
    const recommendations = recommendServices(
      query,
      availableServices,
      userProfile,
      userHistory
    );

    // 4. Générer des suggestions intelligentes
    const smartSuggestions = getSmartSuggestions(query);

    res.json({
      success: true,
      query,
      recommendations,
      suggestions: smartSuggestions,
      totalServices: availableServices.length,
      userProfile: userProfile.age || userProfile.weight ? {
        ageRange: userProfile.age ? require("../services/recommendationService").getAgeRange(userProfile.age) : null,
        imc: userProfile.weight && userProfile.height ? 
          calculateIMC(userProfile.weight, userProfile.height) : null
      } : null
    });

  } catch (err) {
    console.error("Error in recommendation search:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
      message: err.message
    });
  }
});

/**
 * GET /api/recommendations/profile/:username
 * Recommandations personnalisées basées sur le profil complet
 */
router.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // Récupérer le profil utilisateur depuis Fuseki
    const profileQuery = `
      PREFIX ex: <http://example.org/>
      
      SELECT ?age ?weight ?height WHERE {
        ex:Utilisateur_${username} ex:age ?age .
        OPTIONAL { ex:Utilisateur_${username} ex:weight ?weight . }
        OPTIONAL { ex:Utilisateur_${username} ex:height ?height . }
      }
    `;

    const profileResponse = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query: profileQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    const profileBindings = profileResponse.data.results.bindings;
    if (profileBindings.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User profile not found"
      });
    }

    const userProfile = {
      username,
      age: parseInt(profileBindings[0].age?.value),
      weight: parseFloat(profileBindings[0].weight?.value),
      height: parseFloat(profileBindings[0].height?.value)
    };

    // Générer des recommandations générales basées sur le profil
    const { getProfileBasedRecommendations } = require("../services/recommendationService");
    const profileRecommendations = getProfileBasedRecommendations(userProfile);

    res.json({
      success: true,
      username,
      profile: {
        ...userProfile,
        imc: calculateIMC(userProfile.weight, userProfile.height),
        ageRange: require("../services/recommendationService").getAgeRange(userProfile.age)
      },
      recommendations: profileRecommendations
    });

  } catch (err) {
    console.error("Error fetching profile recommendations:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile recommendations",
      message: err.message
    });
  }
});

module.exports = router;
