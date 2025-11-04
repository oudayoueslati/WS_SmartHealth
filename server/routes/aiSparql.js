const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const FUSEKI_URL = process.env.FUSEKI_URL || "http://localhost:3030/usersDB";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ============================================
// Charger l'ontologie depuis le fichier
// ============================================
let ONTOLOGY_CONTENT = "";
let ONTOLOGY_CLASSES = [];
let ONTOLOGY_PROPERTIES = [];

const loadOntology = () => {
  try {
    const ontologyPath = path.join(__dirname, '..', 'ontology.ttl');
    if (fs.existsSync(ontologyPath)) {
      ONTOLOGY_CONTENT = fs.readFileSync(ontologyPath, 'utf8');
      console.log("✅ Ontologie chargée depuis:", ontologyPath);
      // Extraire les classes et propriétés pertinentes
      const classMatches = ONTOLOGY_CONTENT.matchAll(/ontologie:(\w+)\s+rdf:type\s+owl:Class/g);
      ONTOLOGY_CLASSES = [...classMatches].map(match => match[1]).filter(c => ["Utilisateur", "ProgrammeSante"].includes(c));
      const propMatches = ONTOLOGY_CONTENT.matchAll(/ontologie:(\w+)\s+rdf:type\s+owl:(?:Object|Datatype)Property/g);
      ONTOLOGY_PROPERTIES = [...propMatches].map(match => match[1]).filter(p => ["SMedicale"].includes(p)); // Garder seulement les propriétés pertinentes
      console.log("📊 Classes trouvées:", ONTOLOGY_CLASSES);
      console.log("🔗 Propriétés trouvées:", ONTOLOGY_PROPERTIES);
    } else {
      console.warn("⚠️ Fichier ontology.ttl non trouvé à:", ontologyPath);
      console.warn("⚠️ Utilisation de l'ontologie par défaut");
      useDefaultOntology();
    }
  } catch (error) {
    console.error("❌ Erreur lors du chargement de l'ontologie:", error);
    useDefaultOntology();
  }
};

const useDefaultOntology = () => {
  ONTOLOGY_CLASSES = ["Utilisateur", "ProgrammeSante"];
  ONTOLOGY_PROPERTIES = ["SMedicale"];
  ONTOLOGY_CONTENT = `Classes disponibles: ${ONTOLOGY_CLASSES.join(", ")} Propriétés disponibles: ${ONTOLOGY_PROPERTIES.join(", ")}`;
};

// Charger l'ontologie au démarrage
loadOntology();

