const express = require('express');
const axios = require('axios');
const router = express.Router();

const FUSEKI_ENDPOINT = 'http://localhost:3030/SmartHealth';

// Exécuter une requête SPARQL SELECT
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: {
        query: query
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('SPARQL Query Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de l\'exécution de la requête SPARQL',
      details: error.response?.data || error.message 
    });
  }
});

// Exécuter une requête SPARQL UPDATE (INSERT, DELETE, UPDATE)
router.post('/update', async (req, res) => {
  try {
    const { query } = req.body;
    
    const response = await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: {
        'Content-Type': 'application/sparql-update'
      }
    });

    res.json({ success: true, message: 'Update executed successfully' });
  } catch (error) {
    console.error('SPARQL Update Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de l\'exécution de la mise à jour SPARQL',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;