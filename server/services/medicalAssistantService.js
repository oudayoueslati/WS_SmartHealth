/**
 * Service d'assistant médical intelligent
 * Traduit les questions en langage naturel en requêtes SPARQL
 */

// Patterns de questions et leurs templates SPARQL correspondants
const QUESTION_PATTERNS = {
  // Questions sur les services disponibles
  servicesDisponibles: {
    patterns: [
      /quels?\s+(sont\s+)?les?\s+services?\s+(médicaux?\s+)?(disponibles?|proposés?)/i,
      /liste\s+(des\s+)?services?\s+médicaux?/i,
      /services?\s+(pour|concernant|relatifs?\s+à)\s+(.+)/i
    ],
    handler: (match) => {
      const condition = match[2] || match[3];
      if (condition) {
        return generateServicesByConditionQuery(condition);
      }
      return generateAllServicesQuery();
    }
  },

  // Questions sur les prix/coûts
  prix: {
    patterns: [
      /combien\s+coûte\s+(.+)/i,
      /quel\s+est\s+le\s+(prix|coût|tarif)\s+(de|d'|pour)\s+(.+)/i,
      /prix\s+(de|d'|pour)\s+(.+)/i,
      /tarif\s+(de|d'|pour)\s+(.+)/i
    ],
    handler: (match) => {
      const service = match[1] || match[3] || match[2];
      return generatePriceQuery(service);
    }
  },

  // Questions sur les examens/analyses
  examens: {
    patterns: [
      /quels?\s+examens?\s+(sont\s+)?(inclus?|compris?|nécessaires?)\s+(dans|pour)\s+(.+)/i,
      /que\s+comprend\s+(.+)/i,
      /contenu\s+(de|d')\s+(.+)/i
    ],
    handler: (match) => {
      const service = match[4] || match[1] || match[2];
      return generateExamsQuery(service);
    }
  },

  // Questions sur les utilisateurs/patients
  utilisateurs: {
    patterns: [
      /combien\s+(de\s+)?(patients?|utilisateurs?)/i,
      /liste\s+(des\s+)?(patients?|utilisateurs?)/i,
      /qui\s+sont\s+les\s+(patients?|utilisateurs?)/i
    ],
    handler: () => generateUsersQuery()
  },

  // Questions sur les paiements
  paiements: {
    patterns: [
      /paiements?\s+(de|pour)\s+(.+)/i,
      /historique\s+(de\s+)?paiements?\s+(de|pour)\s+(.+)/i,
      /combien\s+a\s+payé\s+(.+)/i,
      /total\s+(des\s+)?paiements?\s+(de|pour)\s+(.+)/i
    ],
    handler: (match) => {
      const user = match[2] || match[3] || match[1];
      return generatePaymentsQuery(user);
    }
  },

  // Questions sur les statistiques
  statistiques: {
    patterns: [
      /statistiques?\s+(de|des|sur)\s+(.+)/i,
      /combien\s+(de\s+)?consultations?/i,
      /nombre\s+(de|d')\s+(.+)/i
    ],
    handler: (match) => {
      const subject = match[2];
      return generateStatsQuery(subject);
    }
  }
};

/**
 * Génère une requête SPARQL pour tous les services
 */
function generateAllServicesQuery() {
  return {
    query: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
}
ORDER BY ?type ?service`,
    type: 'services',
    description: 'Liste de tous les services médicaux disponibles'
  };
}

/**
 * Génère une requête SPARQL pour les services liés à une condition
 */
function generateServicesByConditionQuery(condition) {
  const normalizedCondition = condition.toLowerCase();
  let serviceType = '';

  // Mapping de conditions vers types de services
  if (normalizedCondition.includes('cardiaque') || normalizedCondition.includes('coeur') || normalizedCondition.includes('cardiologie')) {
    serviceType = 'Consultation';
  } else if (normalizedCondition.includes('analyse') || normalizedCondition.includes('sang') || normalizedCondition.includes('test')) {
    serviceType = 'Analyse';
  } else if (normalizedCondition.includes('distance') || normalizedCondition.includes('télé') || normalizedCondition.includes('en ligne')) {
    serviceType = 'Telemedecine';
  }

  return {
    query: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label WHERE {
  ?service rdf:type ?type .
  ${serviceType ? `FILTER(?type = sh:${serviceType})` : 'FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)'}
  OPTIONAL { ?service sh:label ?label }
  ${!serviceType ? `FILTER(CONTAINS(LCASE(STR(?label)), "${normalizedCondition}"))` : ''}
}
ORDER BY ?service`,
    type: 'services',
    description: `Services médicaux pour: ${condition}`
  };
}

/**
 * Génère une requête SPARQL pour le prix d'un service
 */
function generatePriceQuery(service) {
  const normalizedService = service.toLowerCase().trim();
  
  return {
    query: `
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?label ?montant (COUNT(?paiement) as ?nombrePaiements) WHERE {
  ?paiement a sh:PaiementFacture ;
            sh:correspondÀ ?service ;
            sh:montant ?montant .
  OPTIONAL { ?service sh:label ?label }
  FILTER(CONTAINS(LCASE(STR(?label)), "${normalizedService}") || CONTAINS(LCASE(STR(?service)), "${normalizedService}"))
}
GROUP BY ?service ?label ?montant
ORDER BY DESC(?nombrePaiements)`,
    type: 'prices',
    description: `Prix pour: ${service}`
  };
}

/**
 * Génère une requête SPARQL pour les examens d'un service
 */
function generateExamsQuery(service) {
  const normalizedService = service.toLowerCase().trim();
  
  return {
    query: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?service ?type ?label ?description WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
  OPTIONAL { ?service sh:label ?label }
  OPTIONAL { ?service sh:description ?description }
  FILTER(CONTAINS(LCASE(STR(?label)), "${normalizedService}") || CONTAINS(LCASE(STR(?service)), "${normalizedService}"))
}`,
    type: 'exams',
    description: `Détails des examens pour: ${service}`
  };
}

/**
 * Génère une requête SPARQL pour les utilisateurs
 */
function generateUsersQuery() {
  return {
    query: `
PREFIX ex: <http://example.org/>

SELECT ?username ?email ?firstName ?lastName WHERE {
  ?user a ex:User ;
        ex:username ?username ;
        ex:email ?email .
  OPTIONAL { ?user ex:firstName ?firstName . }
  OPTIONAL { ?user ex:lastName ?lastName . }
}
ORDER BY ?username`,
    type: 'users',
    description: 'Liste des utilisateurs/patients'
  };
}

/**
 * Génère une requête SPARQL pour les paiements d'un utilisateur
 */
function generatePaymentsQuery(user) {
  const normalizedUser = user.toLowerCase().trim().replace(/\s+/g, '_');
  
  return {
    query: `
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?paiement ?montant ?date ?service ?status WHERE {
  ?paiement a sh:PaiementFacture ;
            sh:montant ?montant ;
            sh:datePaiement ?date .
  OPTIONAL { ?paiement sh:correspondÀ ?service . }
  OPTIONAL { ?paiement sh:statusPaiement ?status . }
  OPTIONAL { ?paiement sh:effectuéPar ?user . }
  FILTER(CONTAINS(LCASE(STR(?user)), "${normalizedUser}"))
}
ORDER BY DESC(?date)`,
    type: 'payments',
    description: `Historique des paiements pour: ${user}`
  };
}

/**
 * Génère une requête SPARQL pour les statistiques
 */
function generateStatsQuery(subject) {
  if (!subject || subject.includes('service') || subject.includes('consultation')) {
    return {
      query: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?type (COUNT(?service) as ?count) WHERE {
  ?service rdf:type ?type .
  FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
}
GROUP BY ?type
ORDER BY DESC(?count)`,
      type: 'stats',
      description: 'Statistiques des services par type'
    };
  }

  if (subject.includes('paiement')) {
    return {
      query: `
PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

SELECT ?status (COUNT(?paiement) as ?count) (SUM(?montant) as ?total) WHERE {
  ?paiement a sh:PaiementFacture ;
            sh:statusPaiement ?status ;
            sh:montant ?montant .
}
GROUP BY ?status
ORDER BY DESC(?count)`,
      type: 'stats',
      description: 'Statistiques des paiements par statut'
    };
  }

  return generateAllServicesQuery();
}

/**
 * Analyse une question et génère la requête SPARQL appropriée
 */
function analyzeQuestion(question) {
  const normalizedQuestion = question.trim();

  // Parcourir tous les patterns
  for (const [category, config] of Object.entries(QUESTION_PATTERNS)) {
    for (const pattern of config.patterns) {
      const match = normalizedQuestion.match(pattern);
      if (match) {
        return {
          category,
          ...config.handler(match),
          originalQuestion: question
        };
      }
    }
  }

  // Question non reconnue - retourner une requête générale
  return {
    category: 'unknown',
    query: generateAllServicesQuery().query,
    type: 'services',
    description: 'Question non reconnue - affichage des services disponibles',
    originalQuestion: question,
    suggestion: 'Essayez de reformuler votre question. Exemples: "Quels sont les services disponibles ?", "Combien coûte une consultation ?", "Quels examens pour un check-up ?"'
  };
}

/**
 * Formate la réponse en langage naturel
 */
function formatResponse(queryResult, queryInfo) {
  const { type, description } = queryInfo;
  let response = {
    answer: '',
    data: queryResult,
    type,
    description
  };

  switch (type) {
    case 'services':
      response.answer = formatServicesResponse(queryResult);
      break;
    case 'prices':
      response.answer = formatPricesResponse(queryResult);
      break;
    case 'users':
      response.answer = formatUsersResponse(queryResult);
      break;
    case 'payments':
      response.answer = formatPaymentsResponse(queryResult);
      break;
    case 'stats':
      response.answer = formatStatsResponse(queryResult);
      break;
    default:
      response.answer = `J'ai trouvé ${queryResult.length} résultat(s).`;
  }

  return response;
}

function formatServicesResponse(results) {
  if (results.length === 0) {
    return "Je n'ai trouvé aucun service correspondant à votre recherche.";
  }

  const servicesByType = results.reduce((acc, r) => {
    const type = r.type?.value?.split('#').pop() || 'Autre';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  let answer = `J'ai trouvé ${results.length} service(s) médical(aux):\n\n`;
  
  for (const [type, services] of Object.entries(servicesByType)) {
    answer += `**${type}** (${services.length}):\n`;
    services.forEach(s => {
      const label = s.label?.value || s.service?.value?.split('#').pop();
      answer += `• ${label}\n`;
    });
    answer += '\n';
  }

  return answer;
}

function formatPricesResponse(results) {
  if (results.length === 0) {
    return "Je n'ai pas trouvé d'information de prix pour ce service.";
  }

  const service = results[0];
  const label = service.label?.value || service.service?.value?.split('#').pop();
  const montant = service.montant?.value;
  const nombrePaiements = service.nombrePaiements?.value;

  return `Le service **${label}** coûte **${montant}€** (basé sur ${nombrePaiements} paiement(s) enregistré(s)).`;
}

function formatUsersResponse(results) {
  if (results.length === 0) {
    return "Aucun utilisateur trouvé.";
  }

  let answer = `Il y a ${results.length} utilisateur(s) enregistré(s):\n\n`;
  results.forEach(u => {
    const fullName = `${u.firstName?.value || ''} ${u.lastName?.value || ''}`.trim();
    answer += `• ${u.username?.value} (${fullName || u.email?.value})\n`;
  });

  return answer;
}

function formatPaymentsResponse(results) {
  if (results.length === 0) {
    return "Aucun paiement trouvé pour cet utilisateur.";
  }

  const total = results.reduce((sum, p) => sum + parseFloat(p.montant?.value || 0), 0);
  
  let answer = `J'ai trouvé ${results.length} paiement(s) pour un total de **${total.toFixed(2)}€**:\n\n`;
  results.slice(0, 5).forEach(p => {
    const montant = p.montant?.value;
    const date = p.date?.value;
    const status = p.status?.value || 'N/A';
    answer += `• ${date}: ${montant}€ (${status})\n`;
  });

  if (results.length > 5) {
    answer += `\n... et ${results.length - 5} autre(s) paiement(s).`;
  }

  return answer;
}

function formatStatsResponse(results) {
  if (results.length === 0) {
    return "Aucune statistique disponible.";
  }

  let answer = "Voici les statistiques:\n\n";
  results.forEach(r => {
    const type = r.type?.value?.split('#').pop() || r.status?.value || 'Total';
    const count = r.count?.value;
    const total = r.total?.value;
    
    answer += `• **${type}**: ${count} élément(s)`;
    if (total) {
      answer += ` (${parseFloat(total).toFixed(2)}€)`;
    }
    answer += '\n';
  });

  return answer;
}

module.exports = {
  analyzeQuestion,
  formatResponse,
  QUESTION_PATTERNS
};
