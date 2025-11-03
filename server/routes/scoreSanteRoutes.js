const express = require('express');
const axios = require('axios');
const router = express.Router();

const FUSEKI_ENDPOINT = 'http://localhost:3030/SmartHealth';

// GET all scores santé
router.get('/', async (req, res) => {
  try {
    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>

      SELECT ?score ?activite ?globale ?nutrition ?sommeil
      WHERE {
        ?score a sh:ScoreSanté .
        ?score sh:scoreActivite ?activite .
        ?score sh:scoreGlobale ?globale .
        ?score sh:scoreNutrition ?nutrition .
        ?score sh:scoreSommeil ?sommeil .
      }
      ORDER BY DESC(?score)
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

// CREATE new score santé
router.post('/', async (req, res) => {
  try {
    const { scoreActivite, scoreGlobale, scoreNutrition, scoreSommeil } = req.body;
    const scoreId = `score_${Date.now()}`;

    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      INSERT DATA {
        sh:${scoreId} a sh:ScoreSanté ;
                   sh:scoreActivite "${scoreActivite}"^^xsd:integer ;
                   sh:scoreGlobale "${scoreGlobale}"^^xsd:integer ;
                   sh:scoreNutrition "${scoreNutrition}"^^xsd:integer ;
                   sh:scoreSommeil "${scoreSommeil}"^^xsd:integer .
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { 'Content-Type': 'application/sparql-update' }
    });

    res.json({ success: true, message: 'Score santé créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE score santé
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scoreActivite, scoreGlobale, scoreNutrition, scoreSommeil } = req.body;

    const query = `
      PREFIX sh: <http://www.smarthealth-tracker.com/ontologie#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      DELETE {
        ?score sh:scoreActivite ?oldActivite ;
               sh:scoreGlobale ?oldGlobale ;
               sh:scoreNutrition ?oldNutrition ;
               sh:scoreSommeil ?oldSommeil .
      }
      INSERT {
        ?score sh:scoreActivite "${scoreActivite}"^^xsd:integer ;
               sh:scoreGlobale "${scoreGlobale}"^^xsd:integer ;
               sh:scoreNutrition "${scoreNutrition}"^^xsd:integer ;
               sh:scoreSommeil "${scoreSommeil}"^^xsd:integer .
      }
      WHERE {
        ?score a sh:ScoreSanté .
        ?score sh:scoreActivite ?oldActivite ;
               sh:scoreGlobale ?oldGlobale ;
               sh:scoreNutrition ?oldNutrition ;
               sh:scoreSommeil ?oldSommeil .
        FILTER(?score = <http://www.smarthealth-tracker.com/ontologie#${id}>)
      }
    `;

    await axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
      headers: { 'Content-Type': 'application/sparql-update' }
    });

    res.json({ success: true, message: 'Score santé modifié avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE score santé
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

    res.json({ success: true, message: 'Score santé supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;