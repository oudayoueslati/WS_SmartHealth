const express = require('express');
const axios = require('axios');
const router = express.Router();

const FUSEKI_ENDPOINT = 'http://localhost:3030/SmartHealth';

// GET all mesures
router.get('/', async (req, res) => {
  try {
    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

      SELECT ?mesure ?imc ?calories ?mesureValue
      WHERE {
        ?mesure a sh:Mesure .
        OPTIONAL { ?mesure sh:aValeurIMC ?imc }
        OPTIONAL { ?mesure sh:aCaloriesConsommées ?calories }
        OPTIONAL { ?mesure sh:aMesure ?mesureValue }
      }
      ORDER BY DESC(?mesure)
    `;

    const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { 'Accept': 'application/json' }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new mesure
router.post('/', async (req, res) => {
  try {
    const { valeurIMC, caloriesConsommees, mesureValue } = req.body;
    const mesureId = `mesure_${Date.now()}`;

    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      INSERT DATA {
        sh:${mesureId} a sh:Mesure ;
                   sh:aValeurIMC "${valeurIMC}"^^xsd:decimal ;
                   sh:aCaloriesConsommées "${caloriesConsommees}"^^xsd:integer ;
                   sh:aMesure "${mesureValue}"^^xsd:integer .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { 'Content-Type': 'application/sparql-update' }
    });

    res.json({ success: true, message: 'Mesure créée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE mesure
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valeurIMC, caloriesConsommees, mesureValue } = req.body;

    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      DELETE {
        ?mesure sh:aValeurIMC ?oldImc ;
                sh:aCaloriesConsommées ?oldCalories ;
                sh:aMesure ?oldMesure .
      }
      INSERT {
        ?mesure sh:aValeurIMC "${valeurIMC}"^^xsd:decimal ;
                sh:aCaloriesConsommées "${caloriesConsommees}"^^xsd:integer ;
                sh:aMesure "${mesureValue}"^^xsd:integer .
      }
      WHERE {
        ?mesure a sh:Mesure .
        OPTIONAL { ?mesure sh:aValeurIMC ?oldImc }
        OPTIONAL { ?mesure sh:aCaloriesConsommées ?oldCalories }
        OPTIONAL { ?mesure sh:aMesure ?oldMesure }
        FILTER(?mesure = <http://www.smarthealth-tracker.com/ontologie#${id}>)
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { 'Content-Type': 'application/sparql-update' }
    });

    res.json({ success: true, message: 'Mesure modifiée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE mesure
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

      DELETE WHERE {
        <http://www.smarthealth-tracker.com/ontologie#${id}> ?p ?o .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { 'Content-Type': 'application/sparql-update' }
    });

    res.json({ success: true, message: 'Mesure supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;