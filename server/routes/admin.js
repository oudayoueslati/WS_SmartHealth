const express = require("express");
const axios = require("axios");
const { FUSEKI_URL, fusekiAuth } = require('../config/fuseki');
const router = express.Router();


// Préfixes SPARQL
const PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
`;

// ============================================
// Helper - SPARQL Query
// ============================================
async function sparqlSelect(query) {
  try {
    const response = await axios.get(`${FUSEKI_URL}/query`, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" }
    });
    return response.data;
  } catch (err) {
    throw new Error(`SPARQL Query Error: ${err.message}`);
  }
}

// ============================================
// GET - Dashboard global (statistiques générales)
// ============================================
router.get("/dashboard", async (req, res) => {
  try {
    // Statistiques des paiements
    const paymentsQuery = PREFIXES + `
SELECT 
  (COUNT(DISTINCT ?paiement) as ?totalPayments)
  (SUM(?montant) as ?totalRevenue)
  (AVG(?montant) as ?avgPayment)
  (COUNT(DISTINCT ?user) as ?totalUsers)
WHERE {
  ?paiement rdf:type sh:PaiementFacture .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
}
    `;

    // Statistiques des services
    const servicesQuery = PREFIXES + `
SELECT 
  (COUNT(?service) as ?totalServices)
  (COUNT(?consultation) as ?totalConsultations)
  (COUNT(?analyse) as ?totalAnalyses)
  (COUNT(?telemedicine) as ?totalTelemedicine)
WHERE {
  OPTIONAL { ?service rdf:type ?type . FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine) }
  OPTIONAL { ?consultation rdf:type sh:Consultation . }
  OPTIONAL { ?analyse rdf:type sh:Analyse . }
  OPTIONAL { ?telemedicine rdf:type sh:Telemedecine . }
}
    `;

    // Paiements par statut
    const statusQuery = PREFIXES + `
SELECT ?status (COUNT(?paiement) as ?count) (SUM(?montant) as ?total)
WHERE {
  ?paiement rdf:type sh:PaiementFacture .
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:montant ?montant . }
}
GROUP BY ?status
    `;

    // Paiements récents
    const recentQuery = PREFIXES + `
SELECT ?paiement ?montant ?date ?user ?service ?status
WHERE {
  ?paiement rdf:type sh:PaiementFacture .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
}
ORDER BY DESC(?date)
LIMIT 10
    `;

    const [paymentsData, servicesData, statusData, recentData] = await Promise.all([
      sparqlSelect(paymentsQuery),
      sparqlSelect(servicesQuery),
      sparqlSelect(statusQuery),
      sparqlSelect(recentQuery)
    ]);

    const paymentsStats = paymentsData.results.bindings[0];
    const servicesStats = servicesData.results.bindings[0];

    const statusBreakdown = statusData.results.bindings.map(b => ({
      status: b.status ? b.status.value : 'UNKNOWN',
      count: b.count ? parseInt(b.count.value) : 0,
      total: b.total ? parseFloat(b.total.value) : 0
    }));

    const recentPayments = recentData.results.bindings.map(b => ({
      uri: b.paiement.value,
      id: b.paiement.value.split(/[#\/]/).pop(),
      montant: b.montant ? parseFloat(b.montant.value) : null,
      date: b.date ? b.date.value : null,
      user: b.user ? b.user.value.split(/[#\/]/).pop() : null,
      service: b.service ? b.service.value.split(/[#\/]/).pop() : null,
      status: b.status ? b.status.value : null
    }));

    res.json({
      success: true,
      dashboard: {
        payments: {
          total: paymentsStats.totalPayments ? parseInt(paymentsStats.totalPayments.value) : 0,
          totalRevenue: paymentsStats.totalRevenue ? parseFloat(paymentsStats.totalRevenue.value) : 0,
          avgPayment: paymentsStats.avgPayment ? parseFloat(paymentsStats.avgPayment.value) : 0,
          byStatus: statusBreakdown
        },
        services: {
          total: servicesStats.totalServices ? parseInt(servicesStats.totalServices.value) : 0,
          consultations: servicesStats.totalConsultations ? parseInt(servicesStats.totalConsultations.value) : 0,
          analyses: servicesStats.totalAnalyses ? parseInt(servicesStats.totalAnalyses.value) : 0,
          telemedicine: servicesStats.totalTelemedicine ? parseInt(servicesStats.totalTelemedicine.value) : 0
        },
        users: {
          total: paymentsStats.totalUsers ? parseInt(paymentsStats.totalUsers.value) : 0
        },
        recentPayments
      }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// GET - Tous les paiements (admin)
// ============================================
router.get("/payments", async (req, res) => {
  try {
    const { status, startDate, endDate, minAmount, maxAmount, limit = 100 } = req.query;

    let filters = [];
    if (status) filters.push(`FILTER(?status = "${status}")`);
    if (startDate) filters.push(`FILTER(?date >= "${startDate}"^^xsd:date)`);
    if (endDate) filters.push(`FILTER(?date <= "${endDate}"^^xsd:date)`);
    if (minAmount) filters.push(`FILTER(?montant >= ${parseFloat(minAmount)})`);
    if (maxAmount) filters.push(`FILTER(?montant <= ${parseFloat(maxAmount)})`);

    const query = PREFIXES + `
