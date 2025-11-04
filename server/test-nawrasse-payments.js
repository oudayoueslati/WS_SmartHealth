const axios = require('axios');

const paiements = [
  { service: 'AnalyseSanguine', montant: 45.00, modePaiement: 'Carte', status: 'PAID' },
  { service: 'TeleconsultationGeneraliste', montant: 35.00, modePaiement: 'Especes', status: 'PAID' },
  { service: 'ConsultationDermatologie', montant: 60.00, modePaiement: 'Carte', status: 'PENDING' }
];

async function createPayments() {
  console.log('🔄 CRÉATION DE PAIEMENTS POUR NAWRASSE\n');
  
  for (let i = 0; i < paiements.length; i++) {
    const p = paiements[i];
    try {
      const response = await axios.post('http://localhost:5000/api/payments', {
        user: 'nawrasse_elbenna',
        ...p
      });
      console.log(`   ${i+1}. ✅ ${p.service}: ${p.montant}€ (${p.status})`);
    } catch (err) {
      console.error(`   ${i+1}. ❌ Erreur:`, err.message);
    }
  }
  
  console.log('\n📊 RÉCAPITULATIF FINAL:');
  
  // Liste des paiements
  const listResponse = await axios.get('http://localhost:5000/api/payments?user=nawrasse_elbenna');
  console.log('   Total paiements:', listResponse.data.payments.length);
  
  // Statistiques
  const statsResponse = await axios.get('http://localhost:5000/api/payments/stats/nawrasse_elbenna');
  console.log('   Montant total:', statsResponse.data.stats.totalMontant.toFixed(2) + '€');
  console.log('   Montant moyen:', statsResponse.data.stats.avgMontant.toFixed(2) + '€');
  
  console.log('\n📋 LISTE DES PAIEMENTS:');
  listResponse.data.payments.forEach(p => {
    console.log(`   - ${p.id} | ${p.montant}€ | ${p.status}`);
  });
  
  console.log('\n✅ TERMINÉ!');
}

createPayments().catch(e => console.error('❌ Erreur:', e.message));
