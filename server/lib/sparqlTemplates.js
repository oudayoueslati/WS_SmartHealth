/**
 * SPARQL Templates - Générateurs de requêtes SPARQL réutilisables
 * Référence: https://www.w3.org/TR/sparql11-query/
 */

const PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
`;

/**
 * Utilitaire pour échapper les littéraux
 */
function escapeLiteral(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// ============================================
// SERVICES TEMPLATES
// ============================================

/**
 * SELECT tous les services
 */
function selectAllServices() {
  return PREFIXES + `
SELECT ?service ?type ?label WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
}
ORDER BY ?service
  `;
}

/**
 * SELECT un service par ID
 */
function selectServiceById(serviceId) {
  return PREFIXES + `
SELECT ?p ?o WHERE {
  sh:${serviceId} ?p ?o .
}
  `;
}

/**
 * INSERT un nouveau service
 */
function insertService({ id, type, label }) {
  const resource = `sh:${id}`;
  const typeUri = `sh:${type}`;
  
  let triples = [
    `${resource} rdf:type ${typeUri} .`
  ];
  
  if (label) {
    triples.push(`${resource} sh:label "${escapeLiteral(label)}" .`);
  }
  
  return PREFIXES + `
INSERT DATA {
  ${triples.join('\n  ')}
}
  `;
}

/**
 * UPDATE un service (DELETE/INSERT pattern)
 */
function updateService({ id, type, label }) {
  const resource = `sh:${id}`;
  const typeUri = type ? `sh:${type}` : null;
  
  let deleteClause = '';
  let insertClause = '';
  
  if (type) {
    deleteClause += `${resource} rdf:type ?oldType .\n  `;
    insertClause += `${resource} rdf:type ${typeUri} .\n  `;
  }
  
  if (label !== undefined) {
    deleteClause += `${resource} sh:label ?oldLabel .\n  `;
    insertClause += `${resource} sh:label "${escapeLiteral(label)}" .\n  `;
  }
  
  return PREFIXES + `
DELETE {
  ${deleteClause}
}
INSERT {
  ${insertClause}
}
WHERE {
  OPTIONAL { ${resource} rdf:type ?oldType }
  OPTIONAL { ${resource} sh:label ?oldLabel }
}
  `;
}

/**
 * DELETE un service
 */
function deleteService(serviceId) {
  return PREFIXES + `
DELETE WHERE {
  sh:${serviceId} ?p ?o .
}
  `;
}

// ============================================
// PAYMENTS TEMPLATES
// ============================================

/**
 * SELECT paiements par utilisateur
 */
function selectPaymentsByUser(userId) {
  const userUri = `sh:${userId}`;
  
  return PREFIXES + `
SELECT ?paiement ?montant ?date ?service ?status ?ref ?mode WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:effectuéPar ${userUri} .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:referenceFacture ?ref . }
  OPTIONAL { ?paiement sh:modePaiement ?mode . }
}
ORDER BY DESC(?date)
  `;
}

/**
 * SELECT un paiement par ID
 */
function selectPaymentById(paymentId) {
  return PREFIXES + `
SELECT ?p ?o WHERE {
  sh:${paymentId} ?p ?o .
}
  `;
}

/**
 * INSERT un nouveau paiement
 */
function insertPayment({ 
  id, 
  userId, 
  serviceId, 
  montant, 
  modePaiement, 
  date, 
  status, 
  referenceFacture 
}) {
  const resource = `sh:${id}`;
  const userUri = `sh:${userId}`;
  const serviceUri = `sh:${serviceId}`;
  
  let triples = [
    `${resource} rdf:type sh:PaiementFacture .`,
    `${resource} sh:effectuéPar ${userUri} .`,
    `${resource} sh:correspondÀ ${serviceUri} .`,
    `${resource} sh:montant "${Number(montant)}"^^xsd:decimal .`,
    `${resource} sh:modePaiement "${escapeLiteral(modePaiement)}" .`,
    `${resource} sh:datePaiement "${date}"^^xsd:date .`
  ];
  
  if (status) {
    triples.push(`${resource} sh:statusPaiement "${escapeLiteral(status)}" .`);
  }
  
  if (referenceFacture) {
    triples.push(`${resource} sh:referenceFacture "${escapeLiteral(referenceFacture)}" .`);
  }
  
  return PREFIXES + `
