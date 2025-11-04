const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = null;
let testUsername = null;

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(name, success, data = null) {
  const icon = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).substring(0, 200));
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 1. AUTHENTIFICATION
// ========================================
async function testAuthentication() {
  logSection('1. TEST AUTHENTIFICATION');
  
  // Signup
  try {
    testUsername = `test_user_${Date.now()}`;
    const signupData = {
      username: testUsername,
      email: `${testUsername}@test.com`,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const signupRes = await axios.post(`${API_BASE}/auth/signup`, signupData);
    authToken = signupRes.data.token;
    logTest('Inscription (Signup)', true, { username: testUsername, token: authToken?.substring(0, 20) + '...' });
  } catch (error) {
    logTest('Inscription (Signup)', false, error.response?.data);
    return false;
  }
  
  await sleep(500);
  
  // Login
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: `${testUsername}@test.com`,
      password: 'Test123456'
    });
    authToken = loginRes.data.token;
    logTest('Connexion (Login)', true, { token: authToken?.substring(0, 20) + '...' });
  } catch (error) {
    logTest('Connexion (Login)', false, error.response?.data);
  }
  
  await sleep(500);
  
  // Verify token
  try {
    const verifyRes = await axios.get(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Vérification Token', true, verifyRes.data.user);
  } catch (error) {
    logTest('Vérification Token', false, error.response?.data);
  }
  
  return true;
}

// ========================================
// 2. SERVICES MÉDICAUX
// ========================================
async function testServices() {
  logSection('2. TEST SERVICES MÉDICAUX');
  
  try {
    const res = await axios.get(`${API_BASE}/services`);
    const services = res.data.services || [];
    logTest(`Lister les services (${services.length} trouvés)`, true);
    
    if (services.length > 0) {
      console.log('\n   Exemples de services:');
      services.slice(0, 3).forEach(s => {
        console.log(`   - ${s.label || s.service} (${s.price || 'N/A'}€)`);
      });
    }
  } catch (error) {
    logTest('Lister les services', false, error.response?.data);
  }
}

// ========================================
// 3. PROGRAMMES DE SANTÉ
// ========================================
async function testHealthPrograms() {
  logSection('3. TEST PROGRAMMES DE SANTÉ');
  
  // Lister les programmes
  let programs = [];
  try {
    const res = await axios.get(`${API_BASE}/health-programs`);
    programs = res.data.programs || [];
    logTest(`Lister les programmes (${programs.length} trouvés)`, true);
    
    if (programs.length > 0) {
      console.log('\n   Exemples de programmes:');
      programs.slice(0, 3).forEach(p => {
        console.log(`   - ${p.label || p.program} (${p.duration || 'N/A'} jours)`);
      });
    }
  } catch (error) {
    logTest('Lister les programmes', false, error.response?.data);
  }
  
  await sleep(500);
  
  // Inscription à un programme
  if (programs.length > 0 && testUsername) {
    try {
      const programId = programs[0].program?.split('#')[1] || programs[0].id;
      const res = await axios.post(
        `${API_BASE}/health-programs/${programId}/enroll`,
        { username: testUsername }
      );
      logTest('Inscription à un programme', true, { program: programId });
    } catch (error) {
      logTest('Inscription à un programme', false, error.response?.data);
    }
  }
}

// ========================================
// 4. PAIEMENTS
// ========================================
async function testPayments() {
  logSection('4. TEST PAIEMENTS');
  
  // Créer un paiement
  try {
    const paymentData = {
      username: testUsername,
      serviceId: 'ConsultationCardiologie',
      amount: 80.00,
      paymentMethod: 'carte_bancaire'
    };
    
    const res = await axios.post(`${API_BASE}/payments`, paymentData);
    logTest('Créer un paiement', true, { amount: 80.00, status: res.data.payment?.status });
  } catch (error) {
    logTest('Créer un paiement', false, error.response?.data);
  }
  
  await sleep(500);
  
  // Historique des paiements
  try {
    const res = await axios.get(`${API_BASE}/payments/user/${testUsername}`);
    const payments = res.data.payments || [];
    logTest(`Historique paiements (${payments.length} trouvés)`, true);
  } catch (error) {
    logTest('Historique paiements', false, error.response?.data);
  }
  
  await sleep(500);
  
  // Statistiques
  try {
    const res = await axios.get(`${API_BASE}/payments/stats`);
    logTest('Statistiques paiements', true, res.data.stats);
  } catch (error) {
    logTest('Statistiques paiements', false, error.response?.data);
  }
}

