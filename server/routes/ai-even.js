const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// Enhanced Mock AI service that uses actual event data
const mockAIResponse = (question, context = {}) => {
  const lowerQuestion = question.toLowerCase();
  const { currentEvents = [], totalEvents = 0 } = context;
  
  // Status queries
  if (lowerQuestion.includes('planifié') || lowerQuestion.includes('planifie')) {
    const plannedEvents = currentEvents.filter(e => e.status === 'Planifié');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${plannedEvents.length} événement(s) planifié(s) sur ${totalEvents} au total.`,
      filters: [
        { field: 'psStatus', operator: '==', value: 'Planifié', description: 'Statut: Planifié' }
      ],
      confidence: 0.9
    };
  }
  
  if (lowerQuestion.includes('en cours')) {
    const ongoingEvents = currentEvents.filter(e => e.status === 'En cours');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${ongoingEvents.length} événement(s) en cours sur ${totalEvents} au total.`,
      filters: [
        { field: 'psStatus', operator: '==', value: 'En cours', description: 'Statut: En cours' }
      ],
      confidence: 0.9
    };
  }
  
  if (lowerQuestion.includes('terminé') || lowerQuestion.includes('termine')) {
    const completedEvents = currentEvents.filter(e => e.status === 'Terminé');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${completedEvents.length} événement(s) terminé(s) sur ${totalEvents} au total.`,
      filters: [
        { field: 'psStatus', operator: '==', value: 'Terminé', description: 'Statut: Terminé' }
      ],
      confidence: 0.9
    };
  }
  
  if (lowerQuestion.includes('annulé') || lowerQuestion.includes('annule')) {
    const cancelledEvents = currentEvents.filter(e => e.status === 'Annulé');
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${cancelledEvents.length} événement(s) annulé(s) sur ${totalEvents} au total.`,
      filters: [
        { field: 'psStatus', operator: '==', value: 'Annulé', description: 'Statut: Annulé' }
      ],
      confidence: 0.9
    };
  }
  
  // Location-based queries
  const locations = ['paris', 'lyon', 'marseille', 'toulouse', 'londres', 'new york', 'tokyo'];
  const foundLocation = locations.find(loc => lowerQuestion.includes(loc));
  if (foundLocation) {
    const locationEvents = currentEvents.filter(e => 
      e.location && e.location.toLowerCase().includes(foundLocation)
    );
    return {
      action: 'read',
      natural_response: `J'ai trouvé ${locationEvents.length} événement(s) à ${foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1)}.`,
      filters: [
        { field: 'aLocalisation', operator: 'contains', value: foundLocation, description: `Localisation: ${foundLocation}` }
      ],
      confidence: 0.8
    };
  }
  
  // Title-based search
  if (lowerQuestion.includes('conférence') || lowerQuestion.includes('conference')) {
    return {
      action: 'read',
      natural_response: "Voici les événements de type conférence.",
      filters: [
        { field: 'aTitle', operator: 'contains', value: 'conférence', description: 'Type: Conférence' }
      ],
      confidence: 0.7
    };
  }
  
  if (lowerQuestion.includes('réunion') || lowerQuestion.includes('reunion')) {
    return {
      action: 'read',
      natural_response: "Voici les événements de type réunion.",
      filters: [
        { field: 'aTitle', operator: 'contains', value: 'réunion', description: 'Type: Réunion' }
      ],
      confidence: 0.7
    };
  }
  
  // Creation
  if (lowerQuestion.includes('ajout') || lowerQuestion.includes('cré') || lowerQuestion.includes('nouveau') || lowerQuestion.includes('add')) {
    return {
      action: 'create',
      natural_response: `J'ai détecté que vous voulez créer un nouvel événement. Je vais le faire automatiquement!`,
      data: {
        aTitle: extractTitle(question),
        aLocalisation: extractLocation(question),
        psStatus: 'Planifié',
        psDateDebut: new Date().toISOString().split('T')[0],
        psDateFin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        psDescription: extractDescription(question)
      },
      confidence: 0.9
    };
  }
  
  // Default search
  return {
    action: 'read',
    natural_response: `Voici les événements correspondant à votre recherche.`,
    filters: [
      { field: 'aTitle', operator: 'contains', value: extractSearchTerm(question), description: `Recherche: "${extractSearchTerm(question)}"` }
    ],
    confidence: 0.6
  };
};

