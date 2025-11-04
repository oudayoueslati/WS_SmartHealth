const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { FUSEKI_URL, fusekiAuth } = require('../config/fuseki');
const router = express.Router();


// Préfixes SPARQL
const PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
PREFIX ex: <http://example.org/>
`;

// ============================================
// Helpers - Sanitization
// ============================================
function sanitizeId(s) {
  return String(s).replace(/[^A-Za-z0-9_\-]/g, '_');
}

function sanitizeLiteral(s) {
  return String(s).replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ============================================
// Helper - SPARQL Query
// ============================================
async function sparqlSelect(query) {
  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
      ...fusekiAuth
    });
    return response.data;
  } catch (err) {
    throw new Error(`SPARQL Query Error: ${err.message}`);
  }
}

// ============================================
// Helper - SPARQL Update
// ============================================
async function sparqlUpdate(query) {
  try {
    await axios.post(`${FUSEKI_URL}/update`, query, {
      headers: { "Content-Type": "application/sparql-update" },
      ...fusekiAuth
    });
    return true;
  } catch (err) {
    throw new Error(`SPARQL Update Error: ${err.message}`);
  }
}

// ============================================
// GET - Récupérer les paiements par utilisateur
// ============================================
router.get("/", async (req, res) => {
  try {
    const user = req.query.user;
    
    // Si aucun user n'est spécifié, retourner tous les paiements
    if (!user) {
      const query = PREFIXES + `
SELECT ?paiement ?montant ?date ?service ?status ?ref ?mode ?user WHERE {
  ?paiement rdf:type sh:PaiementFacture .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:referenceFacture ?ref . }
  OPTIONAL { ?paiement sh:modePaiement ?mode . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
} ORDER BY DESC(?date)
      `;
      
      const json = await sparqlSelect(query);
      const payments = json.results.bindings.map(b => ({
        uri: b.paiement.value,
        id: b.paiement.value.split(/[#\/]/).pop(),
        montant: b.montant ? parseFloat(b.montant.value) : null,
        date: b.date ? b.date.value : null,
        serviceUri: b.service ? b.service.value : null,
        serviceId: b.service ? b.service.value.split(/[#\/]/).pop() : null,
        status: b.status ? b.status.value : null,
        referenceFacture: b.ref ? b.ref.value : null,
        modePaiement: b.mode ? b.mode.value : null,
        userUri: b.user ? b.user.value : null,
        userId: b.user ? b.user.value.split(/[#\/]/).pop() : null
      }));
      
      return res.json({
        success: true,
        payments
      });
    }

    const userId = sanitizeId(user.replace(/^(sh:|ex:)/, ''));
    const userUri = `ex:${userId}`;

    const query = PREFIXES + `
SELECT ?paiement ?montant ?date ?service ?status ?ref ?mode WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:effectuéPar ${userUri} .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:referenceFacture ?ref . }
  OPTIONAL { ?paiement sh:modePaiement ?mode . }
} ORDER BY DESC(?date)
    `;

    const json = await sparqlSelect(query);
    const payments = json.results.bindings.map(b => ({
      uri: b.paiement.value,
      id: b.paiement.value.split(/[#\/]/).pop(),
      montant: b.montant ? parseFloat(b.montant.value) : null,
      date: b.date ? b.date.value : null,
      serviceUri: b.service ? b.service.value : null,
      serviceId: b.service ? b.service.value.split(/[#\/]/).pop() : null,
      status: b.status ? b.status.value : null,
      referenceFacture: b.ref ? b.ref.value : null,
      modePaiement: b.mode ? b.mode.value : null
    }));

    res.json({
      success: true,
      payments
    });
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// GET - Récupérer un paiement par ID
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    const resource = `sh:${id}`;
    
    const query = PREFIXES + `