INSERT DATA {
  ${triples.join('\n  ')}
}
  `;
}

/**
 * UPDATE un paiement (DELETE/INSERT pattern)
 */
function updatePayment(paymentId, updates) {
  const resource = `sh:${paymentId}`;
  let deleteClause = '';
  let insertClause = '';
  let whereClause = '';
  
  if (updates.montant !== undefined) {
    deleteClause += `${resource} sh:montant ?oldMontant .\n  `;
    insertClause += `${resource} sh:montant "${Number(updates.montant)}"^^xsd:decimal .\n  `;
    whereClause += `OPTIONAL { ${resource} sh:montant ?oldMontant . }\n  `;
  }
  
  if (updates.date !== undefined) {
    deleteClause += `${resource} sh:datePaiement ?oldDate .\n  `;
    insertClause += `${resource} sh:datePaiement "${updates.date}"^^xsd:date .\n  `;
    whereClause += `OPTIONAL { ${resource} sh:datePaiement ?oldDate . }\n  `;
  }
  
  if (updates.modePaiement !== undefined) {
    deleteClause += `${resource} sh:modePaiement ?oldMode .\n  `;
    insertClause += `${resource} sh:modePaiement "${escapeLiteral(updates.modePaiement)}" .\n  `;
    whereClause += `OPTIONAL { ${resource} sh:modePaiement ?oldMode . }\n  `;
  }
  
  if (updates.status !== undefined) {
    deleteClause += `${resource} sh:statusPaiement ?oldStatus .\n  `;
    insertClause += `${resource} sh:statusPaiement "${escapeLiteral(updates.status)}" .\n  `;
    whereClause += `OPTIONAL { ${resource} sh:statusPaiement ?oldStatus . }\n  `;
  }
  
  if (updates.referenceFacture !== undefined) {
    deleteClause += `${resource} sh:referenceFacture ?oldRef .\n  `;
    insertClause += `${resource} sh:referenceFacture "${escapeLiteral(updates.referenceFacture)}" .\n  `;
    whereClause += `OPTIONAL { ${resource} sh:referenceFacture ?oldRef . }\n  `;
  }
  
  return PREFIXES + `
DELETE {
  ${deleteClause}
}
INSERT {
  ${insertClause}
}
WHERE {
  ${whereClause}
}
  `;
}

/**
 * DELETE un paiement
 */
function deletePayment(paymentId) {
  return PREFIXES + `
DELETE WHERE {
  sh:${paymentId} ?p ?o .
}
  `;
}

/**
 * SELECT statistiques de paiement par utilisateur
 */
function selectPaymentStats(userId) {
  const userUri = `sh:${userId}`;
  
  return PREFIXES + `
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
}

/**
 * ASK si un service existe
 */
function askServiceExists(serviceId) {
  return PREFIXES + `
ASK {
  sh:${serviceId} ?p ?o .
}
  `;
}

/**
 * ASK si un paiement existe
 */
function askPaymentExists(paymentId) {
  return PREFIXES + `
ASK {
  sh:${paymentId} rdf:type sh:PaiementFacture .
}
  `;
}

/**
 * SELECT paiements par service
 */
function selectPaymentsByService(serviceId) {
  const serviceUri = `sh:${serviceId}`;
  
  return PREFIXES + `
SELECT ?paiement ?montant ?date ?user ?status WHERE {
  ?paiement rdf:type sh:PaiementFacture ;
            sh:correspondÀ ${serviceUri} .
  OPTIONAL { ?paiement sh:montant ?montant . }
  OPTIONAL { ?paiement sh:datePaiement ?date . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
}
ORDER BY DESC(?date)
  `;
}

module.exports = {
  // Services
  selectAllServices,
  selectServiceById,
  insertService,
  updateService,
  deleteService,
  askServiceExists,
  
  // Payments
  selectPaymentsByUser,
  selectPaymentById,
  insertPayment,
  updatePayment,
  deletePayment,
  selectPaymentStats,
  askPaymentExists,
  selectPaymentsByService,
  
  // Utilities
  escapeLiteral,
  PREFIXES
};