// ============================================
// Système de prompts basé sur votre ontologie simplifiée
// ============================================
const generateSystemPrompt = () => {
  return `Tu es un expert en Web Sémantique et SPARQL. Tu génères des requêtes SPARQL précises basées sur l'ontologie Smart Health Tracker, en te concentrant uniquement sur Utilisateur et ProgrammeSante.

ONTOLOGIE COMPLÈTE : ${ONTOLOGY_CONTENT}

PRÉFIXES À UTILISER :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

CLASSES DISPONIBLES :
${ONTOLOGY_CLASSES.map(c => `- ontologie:${c}`).join('\n')}

PROPRIÉTÉS DISPONIBLES :
${ONTOLOGY_PROPERTIES.map(p => `- ontologie:${p}`).join('\n')}

RÈGLES IMPORTANTES :
1. **Préfixes obligatoires** : Toujours inclure PREFIX ontologie: et PREFIX ex:
2. **Classes** : Utilise ontologie:NomClasse (ex: ontologie:Utilisateur, ontologie:ProgrammeSante)
3. **Propriétés** : Utilise ontologie:nomPropriété (ex: ontologie:SMedicale)
4. **Instances** : Utilise ex:nom_id (ex: ex:user_123, ex:program_456)
5. **Types** : Pour typer une instance, utilise "a" ou "rdf:type"
6. **Dates** : Format ISO avec type xsd:dateTime
7. **OPTIONAL** : Pour les propriétés facultatives
8. **FILTER** : Pour les conditions

EXEMPLES ADAPTÉS À VOTRE ONTOLOGIE :
Exemple 1 - Créer un utilisateur avec programme :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
INSERT DATA {
  ex:user_123 a ontologie:Utilisateur .
  ex:program_456 a ontologie:ProgrammeSante .
  ex:program_456 ontologie:SMedicale ex:user_123 .
}

Exemple 2 - Assigner un programme à un utilisateur :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
INSERT DATA {
  ex:program_123 ontologie:SMedicale ex:user_456 .
}

Exemple 3 - Trouver tous les utilisateurs avec leurs programmes :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
SELECT ?user ?program WHERE {
  ?user a ontologie:Utilisateur .
  OPTIONAL { ?program ontologie:SMedicale ?user . }
}

Exemple 4 - Trouver les programmes d'un utilisateur :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
SELECT ?program WHERE {
  ?program ontologie:SMedicale ex:user_123 .
}

Exemple 5 - Compter les programmes par utilisateur :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?user (COUNT(?program) as ?count) WHERE {
  ?user a ontologie:Utilisateur .
  OPTIONAL { ?program ontologie:SMedicale ?user . }
} GROUP BY ?user ORDER BY DESC(?count)

Exemple 6 - Trouver les utilisateurs sans programme :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?user WHERE {
  ?user a ontologie:Utilisateur .
  FILTER NOT EXISTS { ?program ontologie:SMedicale ?user . }
}

CONTEXTE IMPORTANT :
Relations clés dans votre ontologie :
- ontologie:SMedicale : Lie ProgrammeSante -> Utilisateur

INSTRUCTIONS FINALES :
- Réponds UNIQUEMENT avec la requête SPARQL pure
- Pas de markdown (pas de triple backticks sparql)
- Pas d'explications
- Utilise TOUJOURS les préfixes de l'ontologie
- Adapte-toi aux termes exacts de l'ontologie (Utilisateur, ProgrammeSante, etc.)`;
};

// ============================================
// Appel à l'API Groq
// ============================================
const callGroqAPI = async (userPrompt) => {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY n'est pas configurée dans le fichier .env");
  }
  const systemPrompt = generateSystemPrompt();
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile', // Modèle mis à jour
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    throw new Error(`Groq API Error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// ============================================
// Fonction pour nettoyer la requête SPARQL
// ============================================
const cleanSparqlQuery = (query) => {
  query = query.replace(/```sparql\n?/g, '').replace(/```\n?/g, '');
  const prefixIndex = query.toUpperCase().indexOf('PREFIX');
  if (prefixIndex > 0) {
    query = query.substring(prefixIndex);
  }
  query = query.trim();
  return query;
};

// ============================================
// Fonction pour exécuter une requête SPARQL
// ============================================
const executeSparqlQuery = async (query, queryType = 'SELECT') => {
  try {
    if (queryType === 'SELECT' || queryType === 'ASK') {
      const response = await axios.get(`${FUSEKI_URL}/query`, {
        params: { query },
        headers: { Accept: "application/sparql-results+json" },
      });
      return { success: true, data: response.data, type: queryType };
    } else {
      const response = await axios.post(`${FUSEKI_URL}/update`, query, {
        headers: { "Content-Type": "application/sparql-update" },
      });
      return { success: true, message: "Requête exécutée avec succès", type: queryType };
    }
  } catch (error) {
    console.error("SPARQL Execution Error:", error.response?.data || error.message);
    throw new Error(`Erreur d'exécution SPARQL: ${error.message}`);
  }
};

// ============================================
// Détecter le type de requête SPARQL
// ============================================
const detectQueryType = (query) => {
  const upperQuery = query.toUpperCase();
  if (upperQuery.includes('SELECT')) return 'SELECT';
  if (upperQuery.includes('ASK')) return 'ASK';
  if (upperQuery.includes('INSERT')) return 'UPDATE';
  if (upperQuery.includes('DELETE')) return 'UPDATE';
  return 'SELECT';
};

