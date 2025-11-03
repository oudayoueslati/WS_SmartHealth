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
    // Chercher le fichier d'ontologie à la racine du dossier server
    const ontologyPath = path.join(__dirname, '..', 'ontology.ttl');
    
    if (fs.existsSync(ontologyPath)) {
      ONTOLOGY_CONTENT = fs.readFileSync(ontologyPath, 'utf8');
      console.log("✅ Ontologie chargée depuis:", ontologyPath);
      
      // Extraire les classes (owl:Class)
      const classMatches = ONTOLOGY_CONTENT.matchAll(/ontologie:(\w+)\s+rdf:type\s+owl:Class/g);
      ONTOLOGY_CLASSES = [...classMatches].map(match => match[1]);
      
      // Extraire les propriétés (owl:ObjectProperty, owl:DatatypeProperty)
      const propMatches = ONTOLOGY_CONTENT.matchAll(/ontologie:(\w+)\s+rdf:type\s+owl:(?:Object|Datatype)Property/g);
      ONTOLOGY_PROPERTIES = [...propMatches].map(match => match[1]);
      
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
  // Ontologie de secours basée sur votre extrait
  ONTOLOGY_CLASSES = [
    "Utilisateur",
    "ProgrammeSante",
    "Habitude",
    "Habitude_logs",
    "Service_médical",
    "EtatSanté",
    "Article",
    "Evenement",
    "Objectif",
    "Mesure"
  ];
  
  ONTOLOGY_PROPERTIES = [
    "LogHabitude",
    "SMedicale",
    "aArticle",
    "aEtat",
    "aHabitude",
    "aMesure",
    "aObjectif"
  ];
  
  ONTOLOGY_CONTENT = `
Classes disponibles: ${ONTOLOGY_CLASSES.join(", ")}
Propriétés disponibles: ${ONTOLOGY_PROPERTIES.join(", ")}
  `;
};

// Charger l'ontologie au démarrage
loadOntology();