SELECT ?p ?o WHERE {
  ${resource} ?p ?o .
}
    `;

    const json = await sparqlSelect(query);
    
    if (json.results.bindings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({
      success: true,
      payment: json.results.bindings
    });
  } catch (err) {
    console.error("Get payment error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// POST - Créer un nouveau paiement
// ============================================
/*
Body expected:
{
  "user": "Utilisateur_John",
  "service": "Consultation_001",
  "montant": 80.0,
  "modePaiement": "Carte",
  "date": "2025-11-03",           // optional
  "status": "PAID",               // optional
  "referenceFacture": "F2025-001" // optional
}
*/
router.post("/", async (req, res) => {
  try {
    const { user, service, montant, modePaiement, date, status, referenceFacture } = req.body;
    
    if (!user || !service || montant === undefined) {
      return res.status(400).json({ 
        success: false,
        error: "user, service, and montant are required" 
      });
    }

    const uid = sanitizeId(user.replace(/^(sh:|ex:)/, ''));
    const sid = sanitizeId(service.replace(/^sh:/, ''));
    const pid = `Paiement_${uuidv4().replace(/-/g, '')}`;
    const resource = `sh:${pid}`;

    const userUri = `ex:${uid}`;
    const serviceUri = `sh:${sid}`;
    const dateVal = date ? date : new Date().toISOString().slice(0, 10);

    const insertTriples = [
      `${resource} rdf:type sh:PaiementFacture .`,
      `${resource} sh:effectuéPar ${userUri} .`,
      `${resource} sh:correspondÀ ${serviceUri} .`,
      `${resource} sh:montant "${Number(montant)}"^^xsd:decimal .`,
      `${resource} sh:modePaiement "${sanitizeLiteral(modePaiement || 'Inconnu')}" .`,
      `${resource} sh:datePaiement "${dateVal}"^^xsd:date .`
    ];

    if (status) {
      insertTriples.push(`${resource} sh:statusPaiement "${sanitizeLiteral(status)}" .`);
    }
    if (referenceFacture) {
      insertTriples.push(`${resource} sh:referenceFacture "${sanitizeLiteral(referenceFacture)}" .`);
    }

    const insert = PREFIXES + `INSERT DATA { ${insertTriples.join('\n')} }`;
    await sparqlUpdate(insert);

    res.status(201).json({ 
      success: true,
      message: "Payment created successfully",
      payment: { 
        id: pid,
        user: uid,
        service: sid,
        montant,
        modePaiement,
        date: dateVal,
        status,
        referenceFacture
      }
    });
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// PUT - Mettre à jour un paiement
// ============================================
/*
Body can contain any of: montant, date, modePaiement, status, referenceFacture
*/
router.put("/:id", async (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    const { montant, date, modePaiement, status, referenceFacture } = req.body;
    const resource = `sh:${id}`;

    // Build DELETE and INSERT clauses only for provided fields
    let deleteClause = '';
    let insertClause = '';

    if (montant !== undefined) {
      deleteClause += `${resource} sh:montant ?oldMontant .\n`;
      insertClause += `${resource} sh:montant "${Number(montant)}"^^xsd:decimal .\n`;
    }
    if (date !== undefined) {
      deleteClause += `${resource} sh:datePaiement ?oldDate .\n`;
      insertClause += `${resource} sh:datePaiement "${date}"^^xsd:date .\n`;
    }
    if (modePaiement !== undefined) {
      deleteClause += `${resource} sh:modePaiement ?oldMode .\n`;
      insertClause += `${resource} sh:modePaiement "${sanitizeLiteral(modePaiement)}" .\n`;
    }
    if (status !== undefined) {
      deleteClause += `${resource} sh:statusPaiement ?oldStatus .\n`;
      insertClause += `${resource} sh:statusPaiement "${sanitizeLiteral(status)}" .\n`;
    }
    if (referenceFacture !== undefined) {
      deleteClause += `${resource} sh:referenceFacture ?oldRef .\n`;
      insertClause += `${resource} sh:referenceFacture "${sanitizeLiteral(referenceFacture)}" .\n`;
    }

    if (!deleteClause && !insertClause) {
      return res.status(400).json({ 
        success: false,
        error: "no updatable fields provided" 
      });
    }

    const query = PREFIXES + `
DELETE {
  ${deleteClause}
}
INSERT {
  ${insertClause}
}
WHERE {
  OPTIONAL { ${resource} sh:montant ?oldMontant . }
  OPTIONAL { ${resource} sh:datePaiement ?oldDate . }
  OPTIONAL { ${resource} sh:modePaiement ?oldMode . }
  OPTIONAL { ${resource} sh:statusPaiement ?oldStatus . }
  OPTIONAL { ${resource} sh:referenceFacture ?oldRef . }
}
    `;

    await sparqlUpdate(query);

    res.json({ 
      success: true,
      message: "Payment updated successfully",
      payment: { id, montant, date, modePaiement, status, referenceFacture }
    });
  } catch (err) {
    console.error("Update payment error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// DELETE - Supprimer un paiement
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    const resource = `sh:${id}`;
    
    const query = PREFIXES + `
DELETE WHERE { ${resource} ?p ?o . }
    `;

    await sparqlUpdate(query);

    res.json({ 
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (err) {
    console.error("Delete payment error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// GET - Statistiques des paiements
// ============================================
router.get("/stats/:user", async (req, res) => {
  try {
    const user = req.params.user;
    const userId = sanitizeId(user.replace(/^(sh:|ex:)/, ''));
    const userUri = `ex:${userId}`;

    const query = PREFIXES + `
SELECT 
  (COUNT(?paiement) as ?total)
  (SUM(?montant) as ?totalMontant)
  (AVG(?montant) as ?avgMontant)
WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:effectuéPar ${userUri} ;
            sh:montant ?montant .
}
    `;

    const json = await sparqlSelect(query);
    const binding = json.results.bindings[0];

    res.json({
      success: true,
      stats: {
        total: binding.total ? parseInt(binding.total.value) : 0,
        totalMontant: binding.totalMontant ? parseFloat(binding.totalMontant.value) : 0,
        avgMontant: binding.avgMontant ? parseFloat(binding.avgMontant.value) : 0
      }
    });
  } catch (err) {
    console.error("Get payment stats error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
