/**
 * Service de recommandation intelligente de services médicaux
 * Utilise un algorithme hybride basé sur:
 * - Le contenu (mots-clés, catégories)
 * - L'historique utilisateur
 * - Le profil utilisateur (âge, IMC, antécédents)
 */

// Mots-clés par catégorie de service
const SERVICE_KEYWORDS = {
  Consultation: {
    cardiologie: ['coeur', 'cardiaque', 'tension', 'hypertension', 'palpitation', 'cholesterol'],
    dermatologie: ['peau', 'acne', 'eczema', 'psoriasis', 'allergie cutanee', 'grain de beaute'],
    psychologie: ['stress', 'anxiete', 'depression', 'burnout', 'sommeil', 'mental', 'psychologique'],
    nutrition: ['poids', 'regime', 'diabete', 'obesite', 'nutrition', 'alimentation', 'imc'],
    generaliste: ['fievre', 'grippe', 'rhume', 'douleur', 'fatigue', 'general', 'check-up'],
    pediatrie: ['enfant', 'bebe', 'vaccination', 'croissance', 'pediatre'],
    gynecologie: ['femme', 'grossesse', 'contraception', 'menstruation', 'gyneco']
  },
  Analyse: {
    sanguine: ['sang', 'glycemie', 'cholesterol', 'anemie', 'diabete', 'bilan sanguin'],
    urine: ['urine', 'infection urinaire', 'reins', 'proteinurie'],
    hormonale: ['hormone', 'thyroide', 'testosterone', 'oestrogene'],
    genetique: ['genetique', 'adn', 'heredite', 'depistage']
  },
  Telemedecine: {
    urgence: ['urgent', 'rapide', 'immediat', 'teleconsultation urgente'],
    suivi: ['suivi', 'controle', 'surveillance', 'chronique'],
    conseil: ['conseil', 'avis', 'question', 'information']
  }
};

// Recommandations basées sur l'âge
const AGE_RECOMMENDATIONS = {
  '0-18': ['Consultation Pédiatrie', 'Vaccination', 'Suivi Croissance'],
  '18-35': ['Check-up Général', 'Consultation Dermatologie', 'Télémédecine'],
  '35-50': ['Bilan Sanguin', 'Consultation Cardiologie', 'Analyse Hormonale'],
  '50-65': ['Dépistage Cancer', 'Consultation Cardiologie', 'Analyse Complète'],
  '65+': ['Suivi Chronique', 'Consultation Gériatrie', 'Télémédecine Suivi']
};

// Recommandations basées sur l'IMC
const IMC_RECOMMENDATIONS = {
  'underweight': ['Consultation Nutrition', 'Bilan Sanguin', 'Suivi Nutritionnel'],
  'normal': ['Check-up Annuel', 'Prévention'],
  'overweight': ['Consultation Nutrition', 'Bilan Métabolique', 'Suivi Diététique'],
  'obese': ['Consultation Nutrition', 'Analyse Diabète', 'Suivi Cardiologique']
};

/**
 * Normalise et tokenise une requête utilisateur
 */
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calcule le score de pertinence d'un service pour une requête
 */
function calculateRelevanceScore(service, queryTokens, keywords) {
  let score = 0;
  const serviceText = `${service.type} ${service.label || ''}`.toLowerCase();

  // Score basé sur les mots-clés de la requête
  queryTokens.forEach(token => {
    if (serviceText.includes(token)) {
      score += 10;
    }
  });

  // Score basé sur les catégories de mots-clés
  const serviceCategory = SERVICE_KEYWORDS[service.type];
  if (serviceCategory) {
    Object.entries(serviceCategory).forEach(([category, categoryKeywords]) => {
      categoryKeywords.forEach(keyword => {
        queryTokens.forEach(token => {
          if (keyword.includes(token) || token.includes(keyword)) {
            score += 5;
            // Bonus si le service contient aussi ce mot-clé
            if (serviceText.includes(keyword)) {
              score += 15;
            }
          }
        });
      });
    });
  }

  return score;
}

/**
 * Calcule l'IMC et retourne la catégorie
 */