// ========================================
// 5. RECOMMANDATIONS
// ========================================
async function testRecommendations() {
  logSection('5. TEST RECOMMANDATIONS');
  
  try {
    const res = await axios.get(`${API_BASE}/recommendations/${testUsername}`);
    const recommendations = res.data.recommendations || [];
    logTest(`Recommandations (${recommendations.length} trouvées)`, true);
    
    if (recommendations.length > 0) {
      console.log('\n   Exemples de recommandations:');
      recommendations.slice(0, 3).forEach(r => {
        console.log(`   - ${r.service} (Score: ${r.score})`);
      });
    }
  } catch (error) {
    logTest('Recommandations', false, error.response?.data);
  }
}

// ========================================
// 6. ASSISTANT MÉDICAL
// ========================================
async function testAssistant() {
  logSection('6. TEST ASSISTANT MÉDICAL');
  
  const questions = [
    "Quels sont les services médicaux disponibles ?",
    "Combien coûte une consultation en cardiologie ?",
    "Combien de patients sont enregistrés ?",
    "Statistiques des services"
  ];
  
  for (const question of questions) {
    try {
      const res = await axios.post(`${API_BASE}/assistant/ask`, { question });
      logTest(`Question: "${question}"`, true);
      console.log(`   Réponse: ${res.data.answer?.substring(0, 100)}...`);
      console.log(`   Catégorie: ${res.data.queryInfo?.category}`);
    } catch (error) {
      logTest(`Question: "${question}"`, false, error.response?.data);
    }
    await sleep(500);
  }
  
  // Exemples
  try {
    const res = await axios.get(`${API_BASE}/assistant/examples`);
    const examples = res.data.examples || [];
    logTest(`Exemples de questions (${examples.length} catégories)`, true);
  } catch (error) {
    logTest('Exemples de questions', false, error.response?.data);
  }
}

// ========================================
// 7. UTILISATEURS
// ========================================
async function testUsers() {
  logSection('7. TEST GESTION UTILISATEURS');
  
  try {
    const res = await axios.get(`${API_BASE}/users/${testUsername}`);
    logTest('Profil utilisateur', true, res.data.user);
  } catch (error) {
    logTest('Profil utilisateur', false, error.response?.data);
  }
}

// ========================================
// 8. ADMINISTRATION
// ========================================
async function testAdmin() {
  logSection('8. TEST ADMINISTRATION');
  
  // Liste des utilisateurs
  try {
    const res = await axios.get(`${API_BASE}/admin/users`);
    const users = res.data.users || [];
    logTest(`Liste utilisateurs (${users.length} trouvés)`, true);
  } catch (error) {
    logTest('Liste utilisateurs', false, error.response?.data);
  }
  
  await sleep(500);
  
  // Statistiques globales
  try {
    const res = await axios.get(`${API_BASE}/admin/stats`);
    logTest('Statistiques globales', true, res.data.stats);
  } catch (error) {
    logTest('Statistiques globales', false, error.response?.data);
  }
}

// ========================================
// EXÉCUTION PRINCIPALE
// ========================================
async function runAllTests() {
  log('\n🚀 DÉMARRAGE DES TESTS COMPLETS - SmartHealth', 'yellow');
  log('Backend: ' + API_BASE, 'blue');
  log('Date: ' + new Date().toLocaleString(), 'blue');
  
  try {
    await testAuthentication();
    await testServices();
    await testHealthPrograms();
    await testPayments();
    await testRecommendations();
    await testAssistant();
    await testUsers();
    await testAdmin();
    
    logSection('✨ TESTS TERMINÉS');
    log('Tous les tests ont été exécutés!', 'green');
    log('\n💡 Vérifiez les résultats ci-dessus pour voir ce qui fonctionne.', 'yellow');
    log('💡 Utilisateur de test créé: ' + testUsername, 'yellow');
    
  } catch (error) {
    log('\n❌ Erreur fatale lors des tests:', 'red');
    console.error(error.message);
  }
}

// Lancer les tests
runAllTests();