// ============================================
// Système de prompts basé sur votre ontologie
// ============================================
const generateSystemPrompt = () => {
  return `Tu es un expert en Web Sémantique et SPARQL. Tu génères des requêtes SPARQL précises basées sur l'ontologie Smart Health Tracker.

ONTOLOGIE COMPLÈTE :
${ONTOLOGY_CONTENT}

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
3. **Propriétés** : Utilise ontologie:nomPropriété (ex: ontologie:aObjectif, ontologie:aEtat)
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
  ex:user_123 ontologie:aObjectif ex:program_456 .
}

Exemple 2 - Assigner un programme (relation ProgrammeSante -> Utilisateur) :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
INSERT DATA {
  ex:program_123 ontologie:SMedicale ex:user_456 .
}

Exemple 3 - Trouver tous les utilisateurs avec leurs programmes :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
SELECT ?user ?program
WHERE {
  ?user a ontologie:Utilisateur .
  OPTIONAL { ?user ontologie:aObjectif ?program . }
}

Exemple 4 - Trouver les programmes d'un utilisateur :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
SELECT ?program ?etat ?objectif
WHERE {
  ?program ontologie:SMedicale ex:user_123 .
  OPTIONAL { ?program ontologie:aEtat ?etat . }
  OPTIONAL { ?etat ontologie:aEtat ?objectif . }
}

Exemple 5 - Créer une habitude pour un utilisateur :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
INSERT DATA {
  ex:log_789 a ontologie:Habitude_logs .
  ex:user_123 ontologie:aHabitude ex:log_789 .
  ex:log_789 ontologie:LogHabitude ex:habitude_sport .
}

Exemple 6 - Mettre à jour un état de santé :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
DELETE {
  ex:etat_123 ontologie:aEtat ?oldUser .
}
INSERT {
  ex:etat_123 ontologie:aEtat ex:user_new .
}
WHERE {
  OPTIONAL { ex:etat_123 ontologie:aEtat ?oldUser . }
}

Exemple 7 - Compter les objectifs par utilisateur :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?user (COUNT(?objectif) as ?count)
WHERE {
  ?user a ontologie:Utilisateur .
  OPTIONAL { ?user ontologie:aObjectif ?objectif . }
}
GROUP BY ?user
ORDER BY DESC(?count)

Exemple 8 - Trouver les utilisateurs sans programme :
PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>
SELECT ?user
WHERE {
  ?user a ontologie:Utilisateur .
  FILTER NOT EXISTS { 
    ?program ontologie:SMedicale ?user .
  }
}

CONTEXTE IMPORTANT :

Relations clés dans votre ontologie :
- ontologie:SMedicale : Lie Service_médical -> (Utilisateur, EtatSanté, ProgrammeSante)
- ontologie:aEtat : Lie EtatSanté -> (Utilisateur, ProgrammeSante, Objectif)
- ontologie:aObjectif : Lie Utilisateur -> Objectif
- ontologie:aHabitude : Lie Utilisateur -> Habitude_logs
- ontologie:LogHabitude : Lie Habitude_logs -> (Habitude, Utilisateur)
- ontologie:aArticle : Lie Article -> (Habitude, Utilisateur, Evenement)
- ontologie:aMesure : Lie (Utilisateur, Mesure) -> Mesure

INSTRUCTIONS FINALES :
- Réponds UNIQUEMENT avec la requête SPARQL pure
- Pas de markdown (pas de \`\`\`sparql)
- Pas d'explications
- Utilise TOUJOURS les préfixes de l'ontologie
- Adapte-toi aux termes exacts de l'ontologie (ProgrammeSante, EtatSanté, etc.)`;
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
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: userPrompt 
          }
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
  // Enlever les blocs de code markdown
  query = query.replace(/```sparql\n?/g, '').replace(/```\n?/g, '');
  
  // Enlever les explications avant la requête
  const prefixIndex = query.toUpperCase().indexOf('PREFIX');
  if (prefixIndex > 0) {
    query = query.substring(prefixIndex);
  }
  
  // Enlever les espaces superflus
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
      return {
        success: true,
        data: response.data,
        type: queryType
      };
    } else {
      // INSERT, DELETE, UPDATE
      const response = await axios.post(`${FUSEKI_URL}/update`, query, {
        headers: { "Content-Type": "application/sparql-update" },
      });
      return {
        success: true,
        message: "Requête exécutée avec succès",
        type: queryType
      };
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
    return res.status(400).json({
      success: false,
      message: "Le prompt est requis"
    });
  }

  try {
    console.log("🤖 Génération de la requête SPARQL pour:", prompt);
    
    // 1. Générer la requête SPARQL via Groq AI
    const rawQuery = await callGroqAPI(prompt);
    const sparqlQuery = cleanSparqlQuery(rawQuery);

    console.log("✅ Requête SPARQL générée:", sparqlQuery);

    // 2. Détecter le type de requête
    const queryType = detectQueryType(sparqlQuery);

    // 3. Exécuter la requête si demandé
    let executionResult = null;
    if (executeQuery) {
      executionResult = await executeSparqlQuery(sparqlQuery, queryType);
      console.log("✅ Requête exécutée avec succès");
    }

    res.json({
      success: true,
      prompt,
      generatedQuery: sparqlQuery,
      queryType,
      executed: executeQuery,
      result: executionResult
    });

  } catch (error) {
    console.error("❌ Erreur AI SPARQL:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// POST - Actions intelligentes prédéfinies
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
        prompt = `Trouver tous les programmes de santé (ontologie:ProgrammeSante) liés à l'utilisateur ${params.userId} via la propriété ontologie:SMedicale. Récupérer aussi leurs états de santé et objectifs associés.`;
        break;
        
      case "update_assignment":
        prompt = `Mettre à jour la relation ontologie:SMedicale du programme ${params.programId} : supprimer l'ancienne relation avec tout utilisateur et créer une nouvelle relation avec l'utilisateur ${params.newUserId}.`;
        break;
        
      case "remove_assignment":
        prompt = `Supprimer toutes les relations ontologie:SMedicale du programme ${params.programId} avec tous les utilisateurs.`;
        break;

      case "find_programs_by_type":
        prompt = `Trouver tous les programmes de santé (ontologie:ProgrammeSante) dans la base de données.`;
        break;

      case "count_user_programs":
        prompt = `Compter le nombre de programmes de santé assignés à chaque utilisateur via la relation ontologie:SMedicale. Grouper par utilisateur et trier par ordre décroissant.`;
        break;

      case "find_unassigned_programs":
        prompt = `Trouver tous les programmes de santé (ontologie:ProgrammeSante) qui ne sont pas liés à un utilisateur via ontologie:SMedicale.`;
        break;

      case "create_habit_log":
        prompt = `Créer un nouveau log d'habitude (ontologie:Habitude_logs) avec l'ID ex:log_${timestamp} pour l'utilisateur ${params.userId} en utilisant ontologie:aHabitude.`;
        break;

      case "find_user_habits":
        prompt = `Trouver tous les logs d'habitudes (ontologie:Habitude_logs) de l'utilisateur ${params.userId} via ontologie:aHabitude.`;
        break;

      case "create_health_state":
        prompt = `Créer un nouvel état de santé (ontologie:EtatSanté) avec l'ID ex:etat_${timestamp} pour l'utilisateur ${params.userId}.`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: "Action inconnue"
        });
    }

    console.log("🎯 Exécution de l'action:", action);
    
    // Générer et exécuter la requête
    const rawQuery = await callGroqAPI(prompt);
    const sparqlQuery = cleanSparqlQuery(rawQuery);
    const queryType = detectQueryType(sparqlQuery);
    const executionResult = await executeSparqlQuery(sparqlQuery, queryType);

    console.log("✅ Action exécutée avec succès");

    res.json({
      success: true,
      action,
      params,
      generatedQuery: sparqlQuery,
      result: executionResult
    });

  } catch (error) {
    console.error("❌ Erreur Smart Action:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET - Obtenir des suggestions de requêtes
// ============================================
router.get("/suggestions", (req, res) => {
  res.json({
    success: true,
    suggestions: [
      {
        category: "Gestion des Programmes",
        queries: [
          "Créer un programme de santé pour l'utilisateur user_123",
          "Assigner le programme program_456 à l'utilisateur user_789",
          "Trouver tous les programmes de santé assignés à user_123",
          "Trouver les programmes de santé sans utilisateur assigné",
          "Retirer l'assignation du programme program_456"
        ]
      },
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
        category: "Habitudes et Logs",
        queries: [
          "Créer un log d'habitude pour l'utilisateur user_123",
          "Trouver tous les logs d'habitudes de user_456",
          "Lier une habitude sport au log log_789",
          "Trouver les utilisateurs avec des habitudes actives"
        ]
      },
      {
        category: "États de Santé",
        queries: [
          "Créer un état de santé pour l'utilisateur user_123",
          "Trouver l'état de santé d'un utilisateur",
          "Lier un état de santé à un programme",
          "Trouver les programmes avec état de santé critique"
        ]
      },
      {
        category: "Objectifs",
        queries: [
          "Créer un objectif pour l'utilisateur user_123",
          "Trouver tous les objectifs d'un utilisateur",
          "Lier un objectif à un état de santé",
          "Compter les objectifs par utilisateur"
        ]
      },
      {
        category: "Services Médicaux",
        queries: [
          "Créer un service médical",
          "Trouver tous les services médicaux",
          "Lier un service médical à un programme",
          "Trouver les programmes par service médical"
        ]
      },
      {
        category: "Statistiques",
        queries: [
          "Compter le nombre total d'utilisateurs",
          "Compter le nombre de programmes par type",
          "Trouver les utilisateurs les plus actifs",
          "Calculer le nombre moyen de programmes par utilisateur"
        ]
      }
    ],
    smartActions: [
      {
        action: "assign_program",
        description: "Assigner un programme existant à un utilisateur",
        params: { programId: "string", userId: "string" }
      },
      {
        action: "create_and_assign",
        description: "Créer un nouveau programme et l'assigner",
        params: {
          name: "string",
          description: "string",
          duration: "string",
          userId: "string"
        }
      },
      {
        action: "find_user_programs",
        description: "Trouver tous les programmes d'un utilisateur",
        params: { userId: "string" }
      },
      {
        action: "create_habit_log",
        description: "Créer un log d'habitude pour un utilisateur",
        params: { userId: "string" }
      },
      {
        action: "find_user_habits",
        description: "Trouver les habitudes d'un utilisateur",
        params: { userId: "string" }
      },
      {
        action: "create_health_state",
        description: "Créer un état de santé",
        params: { userId: "string" }
      }
    ]
  });
});

// ============================================
// GET - Obtenir l'ontologie
// ============================================
router.get("/ontology", (req, res) => {
  res.json({
    success: true,
    classes: ONTOLOGY_CLASSES,
    properties: ONTOLOGY_PROPERTIES,
    fullOntology: ONTOLOGY_CONTENT
  });
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
    res.json({
      success: true,
      message: "Ontologie rechargée avec succès",
      classesCount: ONTOLOGY_CLASSES.length,
      propertiesCount: ONTOLOGY_PROPERTIES.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// POST - Valider une requête SPARQL
// ============================================
router.post("/validate", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "La requête est requise"
    });
  }

  try {
    const errors = [];
    const warnings = [];

    // Vérifications basiques
    if (!query.includes("PREFIX ontologie:")) {
      errors.push("Préfixe manquant: PREFIX ontologie: <http://www.smarthealth-tracker.com/ontologie#>");
    }

    const upperQuery = query.toUpperCase();
    if (!upperQuery.includes("SELECT") && !upperQuery.includes("INSERT") && 
        !upperQuery.includes("DELETE") && !upperQuery.includes("ASK")) {
      errors.push("Aucune opération SPARQL valide trouvée (SELECT, INSERT, DELETE, ASK)");
    }

    // Tester l'exécution (uniquement pour SELECT et ASK)
    let canExecute = false;
    const queryType = detectQueryType(query);
    
    if (queryType === 'SELECT' || queryType === 'ASK') {
      try {
        await axios.get(`${FUSEKI_URL}/query`, {
          params: { query },
          headers: { Accept: "application/sparql-results+json" },
        });
        canExecute = true;
      } catch (error) {
        errors.push(`Test d'exécution échoué: ${error.message}`);
      }
    } else {
      canExecute = true;
      warnings.push("Les requêtes UPDATE ne sont pas testées automatiquement");
    }

    res.json({
      success: errors.length === 0,
      valid: errors.length === 0,
      canExecute,
      errors,
      warnings,
      queryType
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// POST - Expliquer une requête SPARQL
// ============================================
router.post("/explain", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "La requête est requise"
    });
  }

  try {
    const prompt = `Explique en français simple et concis ce que fait cette requête SPARQL dans le contexte de l'ontologie Smart Health Tracker :

${query}

Réponds en 2-3 phrases maximum, de façon claire et accessible.`;

    const explanation = await callGroqAPI(prompt);

    res.json({
      success: true,
      query,
      explanation: explanation.trim()
    });

  } catch (error) {
    console.error("❌ Erreur d'explication:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;