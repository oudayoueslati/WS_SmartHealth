const axios = require('axios');

const FUSEKI_URL = 'http://localhost:3030';
const DATASET_NAME = 'SmartHealth';
const AUTH = Buffer.from('admin:admin123').toString('base64');

async function createDataset() {
  try {
    const params = new URLSearchParams();
    params.append('dbType', 'tdb2');
    params.append('dbName', DATASET_NAME);
    
    const response = await axios.post(
      `${FUSEKI_URL}/$/datasets`,
      params.toString(),
      {
        headers: {
          'Authorization': `Basic ${AUTH}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log(`✅ Dataset '${DATASET_NAME}' créé avec succès!`);
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log(`ℹ️  Dataset '${DATASET_NAME}' existe déjà`);
    } else {
      console.error('❌ Erreur:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  }
}

createDataset();