function calculateIMC(weight, height) {
  if (!weight || !height) return null;
  const imc = weight / ((height / 100) ** 2);
  
  if (imc < 18.5) return 'underweight';
  if (imc < 25) return 'normal';
  if (imc < 30) return 'overweight';
  return 'obese';
}

/**
 * Obtient la tranche d'âge
 */
function getAgeRange(age) {
  if (age < 18) return '0-18';
  if (age < 35) return '18-35';
  if (age < 50) return '35-50';
  if (age < 65) return '50-65';
  return '65+';
}

/**
 * Génère des recommandations basées sur le profil utilisateur
 */
function getProfileBasedRecommendations(userProfile) {
  const recommendations = [];

  if (userProfile.age) {
    const ageRange = getAgeRange(userProfile.age);
    recommendations.push(...(AGE_RECOMMENDATIONS[ageRange] || []));
  }

  if (userProfile.weight && userProfile.height) {
    const imcCategory = calculateIMC(userProfile.weight, userProfile.height);
    if (imcCategory) {
      recommendations.push(...(IMC_RECOMMENDATIONS[imcCategory] || []));
    }
  }

  return recommendations;
}

/**
 * Fonction principale de recommandation
 */
function recommendServices(query, availableServices, userProfile = {}, userHistory = []) {
  const queryTokens = normalizeQuery(query);
  const recommendations = [];

  // 1. Score basé sur le contenu (requête vs services)
  availableServices.forEach(service => {
    const contentScore = calculateRelevanceScore(service, queryTokens, SERVICE_KEYWORDS);
    
    if (contentScore > 0) {
      recommendations.push({
        service,
        score: contentScore,
        reason: 'Correspond à votre recherche'
      });
    }
  });

  // 2. Bonus basé sur l'historique utilisateur
  if (userHistory.length > 0) {
    const historyServiceTypes = userHistory.map(h => h.serviceType);
    recommendations.forEach(rec => {
      if (historyServiceTypes.includes(rec.service.type)) {
        rec.score += 5;
        rec.reason += ' (déjà utilisé)';
      }
    });
  }

  // 3. Bonus basé sur le profil utilisateur
  const profileRecommendations = getProfileBasedRecommendations(userProfile);
  recommendations.forEach(rec => {
    profileRecommendations.forEach(profRec => {
      if (rec.service.label && rec.service.label.toLowerCase().includes(profRec.toLowerCase())) {
        rec.score += 8;
        rec.reason += ' (adapté à votre profil)';
      }
    });
  });

  // Trier par score décroissant
  recommendations.sort((a, b) => b.score - a.score);

  // Retourner les 5 meilleurs résultats
  return recommendations.slice(0, 5).map(rec => ({
    ...rec.service,
    recommendationScore: rec.score,
    recommendationReason: rec.reason
  }));
}

/**
 * Génère des suggestions intelligentes basées sur des patterns communs
 */
function getSmartSuggestions(query) {
  const suggestions = [];
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('stress') || lowerQuery.includes('anxiete')) {
    suggestions.push({
      suggestion: 'Consultation Psychologie',
      reason: 'Pour gérer le stress et l\'anxiété'
    });
  }

  if (lowerQuery.includes('diabete') || lowerQuery.includes('sucre')) {
    suggestions.push(
      {
        suggestion: 'Analyse Glycémie',
        reason: 'Pour surveiller votre taux de sucre'
      },
      {
        suggestion: 'Consultation Nutrition',
        reason: 'Pour un suivi diététique adapté'
      }
    );
  }

  if (lowerQuery.includes('poids') || lowerQuery.includes('maigrir')) {
    suggestions.push({
      suggestion: 'Consultation Nutrition',
      reason: 'Pour un programme de gestion du poids'
    });
  }

  if (lowerQuery.includes('coeur') || lowerQuery.includes('cardiaque')) {
    suggestions.push({
      suggestion: 'Consultation Cardiologie',
      reason: 'Pour un examen cardiologique complet'
    });
  }

  return suggestions;
}

module.exports = {
  recommendServices,
  getSmartSuggestions,
  calculateIMC,
  getAgeRange,
  normalizeQuery
};
