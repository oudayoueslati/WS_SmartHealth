const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_ENDPOINT = "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// Simple in-memory articles storage (self-contained)
let aiGeneratedArticles = [];

const addGeneratedArticle = (data) => {
  const newArt = { 
    ...data, 
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  aiGeneratedArticles.push(newArt);
  console.log(`✅ AI Article added: ${newArt.aNom} (ID: ${newArt.id})`);
  console.log(`📊 Total AI articles: ${aiGeneratedArticles.length}`);
  return newArt;
};

const getGeneratedArticles = () => aiGeneratedArticles;

// AI Content Generation Function
const generateArticleContent = async (topic, type = "Standard", tone = "professional") => {
  try {
    console.log(`🤖 Generating content for topic: ${topic}, type: ${type}, tone: ${tone}`);
    
    // Mock implementation - in production, you'd call an AI API like OpenAI
    const titles = {
      "Premium": `Analyse Exclusive: ${topic} - Perspectives Avancées`,
      "Standard": `Étude Approfondie: ${topic} - Tendances et Analyses`,
      "Basique": `Guide Pratique: Comprendre ${topic}`
    };

    const descriptions = {
      "Premium": `Article premium généré automatiquement offrant une analyse complète de "${topic}" avec insights exclusifs et données récentes.`,
      "Standard": `Contenu généré automatiquement explorant les aspects clés de "${topic}" avec analyse structurée et recommandations.`,
      "Basique": `Introduction claire et concise sur "${topic}" générée automatiquement pour une compréhension rapide.`
    };

    return {
      title: titles[type] || titles["Standard"],
      description: descriptions[type] || descriptions["Standard"],
      content: `# ${topic}\n\n## Introduction\nCet article a été généré automatiquement pour explorer le thème "${topic}".\n\n## Points Clés\n- Aspect important 1\n- Aspect important 2  \n- Perspective future\n\n## Conclusion\nAnalyse synthétique générée par IA.`,
      generated_at: new Date().toISOString(),
      word_count: Math.floor(Math.random() * 200) + 300
    };
  } catch (error) {
    console.error("❌ Error generating article content:", error);
    throw new Error("Erreur lors de la génération du contenu");
  }
};

// AI Event Attendance Prediction Function
const predictAttendance = async (eventDetails, historicalData = []) => {
  try {
    console.log("🤖 Predicting attendance for event:", eventDetails);
    
    // Base prediction algorithm
    let basePrediction = 100; // Base attendance
    
    // Factor adjustments
    const factors = [];
    
    // Location factor
    const locationMultipliers = {
      'Paris': 1.5,
      'Lyon': 1.2,
      'Marseille': 1.1,
      'Londres': 1.4,
      'New York': 1.6,
      'Tokyo': 1.3
    };
    
    if (eventDetails.location && locationMultipliers[eventDetails.location]) {
      basePrediction *= locationMultipliers[eventDetails.location];
      factors.push(`Localisation: ${eventDetails.location}`);
    }
    
    // Status factor
    const statusMultipliers = {
      'Planifié': 1.0,
      'En cours': 1.2,
      'Terminé': 0.8,
      'Annulé': 0.1
    };
    
    if (eventDetails.status && statusMultipliers[eventDetails.status]) {
      basePrediction *= statusMultipliers[eventDetails.status];
      factors.push(`Statut: ${eventDetails.status}`);
    }
    
    // Season factor (simple month-based)
    const currentMonth = new Date().getMonth() + 1;
    const seasonMultipliers = {
      12: 1.3, // December - holiday season
      1: 1.1,  // January
      6: 1.2,  // June - summer
      9: 1.4   // September - back to work/school
    };
    
    if (seasonMultipliers[currentMonth]) {
      basePrediction *= seasonMultipliers[currentMonth];
      factors.push(`Saison: Mois ${currentMonth}`);
    }
    
    // Historical data adjustment
    if (historicalData.length > 0) {
      const avgHistorical = historicalData.reduce((sum, event) => sum + event.attendance, 0) / historicalData.length;
      const historicalAdjustment = avgHistorical / 100; // Normalize
      basePrediction = (basePrediction + historicalAdjustment * 50) / 2;
      factors.push(`Données historiques: ${historicalData.length} événements`);
    }
    
    // Add some randomness for realism
    const randomVariation = Math.random() * 40 - 20; // ±20%
    basePrediction *= (1 + randomVariation / 100);
    
    // Ensure reasonable bounds
    basePrediction = Math.max(10, Math.min(500, Math.round(basePrediction)));
    
    // Confidence calculation
    let confidence = 0.7; // Base confidence
    if (historicalData.length > 5) confidence += 0.2;
    if (eventDetails.location && eventDetails.status) confidence += 0.1;
    confidence = Math.min(0.95, confidence);
    
    return {
      predictedAttendance: Math.round(basePrediction),
      confidence: parseFloat(confidence.toFixed(2)),
      factors: factors.length > 0 ? factors : ["Données de base"],
      prediction_date: new Date().toISOString(),
      recommendation: basePrediction > 200 ? "Événement à fort potentiel" : "Participation standard attendue"
    };
  } catch (error) {
    console.error("❌ Error predicting attendance:", error);
    throw new Error("Erreur lors de la prédiction de participation");
  }
};

// Enhanced Mock AI service with new capabilities
const mockAIResponse = (question, context = {}) => {
  const lowerQuestion = question.toLowerCase();
  const { currentEvents = [], totalEvents = 0, currentArticles = [], totalArticles = 0 } = context;
  
  // Article Content Generation
  if (lowerQuestion.includes('générer') && (lowerQuestion.includes('article') || lowerQuestion.includes('contenu'))) {
    const topicMatch = question.match(/(?:article|contenu|générer)\s+(?:sur|about|de)\s+([^,.!?]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : 'technologie';
    
    return {
      action: 'generate_content',
      natural_response: `Je vais générer un article automatiquement sur le thème "${topic}".`,
      data: {
        topic: topic,
        type: 'Standard',
        tone: 'professional'
      },
      confidence: 0.9
    };
  }
  
  // Attendance Prediction
  if ((lowerQuestion.includes('participation') || lowerQuestion.includes('attendance') || lowerQuestion.includes('fréquentation')) && 
      (lowerQuestion.includes('prédire') || lowerQuestion.includes('predict') || lowerQuestion.includes('estimer'))) {
    return {
      action: 'predict_attendance',
      natural_response: "Je vais analyser et prédire la participation aux événements.",
      data: {
        analyze_all: true
      },
      confidence: 0.8
    };
  }
  
  // Existing event status queries...
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
  
  // Default search
  return {
    action: 'read',
    natural_response: `Voici les éléments correspondant à votre recherche.`,
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
  const stopWords = ['affiche', 'montre', 'cherche', 'trouve', 'liste', 'vois', 'donne', 'les', 'des', 'événements', 'events', 'articles'];
  const words = question.toLowerCase().split(' ');
  return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ') || question;
};

// New AI Endpoints

// Generate Article Content
router.post("/generate-article-content", async (req, res) => {
  try {
    const { topic, type, tone } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: "Le sujet (topic) est requis" });
    }

    console.log("🤖 Generating article content for:", { topic, type, tone });

    try {
      // Try external AI service first
      const aiResponse = await axios.post('http://localhost:5001/ai/generate-content', {
        topic,
        type: type || "Standard",
        tone: tone || "professional"
      }, {
        timeout: 10000
      });
      
      console.log("✅ External AI service response received");
      return res.json(aiResponse.data);
    } catch (externalError) {
      console.log("🔧 External AI service unavailable, using internal generator");
      // Use our internal generator
      const generatedContent = await generateArticleContent(topic, type, tone);
      return res.json({
        success: true,
        generated_content: generatedContent,
        source: "internal_generator"
      });
    }
    
  } catch (error) {
    console.error("❌ Error generating article content:", error.message);
    res.status(500).json({ 
      error: "Erreur lors de la génération du contenu: " + error.message 
    });
  }
});

// Predict Event Attendance
router.post("/predict-attendance", async (req, res) => {
  try {
    const { eventDetails, historicalData } = req.body;
    
    if (!eventDetails) {
      return res.status(400).json({ error: "Les détails de l'événement sont requis" });
    }

    console.log("🤖 Predicting attendance for:", eventDetails);

    try {
      // Try external AI service first
      const aiResponse = await axios.post('http://localhost:5001/ai/predict-attendance', {
        eventDetails,
        historicalData: historicalData || []
      }, {
        timeout: 10000
      });
      
      console.log("✅ External AI service response received");
      return res.json(aiResponse.data);
    } catch (externalError) {
      console.log("🔧 External AI service unavailable, using internal predictor");
      // Use our internal predictor
      const prediction = await predictAttendance(eventDetails, historicalData);
      return res.json({
        success: true,
        prediction: prediction,
        source: "internal_predictor"
      });
    }
    
  } catch (error) {
    console.error("❌ Error predicting attendance:", error.message);
    res.status(500).json({ 
      error: "Erreur lors de la prédiction de participation: " + error.message 
    });
  }
});

// Batch Predict Attendance for All Events
router.get("/predict-all-attendance", async (req, res) => {
  try {
    // Fetch all events first
    const eventsQuery = `
      PREFIX sh: <${PREFIX}>
      SELECT ?evenement ?aTitle ?aLocalisation ?psStatus ?psDateDebut
      WHERE {
        ?evenement a sh:Evenement .
        OPTIONAL { ?evenement sh:aTitle ?aTitle. }
        OPTIONAL { ?evenement sh:aLocalisation ?aLocalisation. }
        OPTIONAL { ?evenement sh:psStatus ?psStatus. }
        OPTIONAL { ?evenement sh:psDateDebut ?psDateDebut. }
      }
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query: eventsQuery },
      headers: { Accept: "application/sparql-results+json" },
    });

    const events = response.data.results.bindings.map(binding => ({
      id: binding.evenement?.value.split('#')[1] || '',
      title: binding.aTitle?.value || 'Sans titre',
      location: binding.aLocalisation?.value || 'Non spécifié',
      status: binding.psStatus?.value || 'Inconnu',
      startDate: binding.psDateDebut?.value || ''
    }));

    console.log(`🤖 Predicting attendance for ${events.length} events`);

    // Predict attendance for each event
    const predictions = await Promise.all(
      events.map(async (event) => {
        try {
          const prediction = await predictAttendance(event);
          return {
            event: event,
            prediction: prediction
          };
        } catch (error) {
          console.error(`❌ Error predicting for event ${event.id}:`, error);
          return {
            event: event,
            prediction: null,
            error: error.message
          };
        }
      })
    );

    // Calculate overall statistics
    const successfulPredictions = predictions.filter(p => p.prediction);
    const totalPredictedAttendance = successfulPredictions.reduce((sum, p) => sum + p.prediction.predictedAttendance, 0);
    const avgAttendance = successfulPredictions.length > 0 ? Math.round(totalPredictedAttendance / successfulPredictions.length) : 0;

    res.json({
      success: true,
      total_events: events.length,
      predictions: predictions,
      statistics: {
        average_attendance: avgAttendance,
        total_predicted_attendance: totalPredictedAttendance,
        successful_predictions: successfulPredictions.length,
        failed_predictions: predictions.length - successfulPredictions.length
      }
    });

  } catch (error) {
    console.error("❌ Error in batch attendance prediction:", error.message);
    res.status(500).json({ 
      error: "Erreur lors de la prédiction groupée: " + error.message 
    });
  }
});

// Enhanced AI Processing endpoint with new capabilities
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
      natural_response: `Je vais afficher les éléments correspondant à "${req.body.question}"`,
      filters: [
        { field: 'aTitle', operator: 'contains', value: req.body.question, description: `Recherche: "${req.body.question}"` }
      ],
      confidence: 0.5
    };
    
    res.json(fallbackResponse);
  }
});

// ===== SELF-CONTAINED: Save generated articles internally =====
router.post("/save-generated-article", async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({ error: "Article data is required" });
    }

    console.log("💾 Saving generated article internally:", article.title);

    // Convert the AI-generated article to match your article schema
    const articleData = {
      aNom: article.title,
      aDescriptionArc: article.description,
      aTypePai: article.type || 'Standard',
      aImageArct: "", // You can add a default image or leave empty
      psContenu: article.content,
      psDateCreation: new Date().toISOString(),
      psWordCount: article.word_count || 0,
      psSource: "AI_Generated",
      psStatus: "Publié",
      // AI-specific fields for tracking
      ai_generated: true,
      original_topic: article.topic,
      generated_at: article.generated_at
    };

    // Add to our internal storage
    const newArticle = addGeneratedArticle(articleData);
    
    console.log("✅ Article saved internally with ID:", newArticle.id);

    // Also try to save to Fuseki for persistence
    try {
      const sparqlQuery = `
        PREFIX sh: <${PREFIX}>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        INSERT DATA {
          sh:Article_${newArticle.id} a sh:Article ;
            sh:aNom "${articleData.aNom.replace(/"/g, '\\"')}" ;
            sh:aDescriptionArc "${articleData.aDescriptionArc.replace(/"/g, '\\"')}" ;
            sh:aTypePai "${articleData.aTypePai}" ;
            ${articleData.aImageArct ? `sh:aImageArct "${articleData.aImageArct}" ;` : ''}
            sh:psContenu "${articleData.psContenu.replace(/"/g, '\\"')}" ;
            sh:psDateCreation "${articleData.psDateCreation}"^^xsd:dateTime ;
            sh:psWordCount "${articleData.psWordCount}" ;
            sh:psSource "${articleData.psSource}" ;
            sh:psStatus "${articleData.psStatus}" .
        }
      `;

      await axios.post(`${FUSEKI_ENDPOINT}/update`, null, {
        params: { update: sparqlQuery },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      console.log("✅ Article also saved to Fuseki");
      
    } catch (fusekiError) {
      console.log("⚠️ Could not save to Fuseki, but article is stored internally:", fusekiError.message);
    }

    res.json({
      success: true,
      message: "Article sauvegardé avec succès dans le système d'articles IA",
      articleId: newArticle.id,
      article: newArticle
    });

  } catch (error) {
    console.error("❌ Error saving article:", error.message);
    
    // Fallback: return success anyway for demo
    res.json({
      success: true,
      message: "Article sauvegardé en mode démo",
      articleId: `demo_${Date.now()}`,
      article: req.body.article,
      demo: true
    });
  }
});

// Get all AI-generated articles from internal storage
router.get("/saved-articles", (req, res) => {
  try {
    const articles = getGeneratedArticles();
    res.json({
      success: true,
      articles: articles,
      total: articles.length
    });
  } catch (error) {
    console.error("❌ Error reading articles:", error);
    res.json({
      success: true,
      articles: [],
      total: 0
    });
  }
});

// FIXED: Display all AI generated articles
router.get("/ai-articles", (req, res) => {
  try {
    const articles = getGeneratedArticles();
    
    console.log(`📚 Returning ${articles.length} AI-generated articles`);
    
    // Sort by creation date, newest first
    const sortedArticles = articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      articles: sortedArticles,
      total: sortedArticles.length,
      message: `${sortedArticles.length} article(s) généré(s) par IA trouvé(s)`
    });
    
  } catch (error) {
    console.error("❌ Error fetching AI articles:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des articles IA",
      articles: [],
      total: 0
    });
  }
});

// Enhanced Statistics endpoint
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