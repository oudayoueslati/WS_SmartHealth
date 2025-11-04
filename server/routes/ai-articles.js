const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// Enhanced Mock AI service for articles
const mockAIResponse = (question, context = {}) => {
  const lowerQuestion = question.toLowerCase();
  const { currentArticles = [], totalArticles = 0 } = context;
  
  // Type-based queries
  if (lowerQuestion.includes('premium')) {
    const premiumArticles = currentArticles.filter(a => a.type === 'Premium');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${premiumArticles.length} article(s) premium sur ${totalArticles} au total.`,
      filters: [
        { field: 'aTypePai', operator: '==', value: 'Premium', description: 'Type: Premium' }
      ],
      confidence: 0.9
    };
  }
  
  if (lowerQuestion.includes('standard')) {
    const standardArticles = currentArticles.filter(a => a.type === 'Standard');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${standardArticles.length} article(s) standard sur ${totalArticles} au total.`,
      filters: [
        { field: 'aTypePai', operator: '==', value: 'Standard', description: 'Type: Standard' }
      ],
      confidence: 0.9
    };
  }
  
  if (lowerQuestion.includes('basique')) {
    const basicArticles = currentArticles.filter(a => a.type === 'Basique');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${basicArticles.length} article(s) basique sur ${totalArticles} au total.`,
      filters: [
        { field: 'aTypePai', operator: '==', value: 'Basique', description: 'Type: Basique' }
      ],
      confidence: 0.9
    };
  }
  
  // Name-based search
  if (lowerQuestion.includes('conférence') || lowerQuestion.includes('conference')) {
    const conferenceArticles = currentArticles.filter(a => 
      a.name && a.name.toLowerCase().includes('conférence')
    );
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${conferenceArticles.length} article(s) de conférence.`,
      filters: [
        { field: 'aNom', operator: 'contains', value: 'conférence', description: 'Nom contient: conférence' }
      ],
      confidence: 0.8
    };
  }
  
  if (lowerQuestion.includes('réunion') || lowerQuestion.includes('reunion')) {
    const meetingArticles = currentArticles.filter(a => 
      a.name && a.name.toLowerCase().includes('réunion')
    );
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${meetingArticles.length} article(s) de réunion.`,
      filters: [
        { field: 'aNom', operator: 'contains', value: 'réunion', description: 'Nom contient: réunion' }
      ],
      confidence: 0.8
    };
  }
  
  // Creation
  if (lowerQuestion.includes('ajout') || lowerQuestion.includes('cré') || lowerQuestion.includes('nouveau') || lowerQuestion.includes('add')) {
    return {
      action: 'create',
      natural_response: `J'ai détecté que vous voulez créer un nouvel article. Je vais le faire automatiquement!`,
      data: {
        aNom: extractArticleName(question),
        aDescriptionArc: extractArticleDescription(question),
        aTypePai: extractArticleType(question),
        aImageArct: "",
        evenementLie: extractEventLink(question)
      },
      confidence: 0.9
    };
  }
  
  // Search by description
  if (lowerQuestion.includes('description') || lowerQuestion.includes('contenu')) {
    const searchTerm = extractSearchTerm(question);
    return {
      action: 'read',
      natural_response: `Recherche d'articles avec: "${searchTerm}"`,
      filters: [
        { field: 'aDescriptionArc', operator: 'contains', value: searchTerm, description: `Description: ${searchTerm}` }
      ],
      confidence: 0.7
    };
  }
  
  // Default search
  return {
    action: 'read',
    natural_response: `Voici les articles correspondant à votre recherche.`,
    filters: [
      { field: 'aNom', operator: 'contains', value: extractSearchTerm(question), description: `Recherche: "${extractSearchTerm(question)}"` }
    ],
    confidence: 0.6
  };
};

// Helper functions for articles
const extractArticleName = (question) => {
  const matches = question.match(/(?:article|post|blog)\s+([^,.!?]+)/i);
  return matches ? matches[1].trim() : 'Nouvel Article';
};

const extractArticleDescription = (question) => {
  return `Article créé via commande vocale: "${question.substring(0, 100)}"`;
};

const extractArticleType = (question) => {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('premium')) return 'Premium';
  if (lowerQuestion.includes('standard')) return 'Standard';
  if (lowerQuestion.includes('basique')) return 'Basique';
  return 'Standard';
};

const extractEventLink = (question) => {
  // Extract event ID from question if mentioned
  const eventMatch = question.match(/evenement[_\s]?(\w+)/i);
  return eventMatch ? eventMatch[1] : "";
};

const extractSearchTerm = (question) => {
  const stopWords = ['affiche', 'montre', 'cherche', 'trouve', 'liste', 'vois', 'donne', 'les', 'des', 'articles', 'posts'];
  const words = question.toLowerCase().split(' ');
  return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ') || question;
};

// AI Processing endpoint for articles - FIXED VERSION
router.post("/process-articles", async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("🤖 Processing AI question for articles:", question);
    console.log("📊 Context received:", context);

    // FIX: Use mock AI service directly since external service is not available
    console.log("🔧 Using enhanced mock AI service for articles");
    const mockResponse = mockAIResponse(question, context);
    console.log("🔧 Enhanced mock AI response:", mockResponse);
    
    return res.json(mockResponse);
    
  } catch (error) {
    console.error("❌ AI Processing Error:", error.message);
    
    const fallbackResponse = {
      action: 'read',
      natural_response: `Je vais afficher les articles correspondant à "${req.body.question}"`,
      filters: [
        { field: 'aNom', operator: 'contains', value: req.body.question, description: `Recherche: "${req.body.question}"` }
      ],
      confidence: 0.5
    };
    
    res.json(fallbackResponse);
  }
});

// Statistics endpoint for articles
router.get("/stats/articles", async (req, res) => {
  try {
    // Query for type statistics
    const typeQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT ?type (COUNT(?article) as ?count)
      WHERE {
        ?article a sh:Article ;
                 sh:aTypePai ?type .
      }
      GROUP BY ?type
    `;

    // Query for articles with event relations
    const relationsQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT (COUNT(?article) as ?withEvent) (COUNT(?article2) as ?total)
      WHERE {
        { SELECT ?article WHERE { ?article sh:estLieA ?event . } }
        UNION
        { SELECT ?article2 WHERE { ?article2 a sh:Article . } }
      }
    `;

    const [typeResponse, relationsResponse] = await Promise.all([
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: typeQuery },
        headers: { Accept: "application/sparql-results+json" },
      }),
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: relationsQuery },
        headers: { Accept: "application/sparql-results+json" },
      })
    ]);

    const typeStats = typeResponse.data.results.bindings.map(item => ({
      type: item.type.value,
      count: parseInt(item.count.value)
    }));

    const relationsData = relationsResponse.data.results.bindings[0];
    const withEvent = parseInt(relationsData?.withEvent?.value || 0);
    const total = parseInt(relationsData?.total?.value || 0);

    res.json({
      types: typeStats,
      relations: {
        withEvent,
        withoutEvent: total - withEvent,
        total
      }
    });

  } catch (error) {
    console.error("❌ Error fetching article statistics:", error.message);
    res.status(500).json({ 
      error: error.message,
      types: [
        { type: "Premium", count: 2 },
        { type: "Standard", count: 5 },
        { type: "Basique", count: 3 }
      ],
      relations: {
        withEvent: 3,
        withoutEvent: 7,
        total: 10
      }
    });
  }
});

module.exports = router;