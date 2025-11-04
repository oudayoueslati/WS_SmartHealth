const axios = require('axios');

const FUSEKI_URL = process.env.FUSEKI_URL || 'http://localhost:3030/SmartHealth';
const AUTH = Buffer.from('admin:admin123').toString('base64');

const testData = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix sh: <http://www.smarthealth-tracker.com/ontologie#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# ========================================
# SERVICES MÉDICAUX
# ========================================

sh:ConsultationCardiologie rdf:type sh:Consultation ;
    sh:label "Consultation Cardiologie" ;
    sh:description "Examen cardiologique complet avec ECG" ;
    sh:duration "30" ;
    sh:price "80.00" .

sh:ConsultationDermatologie rdf:type sh:Consultation ;
    sh:label "Consultation Dermatologie" ;
    sh:description "Consultation dermatologique" ;
    sh:duration "20" ;
    sh:price "60.00" .

sh:ConsultationPsychologie rdf:type sh:Consultation ;
    sh:label "Consultation Psychologie" ;
    sh:description "Séance de psychologie" ;
    sh:duration "45" ;
    sh:price "70.00" .

sh:ConsultationGeneraliste rdf:type sh:Consultation ;
    sh:label "Consultation Généraliste" ;
    sh:description "Consultation médicale générale" ;
    sh:duration "20" ;
    sh:price "50.00" .

sh:AnalyseSanguine rdf:type sh:Analyse ;
    sh:label "Analyse Sanguine Complète" ;
    sh:description "Bilan sanguin complet (NFS, glycémie, cholestérol)" ;
    sh:duration "15" ;
    sh:price "45.00" .

sh:AnalyseUrine rdf:type sh:Analyse ;
    sh:label "Analyse d'Urine" ;
    sh:description "Analyse d'urine standard" ;
    sh:duration "10" ;
    sh:price "25.00" .

sh:AnalyseHormonale rdf:type sh:Analyse ;
    sh:label "Analyse Hormonale" ;
    sh:description "Bilan hormonal complet" ;
    sh:duration "15" ;
    sh:price "65.00" .

sh:TeleconsultationGeneraliste rdf:type sh:Telemedecine ;
    sh:label "Téléconsultation Généraliste" ;
    sh:description "Consultation à distance avec un médecin généraliste" ;
    sh:duration "15" ;
    sh:price "35.00" .

sh:TeleconsultationPsychologie rdf:type sh:Telemedecine ;
    sh:label "Téléconsultation Psychologie" ;
    sh:description "Séance de psychologie en ligne" ;
    sh:duration "45" ;
    sh:price "65.00" .

sh:TeleconsultationNutrition rdf:type sh:Telemedecine ;
    sh:label "Téléconsultation Nutrition" ;
    sh:description "Conseil nutritionnel à distance" ;
    sh:duration "30" ;
    sh:price "40.00" .

# ========================================
# PROGRAMMES DE SANTÉ
# ========================================

sh:ProgrammeDiabete rdf:type sh:ProgrammeSante ;
    sh:label "Programme Diabète" ;
    sh:description "Suivi et gestion du diabète de type 2" ;
    sh:duration "90" ;
    sh:category "Chronique" ;
    sh:price "250.00" .

sh:ProgrammeCardiaque rdf:type sh:ProgrammeSante ;
    sh:label "Programme Cardiaque" ;
    sh:description "Prévention des maladies cardiovasculaires" ;
    sh:duration "120" ;
    sh:category "Prévention" ;
    sh:price "300.00" .

sh:ProgrammeNutrition rdf:type sh:ProgrammeSante ;
    sh:label "Programme Nutrition" ;
    sh:description "Rééquilibrage alimentaire et suivi nutritionnel" ;
    sh:duration "60" ;
    sh:category "Bien-être" ;
    sh:price "180.00" .

sh:ProgrammeStress rdf:type sh:ProgrammeSante ;
    sh:label "Programme Gestion du Stress" ;
    sh:description "Techniques de relaxation et gestion du stress" ;
    sh:duration "45" ;
    sh:category "Bien-être" ;
    sh:price "150.00" .

sh:ProgrammeActivitePhysique rdf:type sh:ProgrammeSante ;
    sh:label "Programme Activité Physique" ;
    sh:description "Programme d'exercices adaptés" ;
    sh:duration "90" ;
    sh:category "Prévention" ;
    sh:price "200.00" .

# ========================================
# PAIEMENTS DE TEST
# ========================================

