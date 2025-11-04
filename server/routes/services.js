const express = require("express");
const axios = require("axios");
const { FUSEKI_URL, fusekiAuth } = require('../config/fuseki');
const router = express.Router();


// Helper functions
function sanitizeId(s) {
  return String(s).replace(/[^A-Za-z0-9_\-]/g, '_');
}

function sanitizeLiteral(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * GET /api/services
 * Récupère tous les services médicaux
 */
router.get("/", async (req, res) => {
  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
    
    SELECT ?service ?type ?label WHERE {
      ?service rdf:type ?type .
      FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
      OPTIONAL { ?service sh:label ?label }
    }
    ORDER BY ?service
  `;

  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
      ...fusekiAuth
    });

    const bindings = response.data.results.bindings;
    const services = bindings.map((b) => {
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

    res.json({ success: true, services });
  } catch (err) {
    console.error("Error fetching services:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch services",
      message: err.message 
    });
  }
});

/**
 * POST /api/services
 * Crée un nouveau service médical
 */
router.post("/", async (req, res) => {
  const { type, label, id } = req.body;

  if (!type || !label) {
    return res.status(400).json({ 
      success: false, 
      error: "Type and label are required" 
    });
  }

  const serviceId = id ? sanitizeId(id) : `${type}_${Date.now()}`;
  const sanitizedLabel = sanitizeLiteral(label);

  const insertQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
    
    INSERT DATA {
      sh:${serviceId} rdf:type sh:${type} .
      sh:${serviceId} sh:label "${sanitizedLabel}" .
    }
  `;

  try {
    await axios.post(`${FUSEKI_URL}/update`, insertQuery, {
      headers: { "Content-Type": "application/sparql-update" },
      ...fusekiAuth
    });

    res.status(201).json({ 
      success: true, 
      message: "Service created successfully",
      service: { id: serviceId, type, label }
    });
  } catch (err) {
    console.error("Error creating service:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create service",
      message: err.message 
    });
  }
});

/**
 * PUT /api/services/:id
 * Met à jour un service médical
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, label } = req.body;

  if (!type && !label) {
    return res.status(400).json({ 
      success: false, 
      error: "At least one field (type or label) is required" 
    });
  }

  const sanitizedId = sanitizeId(id);
  let deleteClause = "";
  let insertClause = "";

  if (type) {
    deleteClause += `sh:${sanitizedId} rdf:type ?oldType .\n`;
    insertClause += `sh:${sanitizedId} rdf:type sh:${type} .\n`;
  }

  if (label) {
    const sanitizedLabel = sanitizeLiteral(label);
    deleteClause += `sh:${sanitizedId} sh:label ?oldLabel .\n`;
    insertClause += `sh:${sanitizedId} sh:label "${sanitizedLabel}" .\n`;
  }

  const updateQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
    
    DELETE {
      ${deleteClause}
    }
    INSERT {
      ${insertClause}
    }
    WHERE {
      OPTIONAL { sh:${sanitizedId} rdf:type ?oldType }
      OPTIONAL { sh:${sanitizedId} sh:label ?oldLabel }
    }
  `;

  try {
    await axios.post(`${FUSEKI_URL}/update`, updateQuery, {
      headers: { "Content-Type": "application/sparql-update" },
      ...fusekiAuth
    });

    res.json({ 
      success: true, 
      message: "Service updated successfully" 
    });
  } catch (err) {
    console.error("Error updating service:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update service",
      message: err.message 
    });
  }
});

/**
 * DELETE /api/services/:id
 * Supprime un service médical
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const sanitizedId = sanitizeId(id);

  const deleteQuery = `
    PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
    
    DELETE WHERE {
      sh:${sanitizedId} ?p ?o .
    }
  `;

  try {
    await axios.post(`${FUSEKI_URL}/update`, deleteQuery, {
      headers: { "Content-Type": "application/sparql-update" },
      ...fusekiAuth
    });

    res.json({ 
      success: true, 
      message: "Service deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting service:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete service",
      message: err.message 
    });
  }
});

module.exports = router;
