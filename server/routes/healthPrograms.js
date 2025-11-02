const express = require("express");
const axios = require("axios");
const router = express.Router();

const FUSEKI_URL = process.env.FUSEKI_URL || "http://localhost:3030/usersDB";

// ============================================
// CREATE - Créer un nouveau programme
// ============================================
router.post("/create", async (req, res) => {
  const { type, name, description, duration, goals, userId } = req.body;

  if (!type || !name || !userId) {
    return res.status(400).json({
      success: false,
      message: "Type, name, and userId are required"
    });
  }

  // Générer un ID unique pour le programme
  const programId = `program_${Date.now()}`;

  try {
    let programTTL = "";

    // Créer le programme selon le type
    switch (type) {
      case "Activity":
        programTTL = `
          @prefix ex: <http://example.org/> .
          ex:${programId} a ex:ProgrammeActivite ;
              ex:name "${name}" ;
              ex:description "${description || ''}" ;
              ex:duration "${duration || ''}" ;
              ex:goals "${goals || ''}" ;
              ex:createdBy ex:${userId} ;
              ex:createdAt "${new Date().toISOString()}" .
        `;
        break;

      case "Sleep":
        programTTL = `
          @prefix ex: <http://example.org/> .
          ex:${programId} a ex:ProgrammeSommeil ;
              ex:name "${name}" ;
              ex:description "${description || ''}" ;
              ex:duration "${duration || ''}" ;
              ex:goals "${goals || ''}" ;
              ex:createdBy ex:${userId} ;
              ex:createdAt "${new Date().toISOString()}" .
        `;
        break;

      case "Nutrition":
        programTTL = `
          @prefix ex: <http://example.org/> .
          ex:${programId} a ex:ProgrammeNutrition ;
              ex:name "${name}" ;
              ex:description "${description || ''}" ;
              ex:duration "${duration || ''}" ;
              ex:goals "${goals || ''}" ;
              ex:createdBy ex:${userId} ;
              ex:createdAt "${new Date().toISOString()}" .
        `;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid program type. Use: Activity, Sleep, or Nutrition"
        });
    }

    await axios.post(`${FUSEKI_URL}/data`, programTTL, {
      headers: { "Content-Type": "text/turtle" },
    });

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      program: { id: programId, type, name, description, duration, goals }
    });
  } catch (err) {
    console.error("Create program error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// READ - Récupérer tous les programmes
// ============================================
router.get("/all", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?program ?type ?name ?description ?duration ?goals ?createdAt
    WHERE {
      ?program a ?type ;
               ex:name ?name .
      OPTIONAL { ?program ex:description ?description . }
      OPTIONAL { ?program ex:duration ?duration . }
      OPTIONAL { ?program ex:goals ?goals . }
      OPTIONAL { ?program ex:createdAt ?createdAt . }
      FILTER(?type = ex:ProgrammeActivite || ?type = ex:ProgrammeSommeil || ?type = ex:ProgrammeNutrition)
    }
    ORDER BY DESC(?createdAt)
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const programs = response.data.results.bindings.map(binding => ({
      id: binding.program.value.split('/').pop(),
      type: binding.type.value.split('/').pop(),
      name: binding.name.value,
      description: binding.description?.value || '',
      duration: binding.duration?.value || '',
      goals: binding.goals?.value || '',
      createdAt: binding.createdAt?.value || ''
    }));

    res.json({
      success: true,
      programs
    });
  } catch (err) {
    console.error("Get programs error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// READ - Récupérer un programme par ID
// ============================================
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?type ?name ?description ?duration ?goals ?createdAt
    WHERE {
      ex:${id} a ?type ;
               ex:name ?name .
      OPTIONAL { ex:${id} ex:description ?description . }
      OPTIONAL { ex:${id} ex:duration ?duration . }
      OPTIONAL { ex:${id} ex:goals ?goals . }
      OPTIONAL { ex:${id} ex:createdAt ?createdAt . }
    }
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    if (response.data.results.bindings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    const binding = response.data.results.bindings[0];
    const program = {
      id,
      type: binding.type.value.split('/').pop(),
      name: binding.name.value,
      description: binding.description?.value || '',
      duration: binding.duration?.value || '',
      goals: binding.goals?.value || '',
      createdAt: binding.createdAt?.value || ''
    };

    res.json({
      success: true,
      program
    });
  } catch (err) {
    console.error("Get program error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// UPDATE - Mettre à jour un programme
// ============================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, duration, goals } = req.body;

  try {
    // Supprimer les anciennes propriétés
    const deleteQuery = `
      PREFIX ex: <http://example.org/>
      DELETE {
        ex:${id} ex:name ?oldName .
        ex:${id} ex:description ?oldDescription .
        ex:${id} ex:duration ?oldDuration .
        ex:${id} ex:goals ?oldGoals .
      }
      WHERE {
        OPTIONAL { ex:${id} ex:name ?oldName . }
        OPTIONAL { ex:${id} ex:description ?oldDescription . }
        OPTIONAL { ex:${id} ex:duration ?oldDuration . }
        OPTIONAL { ex:${id} ex:goals ?oldGoals . }
      }
    `;

    await axios.post(`${FUSEKI_URL}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    // Ajouter les nouvelles propriétés
    const insertQuery = `
      PREFIX ex: <http://example.org/>
      INSERT DATA {
        ex:${id} ex:name "${name}" ;
                 ex:description "${description || ''}" ;
                 ex:duration "${duration || ''}" ;
                 ex:goals "${goals || ''}" .
      }
    `;

    await axios.post(`${FUSEKI_URL}/update`, insertQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({
      success: true,
      message: "Program updated successfully",
      program: { id, name, description, duration, goals }
    });
  } catch (err) {
    console.error("Update program error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// DELETE - Supprimer un programme
// ============================================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deleteQuery = `
    PREFIX ex: <http://example.org/>
    DELETE WHERE {
      ex:${id} ?p ?o .
    }
  `;

  try {
    await axios.post(`${FUSEKI_URL}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({
      success: true,
      message: "Program deleted successfully"
    });
  } catch (err) {
    console.error("Delete program error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// READ - Récupérer programmes par type
// ============================================
router.get("/type/:type", async (req, res) => {
  const { type } = req.params;
  
  let programType;
  switch (type) {
    case "Activity":
      programType = "ProgrammeActivite";
      break;
    case "Sleep":
      programType = "ProgrammeSommeil";
      break;
    case "Nutrition":
      programType = "ProgrammeNutrition";
      break;
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid type. Use: Activity, Sleep, or Nutrition"
      });
  }

  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?program ?name ?description ?duration ?goals ?createdAt
    WHERE {
      ?program a ex:${programType} ;
               ex:name ?name .
      OPTIONAL { ?program ex:description ?description . }
      OPTIONAL { ?program ex:duration ?duration . }
      OPTIONAL { ?program ex:goals ?goals . }
      OPTIONAL { ?program ex:createdAt ?createdAt . }
    }
    ORDER BY DESC(?createdAt)
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const programs = response.data.results.bindings.map(binding => ({
      id: binding.program.value.split('/').pop(),
      type: programType,
      name: binding.name.value,
      description: binding.description?.value || '',
      duration: binding.duration?.value || '',
      goals: binding.goals?.value || '',
      createdAt: binding.createdAt?.value || ''
    }));

    res.json({
      success: true,
      programs
    });
  } catch (err) {
    console.error("Get programs by type error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;