SELECT ?paiement ?montant ?date ?user ?service ?status ?ref ?mode
WHERE {
  ?paiement rdf:type sh:PaiementFacture .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:referenceFacture ?ref . }
  OPTIONAL { ?paiement sh:modePaiement ?mode . }
  ${filters.join('\n  ')}
}
ORDER BY DESC(?date)
LIMIT ${parseInt(limit)}
    `;

    const json = await sparqlSelect(query);
    const payments = json.results.bindings.map(b => ({
      uri: b.paiement.value,
      id: b.paiement.value.split(/[#\/]/).pop(),
      montant: b.montant ? parseFloat(b.montant.value) : null,
      date: b.date ? b.date.value : null,
      user: b.user ? b.user.value.split(/[#\/]/).pop() : null,
      service: b.service ? b.service.value.split(/[#\/]/).pop() : null,
      status: b.status ? b.status.value : null,
      referenceFacture: b.ref ? b.ref.value : null,
      modePaiement: b.mode ? b.mode.value : null
    }));

    res.json({
      success: true,
      payments,
      count: payments.length
    });
  } catch (err) {
    console.error("Get all payments error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// GET - Statistiques par utilisateur
// ============================================
router.get("/users/stats", async (req, res) => {
  try {
    const query = PREFIXES + `
SELECT ?user 
  (COUNT(?paiement) as ?totalPayments)
  (SUM(?montant) as ?totalSpent)
  (AVG(?montant) as ?avgPayment)
  (MAX(?date) as ?lastPayment)
WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:effectuéPar ?user .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
}
GROUP BY ?user
ORDER BY DESC(?totalSpent)
    `;

    const json = await sparqlSelect(query);
    const userStats = json.results.bindings.map(b => ({
      user: b.user.value.split(/[#\/]/).pop(),
      totalPayments: b.totalPayments ? parseInt(b.totalPayments.value) : 0,
      totalSpent: b.totalSpent ? parseFloat(b.totalSpent.value) : 0,
      avgPayment: b.avgPayment ? parseFloat(b.avgPayment.value) : 0,
      lastPayment: b.lastPayment ? b.lastPayment.value : null
    }));

    res.json({
      success: true,
      userStats
    });
  } catch (err) {
    console.error("User stats error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// GET - Statistiques par service
// ============================================
router.get("/services/stats", async (req, res) => {
  try {
    const query = PREFIXES + `
SELECT ?service 
  (COUNT(?paiement) as ?totalPayments)
  (SUM(?montant) as ?totalRevenue)
  (AVG(?montant) as ?avgRevenue)
WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:correspondÀ ?service ;
            sh:montant ?montant .
}
GROUP BY ?service
ORDER BY DESC(?totalRevenue)
    `;

    const json = await sparqlSelect(query);
    const serviceStats = json.results.bindings.map(b => ({
      service: b.service.value.split(/[#\/]/).pop(),
      totalPayments: b.totalPayments ? parseInt(b.totalPayments.value) : 0,
      totalRevenue: b.totalRevenue ? parseFloat(b.totalRevenue.value) : 0,
      avgRevenue: b.avgRevenue ? parseFloat(b.avgRevenue.value) : 0
    }));

    res.json({
      success: true,
      serviceStats
    });
  } catch (err) {
    console.error("Service stats error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ============================================
// GET - Rapport mensuel
// ============================================
router.get("/reports/monthly", async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: "year and month parameters required (e.g., ?year=2025&month=11)"
      });
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    const query = PREFIXES + `
SELECT ?date 
  (COUNT(?paiement) as ?count)
  (SUM(?montant) as ?total)
WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:datePaiement ?date ;
            sh:montant ?montant .
  FILTER(?date >= "${startDate}"^^xsd:date && ?date < "${endDate}"^^xsd:date)
}
GROUP BY ?date
ORDER BY ?date
    `;

    const json = await sparqlSelect(query);
    const dailyStats = json.results.bindings.map(b => ({
      date: b.date.value,
      count: b.count ? parseInt(b.count.value) : 0,
      total: b.total ? parseFloat(b.total.value) : 0
    }));

    const totalRevenue = dailyStats.reduce((sum, day) => sum + day.total, 0);
    const totalTransactions = dailyStats.reduce((sum, day) => sum + day.count, 0);

    res.json({
      success: true,
      report: {
        period: `${year}-${month}`,
        totalRevenue,
        totalTransactions,
        avgPerDay: dailyStats.length > 0 ? totalRevenue / dailyStats.length : 0,
        dailyStats
      }
    });
  } catch (err) {
    console.error("Monthly report error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