// Helper functions
const extractTitle = (question) => {
  const matches = question.match(/(?:événement|event|meeting|réunion|conférence)\s+([^,.!?]+)/i);
  return matches ? matches[1].trim() : 'Nouvel Événement';
};

const extractLocation = (question) => {
  const locations = ['paris', 'lyon', 'marseille', 'toulouse', 'londres', 'new york', 'tokyo'];
  const found = locations.find(loc => question.toLowerCase().includes(loc));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'Non spécifié';
};

const extractDescription = (question) => {
  return `Événement créé via commande vocale: "${question.substring(0, 100)}"`;
};

const extractSearchTerm = (question) => {
  const stopWords = ['affiche', 'montre', 'cherche', 'trouve', 'liste', 'vois', 'donne', 'les', 'des', 'événements', 'events'];
  const words = question.toLowerCase().split(' ');
  return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ') || question;
};

// AI Processing endpoint
router.post("/process-evenements", async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("🤖 Processing AI question:", question);
    console.log("📊 Context received:", context);

    try {
      const aiResponse = await axios.post('http://localhost:5001/ai/process', {
        question,
        context
      }, {
        timeout: 5000
      });
      
      console.log("✅ External AI service response:", aiResponse.data);
      return res.json(aiResponse.data);
    } catch (externalError) {
      console.log("🔧 External AI service unavailable, using enhanced mock service");
      const mockResponse = mockAIResponse(question, context);
      console.log("🔧 Enhanced mock AI response:", mockResponse);
      return res.json(mockResponse);
    }
    
  } catch (error) {
    console.error("❌ AI Processing Error:", error.message);
    
    const fallbackResponse = {
      action: 'read',
      natural_response: `Je vais afficher les événements correspondant à "${req.body.question}"`,
      filters: [
        { field: 'aTitle', operator: 'contains', value: req.body.question, description: `Recherche: "${req.body.question}"` }
      ],
      confidence: 0.5
    };
    
    res.json(fallbackResponse);
  }
});

// Enhanced Statistics endpoint with better error handling
router.get("/stats/evenements", async (req, res) => {
  try {
    // Query for status statistics
    const statusQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT ?status (COUNT(?evenement) as ?count)
      WHERE {
        ?evenement a sh:Evenement ;
                   sh:psStatus ?status .
      }
      GROUP BY ?status
    `;

    // Query for monthly statistics
    const monthlyQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT (MONTH(?date) as ?month) (COUNT(?evenement) as ?count)
      WHERE {
        ?evenement a sh:Evenement ;
                   sh:psDateDebut ?date .
      }
      GROUP BY (MONTH(?date))
      ORDER BY ?month
    `;

    const [statusResponse, monthlyResponse] = await Promise.all([
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: statusQuery },
        headers: { Accept: "application/sparql-results+json" },
      }),
      axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
        params: { query: monthlyQuery },
        headers: { Accept: "application/sparql-results+json" },
      })
    ]);

    const statusStats = statusResponse.data.results.bindings.map(item => ({
      status: item.status.value,
      count: parseInt(item.count.value)
    }));

    const monthlyStats = monthlyResponse.data.results.bindings.map(item => ({
      month: parseInt(item.month.value),
      count: parseInt(item.count.value)
    }));

    const total = statusStats.reduce((sum, item) => sum + item.count, 0);

    res.json({
      status: statusStats,
      monthly: monthlyStats,
      total: total
    });

  } catch (error) {
    
    res.status(500).json({ 
      error: error.message,
      status: [],
      monthly: [],
      total: 0
    });
  }
});

module.exports = router;