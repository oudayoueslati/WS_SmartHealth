const { FUSEKI_URL, fusekiAuth } = require('../config/fuseki');
const express = require("express");
const axios = require("axios");
const router = express.Router();



// ============================================
// CREATE - Créer un nouveau programme avec relations
// ============================================
router.post("/create", async (req, res) => {
  const { 
    type, 
    name, 
    description, 
    duration, 
    goals, 
    userId,
    assignedToUserId,
    scoreId,
    serviceId,
    etatSanteId,
    objectifId
  } = req.body;

  if (!type || !name || !userId) {
    return res.status(400).json({
      success: false,
      message: "Type, name, and userId are required"
    });
  }

  const programId = `program_${Date.now()}`;

  try {
    let programTTL = "";
    const programClass = type === "Activity" ? "ProgrammeActivite" 
                       : type === "Sleep" ? "ProgrammeSommeil" 
                       : "ProgrammeNutrition";

    // Construire le TTL avec les relations
    programTTL = `
      @prefix ex: <http://example.org/> .
      ex:${programId} a ex:${programClass} ;
          ex:name "${name}" ;
          ex:description "${description || ''}" ;
          ex:duration "${duration || ''}" ;
          ex:goals "${goals || ''}" ;
          ex:createdBy ex:${userId} ;
          ex:createdAt "${new Date().toISOString()}" `;

    // Ajouter les relations optionnelles
    if (assignedToUserId) {
      programTTL += `;\n          ex:assignedTo ex:${assignedToUserId}`;
    }
    if (scoreId) {
      programTTL += `;\n          ex:hasScore ex:${scoreId}`;
    }
    if (serviceId) {
      programTTL += `;\n          ex:providedBy ex:${serviceId}`;
    }
    if (etatSanteId) {
      programTTL += `;\n          ex:targetsEtat ex:${etatSanteId}`;
    }
    if (objectifId) {
      programTTL += `;\n          ex:hasObjectif ex:${objectifId}`;
    }

    programTTL += " .";

    await axios.post(`${FUSEKI_URL}/data`, programTTL, {
      headers: { "Content-Type": "text/turtle" },
    });

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      program: { 
        id: programId, 
        type, 
        name, 
        description, 
        duration, 
        goals,
        relations: {
          createdBy: userId,
          assignedTo: assignedToUserId,
          score: scoreId,
          service: serviceId,
          etatSante: etatSanteId,
          objectif: objectifId
        }
      }
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
// READ - Récupérer tous les programmes AVEC relations
// ============================================
router.get("/all", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?program ?type ?name ?description ?duration ?goals ?createdAt 
           ?createdBy ?assignedTo ?score ?service ?etatSante ?objectif
    WHERE {
      ?program a ?type ;
               ex:name ?name .
      OPTIONAL { ?program ex:description ?description . }
      OPTIONAL { ?program ex:duration ?duration . }
      OPTIONAL { ?program ex:goals ?goals . }
      OPTIONAL { ?program ex:createdAt ?createdAt . }
      OPTIONAL { ?program ex:createdBy ?createdBy . }
      OPTIONAL { ?program ex:assignedTo ?assignedTo . }
      OPTIONAL { ?program ex:hasScore ?score . }
      OPTIONAL { ?program ex:providedBy ?service . }
      OPTIONAL { ?program ex:targetsEtat ?etatSante . }
      OPTIONAL { ?program ex:hasObjectif ?objectif . }
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
      createdAt: binding.createdAt?.value || '',
      relations: {
        createdBy: binding.createdBy?.value.split('/').pop() || null,
        assignedTo: binding.assignedTo?.value.split('/').pop() || null,
        score: binding.score?.value.split('/').pop() || null,
        service: binding.service?.value.split('/').pop() || null,
        etatSante: binding.etatSante?.value.split('/').pop() || null,
        objectif: binding.objectif?.value.split('/').pop() || null
      }
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
// READ - Récupérer un programme par ID AVEC relations
// ============================================
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?type ?name ?description ?duration ?goals ?createdAt 
           ?createdBy ?assignedTo ?score ?service ?etatSante ?objectif
    WHERE {
      ex:${id} a ?type ;
               ex:name ?name .
      OPTIONAL { ex:${id} ex:description ?description . }
      OPTIONAL { ex:${id} ex:duration ?duration . }
      OPTIONAL { ex:${id} ex:goals ?goals . }
      OPTIONAL { ex:${id} ex:createdAt ?createdAt . }
      OPTIONAL { ex:${id} ex:createdBy ?createdBy . }
      OPTIONAL { ex:${id} ex:assignedTo ?assignedTo . }
      OPTIONAL { ex:${id} ex:hasScore ?score . }
      OPTIONAL { ex:${id} ex:providedBy ?service . }
      OPTIONAL { ex:${id} ex:targetsEtat ?etatSante . }
      OPTIONAL { ex:${id} ex:hasObjectif ?objectif . }
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
      createdAt: binding.createdAt?.value || '',
      relations: {
        createdBy: binding.createdBy?.value.split('/').pop() || null,
        assignedTo: binding.assignedTo?.value.split('/').pop() || null,
        score: binding.score?.value.split('/').pop() || null,
        service: binding.service?.value.split('/').pop() || null,
        etatSante: binding.etatSante?.value.split('/').pop() || null,
        objectif: binding.objectif?.value.split('/').pop() || null
      }
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
// UPDATE - Mettre à jour un programme AVEC relations
// ============================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    duration, 
    goals,
    assignedToUserId,
    scoreId,
    serviceId,
    etatSanteId,
    objectifId
  } = req.body;

  try {
    // Supprimer les anciennes propriétés ET relations
    const deleteQuery = `
      PREFIX ex: <http://example.org/>
      DELETE {
        ex:${id} ex:name ?oldName .
        ex:${id} ex:description ?oldDescription .
        ex:${id} ex:duration ?oldDuration .
        ex:${id} ex:goals ?oldGoals .
        ex:${id} ex:assignedTo ?oldAssigned .
        ex:${id} ex:hasScore ?oldScore .
        ex:${id} ex:providedBy ?oldService .
        ex:${id} ex:targetsEtat ?oldEtat .
        ex:${id} ex:hasObjectif ?oldObjectif .
      }
      WHERE {
        OPTIONAL { ex:${id} ex:name ?oldName . }
        OPTIONAL { ex:${id} ex:description ?oldDescription . }
        OPTIONAL { ex:${id} ex:duration ?oldDuration . }
        OPTIONAL { ex:${id} ex:goals ?oldGoals . }
        OPTIONAL { ex:${id} ex:assignedTo ?oldAssigned . }
        OPTIONAL { ex:${id} ex:hasScore ?oldScore . }
        OPTIONAL { ex:${id} ex:providedBy ?oldService . }
        OPTIONAL { ex:${id} ex:targetsEtat ?oldEtat . }
        OPTIONAL { ex:${id} ex:hasObjectif ?oldObjectif . }
      }
    `;

    await axios.post(`${FUSEKI_URL}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    // Construire la requête INSERT avec relations
    let insertQuery = `
      PREFIX ex: <http://example.org/>
      INSERT DATA {
        ex:${id} ex:name "${name}" ;
                 ex:description "${description || ''}" ;
                 ex:duration "${duration || ''}" ;
                 ex:goals "${goals || ''}"`;

    if (assignedToUserId) {
      insertQuery += ` ;\n                 ex:assignedTo ex:${assignedToUserId}`;
    }
    if (scoreId) {
      insertQuery += ` ;\n                 ex:hasScore ex:${scoreId}`;
    }
    if (serviceId) {
      insertQuery += ` ;\n                 ex:providedBy ex:${serviceId}`;
    }
    if (etatSanteId) {
      insertQuery += ` ;\n                 ex:targetsEtat ex:${etatSanteId}`;
    }
    if (objectifId) {
      insertQuery += ` ;\n                 ex:hasObjectif ex:${objectifId}`;
    }

    insertQuery += ` .
      }
    `;

    await axios.post(`${FUSEKI_URL}/update`, insertQuery, {
      headers: { "Content-Type": "application/sparql-update" },
    });

    res.json({
      success: true,
      message: "Program updated successfully",
      program: { 
        id, 
        name, 
        description, 
        duration, 
        goals,
        relations: {
          assignedTo: assignedToUserId,
          score: scoreId,
          service: serviceId,
          etatSante: etatSanteId,
          objectif: objectifId
        }
      }
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
// DELETE - Supprimer un programme (inchangé)
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
// Nouvelles routes pour gérer les relations
// ============================================

// GET - Lister tous les utilisateurs
router.get("/relations/users", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?user ?username ?email
    WHERE {
      ?user a ex:Utilisateur .
      OPTIONAL { ?user ex:username ?username . }
      OPTIONAL { ?user ex:email ?email . }
    }
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const users = response.data.results.bindings.map(b => ({
      id: b.user.value.split('/').pop(),
      username: b.username?.value || '',
      email: b.email?.value || ''
    }));

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Lister tous les objectifs
router.get("/relations/objectifs", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?objectif ?name ?target
    WHERE {
      ?objectif a ex:Objectif .
      OPTIONAL { ?objectif ex:objectifName ?name . }
      OPTIONAL { ?objectif ex:objectifTarget ?target . }
    }
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const objectifs = response.data.results.bindings.map(b => ({
      id: b.objectif.value.split('/').pop(),
      name: b.name?.value || '',
      target: b.target?.value || ''
    }));

    res.json({ success: true, objectifs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - Lister tous les services médicaux
router.get("/relations/services", async (req, res) => {
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?service ?name ?type
    WHERE {
      ?service a ex:Service_medical .
      OPTIONAL { ?service ex:serviceName ?name . }
      OPTIONAL { ?service ex:serviceType ?type . }
    }
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    });

    const services = response.data.results.bindings.map(b => ({
      id: b.service.value.split('/').pop(),
      name: b.name?.value || '',
      type: b.type?.value || ''
    }));

    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// POST - Créer un nouvel utilisateur
// ============================================
router.post("/relations/users/create", async (req, res) => {
  const { username, email, age } = req.body;

  if (!username || !email) {
    return res.status(400).json({
      success: false,
      message: "Username and email are required"
    });
  }

  const userId = `user_${Date.now()}`;

  try {
    const userTTL = `
      @prefix ex: <http://example.org/> .
      ex:${userId} a ex:Utilisateur ;
          ex:username "${username}" ;
          ex:email "${email}" ;
          ex:age ${age || 0} .
    `;

    await axios.post(`${FUSEKI_URL}/data`, userTTL, {
      headers: { "Content-Type": "text/turtle" },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { id: userId, username, email, age }
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// POST - Créer un nouvel objectif
// ============================================
router.post("/relations/objectifs/create", async (req, res) => {
  const { name, target } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is required"
    });
  }

  const objectifId = `objectif_${Date.now()}`;

  try {
    const objectifTTL = `
      @prefix ex: <http://example.org/> .
      ex:${objectifId} a ex:Objectif ;
          ex:objectifName "${name}" ;
          ex:objectifTarget "${target || ''}" .
    `;

    await axios.post(`${FUSEKI_URL}/data`, objectifTTL, {
      headers: { "Content-Type": "text/turtle" },
    });

    res.status(201).json({
      success: true,
      message: "Objectif created successfully",
      objectif: { id: objectifId, name, target }
    });
  } catch (err) {
    console.error("Create objectif error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// POST - Créer un nouveau service médical
// ============================================
router.post("/relations/services/create", async (req, res) => {
  const { name, type } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is required"
    });
  }

  const serviceId = `service_${Date.now()}`;

  try {
    const serviceTTL = `
      @prefix ex: <http://example.org/> .
      ex:${serviceId} a ex:Service_medical ;
          ex:serviceName "${name}" ;
          ex:serviceType "${type || ''}" .
    `;

    await axios.post(`${FUSEKI_URL}/data`, serviceTTL, {
      headers: { "Content-Type": "text/turtle" },
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: { id: serviceId, name, type }
    });
  } catch (err) {
    console.error("Create service error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;