sh:Payment_001 a sh:PaiementFacture ;
    sh:effectuéPar ex:john_doe ;
    sh:correspondÀ sh:ConsultationCardiologie ;
    sh:montant "80.00" ;
    sh:datePaiement "2025-10-15T10:00:00Z"^^xsd:dateTime ;
    sh:statusPaiement "PAID" ;
    sh:methodePaiement "carte_bancaire" .

sh:Payment_002 a sh:PaiementFacture ;
    sh:effectuéPar ex:john_doe ;
    sh:correspondÀ sh:AnalyseSanguine ;
    sh:montant "45.00" ;
    sh:datePaiement "2025-10-28T14:30:00Z"^^xsd:dateTime ;
    sh:statusPaiement "PAID" ;
    sh:methodePaiement "carte_bancaire" .

sh:Payment_003 a sh:PaiementFacture ;
    sh:effectuéPar ex:john_doe ;
    sh:correspondÀ sh:TeleconsultationGeneraliste ;
    sh:montant "35.00" ;
    sh:datePaiement "2025-11-01T09:15:00Z"^^xsd:dateTime ;
    sh:statusPaiement "PENDING" ;
    sh:methodePaiement "especes" .

sh:Payment_004 a sh:PaiementFacture ;
    sh:effectuéPar ex:john_doe ;
    sh:correspondÀ sh:AnalyseSanguine ;
    sh:montant "45.00" ;
    sh:datePaiement "2025-11-02T11:20:00Z"^^xsd:dateTime ;
    sh:statusPaiement "PAID" ;
    sh:methodePaiement "carte_bancaire" .

sh:Payment_005 a sh:PaiementFacture ;
    sh:effectuéPar ex:john_doe ;
    sh:correspondÀ sh:ConsultationCardiologie ;
    sh:montant "80.00" ;
    sh:datePaiement "2025-11-03T15:45:00Z"^^xsd:dateTime ;
    sh:statusPaiement "PAID" ;
    sh:methodePaiement "carte_bancaire" .
`;

async function insertTestData() {
  console.log('🚀 Insertion des données de test dans Fuseki...\n');
  
  try {
    const response = await axios.post(
      `${FUSEKI_URL}/data`,
      testData,
      {
        headers: {
          'Authorization': `Basic ${AUTH}`,
          'Content-Type': 'text/turtle'
        }
      }
    );
    
    console.log('✅ Données insérées avec succès!\n');
    console.log('📊 Données insérées:');
    console.log('   - 10 Services médicaux (Consultations, Analyses, Télémédecine)');
    console.log('   - 5 Programmes de santé');
    console.log('   - 5 Paiements de test pour john_doe\n');
    
    // Vérification
    console.log('🔍 Vérification des données...\n');
    await verifyData();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

async function verifyData() {
  const queries = [
    {
      name: 'Services',
      query: `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
        SELECT (COUNT(?service) as ?count) WHERE {
          ?service rdf:type ?type .
          FILTER(?type = sh:Consultation || ?type = sh:Analyse || ?type = sh:Telemedecine)
        }
      `
    },
    {
      name: 'Programmes',
      query: `
        PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
        SELECT (COUNT(?program) as ?count) WHERE {
          ?program a sh:ProgrammeSante .
        }
      `
    },
    {
      name: 'Paiements',
      query: `
        PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
        SELECT (COUNT(?payment) as ?count) WHERE {
          ?payment a sh:PaiementFacture .
        }
      `
    },
    {
      name: 'Utilisateurs',
      query: `
        PREFIX ex: <http://example.org/>
        SELECT (COUNT(?user) as ?count) WHERE {
          ?user a ex:User .
        }
      `
    }
  ];
  
  for (const q of queries) {
    try {
      const response = await axios.get(`${FUSEKI_URL}/query`, {
        params: { query: q.query },
        headers: { 
          'Authorization': `Basic ${AUTH}`,
          'Accept': 'application/sparql-results+json' 
        }
      });
      
      const count = response.data.results.bindings[0]?.count?.value || 0;
      console.log(`   ✓ ${q.name}: ${count}`);
    } catch (error) {
      console.error(`   ✗ ${q.name}: Erreur`);
    }
  }
  
  console.log('\n✨ Insertion terminée!');
  console.log('\n💡 Vous pouvez maintenant:');
  console.log('   1. Tester l\'assistant: http://localhost:3000/admin/assistant');
  console.log('   2. Voir les services: http://localhost:3000/admin/services');
  console.log('   3. Voir les paiements: http://localhost:3000/admin/payments');
  console.log('   4. Créer un compte et tester toutes les fonctionnalités!\n');
}

// Exécuter
insertTestData();