// ============================================
// POST - Générer et exécuter une requête SPARQL via Groq AI
// ============================================
router.post("/generate", async (req, res) => {
  const { prompt, executeQuery = true } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, message: "Le prompt est requis" });
  }
  try {
    console.log("🤖 Génération de la requête SPARQL pour:", prompt);
    const rawQuery = await callGroqAPI(prompt);
    const sparqlQuery = cleanSparqlQuery(rawQuery);
    console.log("✅ Requête SPARQL générée:", sparqlQuery);
    const queryType = detectQueryType(sparqlQuery);
    let executionResult = null;
    if (executeQuery) {
      executionResult = await executeSparqlQuery(sparqlQuery, queryType);
      console.log("✅ Requête exécutée avec succès");
    }
    res.json({ success: true, prompt, generatedQuery: sparqlQuery, queryType, executed: executeQuery, result: executionResult });
  } catch (error) {
    console.error("❌ Erreur AI SPARQL:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST - Actions intelligentes prédéfinies (simplifiées)
// ============================================
router.post("/smart-action", async (req, res) => {
  const { action, params } = req.body;
  try {
    let prompt = "";
    switch (action) {
      case "assign_program":
        prompt = `Créer une relation entre le programme ${params.programId} et l'utilisateur ${params.userId} en utilisant la propriété ontologie:SMedicale. Le programme doit être de type ontologie:ProgrammeSante et l'utilisateur de type ontologie:Utilisateur.`;
        break;
      case "create_and_assign":
        const timestamp = Date.now();
        prompt = `Créer un nouveau programme de santé (ontologie:ProgrammeSante) avec l'ID ex:program_${timestamp}, puis l'assigner à l'utilisateur ${params.userId} via la relation ontologie:SMedicale. Ajoute aussi les informations: nom "${params.name}", description "${params.description}", durée "${params.duration}".`;
        break;
      case "find_user_programs":
        prompt = `Trouver tous les programmes de santé (ontologie:ProgrammeSante) liés à l'utilisateur ${params.userId} via la propriété ontologie:SMedicale.`;
        break;
      case "update_assignment":
        prompt = `Mettre à jour la relation ontologie:SMedicale du programme ${params.programId} : supprimer l'ancienne relation avec tout utilisateur et créer une nouvelle relation avec l'utilisateur ${params.newUserId}.`;
        break;
      case "remove_assignment":
        prompt = `Supprimer toutes les relations ontologie:SMedicale du programme ${params.programId} avec tous les utilisateurs.`;
        break;
      case "find_unassigned_programs":
        prompt = `Trouver tous les programmes de santé (ontologie:ProgrammeSante) qui ne sont pas liés à un utilisateur via ontologie:SMedicale.`;
        break;
      default:
        return res.status(400).json({ success: false, message: "Action inconnue" });
    }
    console.log("🎯 Exécution de l'action:", action);
    const rawQuery = await callGroqAPI(prompt);
    const sparqlQuery = cleanSparqlQuery(rawQuery);
    const queryType = detectQueryType(sparqlQuery);
    const executionResult = await executeSparqlQuery(sparqlQuery, queryType);
    console.log("✅ Action exécutée avec succès");
    res.json({ success: true, action, params, generatedQuery: sparqlQuery, result: executionResult });
  } catch (error) {
    console.error("❌ Erreur Smart Action:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET - Obtenir des suggestions de requêtes (simplifiées)
// ============================================
router.get("/suggestions", (req, res) => {
  res.json({
    success: true,
    suggestions: [
      {
        category: "Gestion des Utilisateurs",
        queries: [
          "Créer un nouvel utilisateur avec l'ID user_new",
          "Trouver tous les utilisateurs",
          "Trouver les utilisateurs sans programme de santé",
          "Compter le nombre de programmes par utilisateur"
        ]
      },
      {
        category: "Gestion des Programmes",
        queries: [
          "Créer un programme de santé pour l'utilisateur user_123",
          "Assigner le programme program_456 à l'utilisateur user_789",
          "Trouver tous les programmes de santé assignés à user_123",
          "Trouver les programmes de santé sans utilisateur assigné",
          "Retirer l'assignation du programme program_456"
        ]
      }
    ],
    smartActions: [
      { action: "assign_program", description: "Assigner un programme existant à un utilisateur", params: { programId: "string", userId: "string" } },
      { action: "create_and_assign", description: "Créer un nouveau programme et l'assigner", params: { name: "string", description: "string", duration: "string", userId: "string" } },
      { action: "find_user_programs", description: "Trouver tous les programmes d'un utilisateur", params: { userId: "string" } }
    ]
  });
});

// ============================================
// GET - Obtenir l'ontologie
// ============================================
router.get("/ontology", (req, res) => {
  res.json({ success: true, classes: ONTOLOGY_CLASSES, properties: ONTOLOGY_PROPERTIES, fullOntology: ONTOLOGY_CONTENT });
});

// ============================================
// GET - État de la configuration
// ============================================
router.get("/config", (req, res) => {
  res.json({
    success: true,
    groqConfigured: !!GROQ_API_KEY,
    fusekiUrl: FUSEKI_URL,
    model: "llama-3.3-70b-versatile",
    ontologyLoaded: ONTOLOGY_CONTENT.length > 0,
    classesCount: ONTOLOGY_CLASSES.length,
    propertiesCount: ONTOLOGY_PROPERTIES.length,
    status: GROQ_API_KEY ? "✅ Groq API configurée" : "❌ GROQ_API_KEY manquante"
  });
});

// ============================================
// POST - Recharger l'ontologie
// ============================================
router.post("/reload-ontology", (req, res) => {
  try {
    loadOntology();
    res.json({ success: true, message: "Ontologie rechargée avec succès", classesCount: ONTOLOGY_CLASSES.length, propertiesCount: ONTOLOGY_PROPERTIES.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST - Valider une requête SPARQL
// ============================================
router.post("/validate", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: "La requête est requise" });
  }
  try {
    const errors = [];
    const warnings = [];
    if (!query.includes("PREFIX ontologie:")) {
      errors.push("Préfixe manquant: PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>");
    }
    const upperQuery = query.toUpperCase();
    if (!upperQuery.includes("SELECT") && !upperQuery.includes("INSERT") && !upperQuery.includes("DELETE") && !upperQuery.includes("ASK")) {
      errors.push("Aucune opération SPARQL valide trouvée (SELECT, INSERT, DELETE, ASK)");
    }
    let canExecute = false;
    const queryType = detectQueryType(query);
    if (queryType === 'SELECT' || queryType === 'ASK') {
      try {
        await axios.get(`${FUSEKI_URL}/query`, { params: { query }, headers: { Accept: "application/sparql-results+json" } });
        canExecute = true;
      } catch (error) {
        errors.push(`Test d'exécution échoué: ${error.message}`);
      }
    } else {
      canExecute = true;
      warnings.push("Les requêtes UPDATE ne sont pas testées automatiquement");
    }
    res.json({ success: errors.length === 0, valid: errors.length === 0, canExecute, errors, warnings, queryType });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST - Expliquer une requête SPARQL
// ============================================
router.post("/explain", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: "La requête est requise" });
  }
  try {
    const prompt = `Explique en français simple et concis ce que fait cette requête SPARQL dans le contexte de l'ontologie Smart Health Tracker : ${query} Réponds en 2-3 phrases maximum, de façon claire et accessible.`;
    const explanation = await callGroqAPI(prompt);
    res.json({ success: true, query, explanation: explanation.trim() });
  } catch (error) {
    console.error("❌ Erreur d'explication:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;