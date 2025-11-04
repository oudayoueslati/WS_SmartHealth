const express = require("express");
const axios = require("axios");
const { FUSEKI_URL, fusekiAuth } = require('../config/fuseki');
const router = express.Router();
const {
  analyzeQuestion,
  formatResponse
} = require("../services/medicalAssistantService");


/**
 * POST /api/assistant/ask
 * Pose une question à l'assistant médical
 */
router.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Question is required"
    });
  }

  try {
    // 1. Analyser la question et générer la requête SPARQL
    const queryInfo = analyzeQuestion(question);

    console.log('Question:', question);
    console.log('Generated SPARQL:', queryInfo.query);

    // 2. Exécuter la requête SPARQL sur Fuseki
    const sparqlResponse = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query: queryInfo.query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const bindings = sparqlResponse.data.results.bindings;

    // 3. Formater la réponse en langage naturel
    const formattedResponse = formatResponse(bindings, queryInfo);

    res.json({
      success: true,
      question,
      answer: formattedResponse.answer,
      data: bindings,
      queryInfo: {
        category: queryInfo.category,
        type: queryInfo.type,
        description: queryInfo.description,
        sparqlQuery: queryInfo.query
      },
      suggestion: queryInfo.suggestion
    });

  } catch (err) {
    console.error("Error in medical assistant:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to process question",
      message: err.message
    });
  }
});

/**
 * GET /api/assistant/examples
 * Retourne des exemples de questions
 */
router.get("/examples", (req, res) => {
  const examples = [
    {
      category: "Services",
      questions: [
        "Quels sont les services médicaux disponibles ?",
        "Liste des services pour les maladies cardiaques",
        "Services de télémédecine disponibles"
      ]
    },
    {
      category: "Prix",
      questions: [
        "Combien coûte une consultation en cardiologie ?",
        "Quel est le prix d'une analyse sanguine ?",
        "Tarif pour une téléconsultation"
      ]
    },
    {
      category: "Examens",
      questions: [
        "Quels examens sont inclus dans un check-up complet ?",
        "Que comprend une consultation cardiologie ?",
        "Contenu d'une analyse sanguine"
      ]
    },
    {
      category: "Patients",
      questions: [
        "Combien de patients sont enregistrés ?",
        "Liste des utilisateurs",
        "Qui sont les patients ?"
      ]
    },
    {
      category: "Paiements",
      questions: [
        "Historique des paiements de nawrasse_elbenna",
        "Combien a payé l'utilisateur John ?",
        "Total des paiements pour Marie"
      ]
    },
    {
      category: "Statistiques",
      questions: [
        "Statistiques des services",
        "Combien de consultations ?",
        "Nombre de paiements par statut"
      ]
    }
  ];

  res.json({
    success: true,
    examples
  });
});

/**
 * GET /api/assistant/capabilities
 * Retourne les capacités de l'assistant
 */
router.get("/capabilities", (req, res) => {
  const capabilities = {
    categories: [
      {
        name: "Services médicaux",
        description: "Recherche et liste des services disponibles",
        examples: ["Quels services pour le diabète ?", "Liste des consultations"]
      },
      {
        name: "Tarification",
        description: "Information sur les prix des services",
        examples: ["Combien coûte une consultation ?", "Prix d'une analyse"]
      },
      {
        name: "Examens et détails",
        description: "Contenu et détails des services",
        examples: ["Que comprend un check-up ?", "Examens inclus"]
      },
      {
        name: "Gestion patients",
        description: "Information sur les utilisateurs",
        examples: ["Liste des patients", "Combien d'utilisateurs ?"]
      },
      {
        name: "Historique paiements",
        description: "Consultation des paiements",
        examples: ["Paiements de John", "Historique financier"]
      },
      {
        name: "Statistiques",
        description: "Données agrégées et analyses",
        examples: ["Statistiques des services", "Nombre de consultations"]
      }
    ],
    features: [
      "Compréhension du langage naturel",
      "Traduction automatique en SPARQL",
      "Réponses formatées en français",
      "Support de questions complexes",
      "Suggestions de reformulation"
    ]
  };

  res.json({
    success: true,
    capabilities
  });
});

module.exports = router;
