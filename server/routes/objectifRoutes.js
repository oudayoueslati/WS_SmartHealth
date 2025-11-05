const express = require("express");
const axios = require("axios");

const router = express.Router();

const FUSEKI_ENDPOINT =
  process.env.FUSEKI_ENDPOINT || "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";
const ALLOWED_CLASSES = ["ObjectifQualitatif", "ObjectifQuantitatif"];

const escapeLiteral = (value = "") =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const validateObjectif = (payload = {}) => {
  const errors = [];
  const {
    type,
    description,
    dateDebut,
    dateFin,
    etat,
    classeRdf = "ObjectifQualitatif",
  } = payload;

  if (!type || !type.trim()) errors.push("Le type est requis.");
  if (!description || !description.trim()) errors.push("La description est requise.");
  if (description && description.trim().length < 10) {
    errors.push("La description doit contenir au moins 10 caractères.");
  }

  const start = dateDebut ? new Date(dateDebut) : null;
  const end = dateFin ? new Date(dateFin) : null;

  if (!start || Number.isNaN(start.getTime())) {
    errors.push("La date de début est invalide.");
  }
  if (!end || Number.isNaN(end.getTime())) {
    errors.push("La date de fin est invalide.");
  }
  if (start && end && end < start) {
    errors.push("La date de fin doit être postérieure à la date de début.");
  }

  if (!etat || !etat.trim()) errors.push("L'état est requis.");

  if (classeRdf && !ALLOWED_CLASSES.includes(classeRdf)) {
    errors.push("La classe d'objectif est invalide.");
  }

  return { isValid: errors.length === 0, errors };
};

const runSelect = async (query) =>
  axios
    .post(`${FUSEKI_ENDPOINT}/query`, null, {
      params: { query },
      headers: { Accept: "application/sparql-results+json" },
    })
    .then((response) => response.data?.results?.bindings || []);

const runUpdate = async (query) =>
  axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
    headers: { "Content-Type": "application/sparql-update" },
  });

/* ========= GET : liste des objectifs ========= */
router.get("/", async (_req, res) => {
  try {
    const query = `
      PREFIX sh:   <${PREFIX}>
      PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?objectif ?classe ?type ?description ?dateDebut ?dateFin ?etat
      WHERE {
        ?objectif a ?classe .
        FILTER(?classe IN (sh:ObjectifQualitatif, sh:ObjectifQuantitatif, sh:Objectif))

        {
          SELECT ?objectif (MAX(?d) AS ?lastDebut)
          WHERE { ?objectif sh:aDateDebut ?d }
          GROUP BY ?objectif
        }

        ?objectif sh:aDateDebut ?lastDebut ;
                  sh:aType ?type ;
                  sh:aDescription ?description ;
                  sh:aDateFin ?dateFin ;
                  sh:aEtat ?etat .

        BIND(?lastDebut AS ?dateDebut)
      }
      ORDER BY DESC(?dateDebut)
    `;

    const bindings = await runSelect(query);
    res.json(bindings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== CREATE ================== */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    const {
      type,
      description,
      dateDebut,
      dateFin,
      etat,
      classeRdf = "ObjectifQualitatif",
    } = payload;

    const validation = validateObjectif({
      type,
      description,
      dateDebut,
      dateFin,
      etat,
      classeRdf,
    });

    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const id = `objectif_${Date.now()}`;
    const query = `
      PREFIX sh:  <${PREFIX}>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      INSERT DATA {
        sh:${id} a sh:${classeRdf} , sh:Objectif ;
                 sh:aType "${escapeLiteral(type.trim())}"^^xsd:string ;
                 sh:aDescription "${escapeLiteral(description.trim())}"^^xsd:string ;
                 sh:aDateDebut "${new Date(dateDebut).toISOString()}"^^xsd:dateTime ;
                 sh:aDateFin "${new Date(dateFin).toISOString()}"^^xsd:dateTime ;
                 sh:aEtat "${escapeLiteral(etat.trim())}"^^xsd:string .
      }
    `;

    await runUpdate(query);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================== UPDATE ===================== */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      description,
      dateDebut,
      dateFin,
      etat,
      classeRdf = "ObjectifQualitatif",
    } = req.body;

    const validation = validateObjectif({
      type,
      description,
      dateDebut,
      dateFin,
      etat,
      classeRdf,
    });

    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const query = `
      PREFIX sh:  <${PREFIX}>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      DELETE {
        <${PREFIX}${id}> sh:aType ?oldType ;
                         sh:aDescription ?oldDesc ;
                         sh:aDateDebut ?oldDebut ;
                         sh:aDateFin ?oldFin ;
                         sh:aEtat ?oldEtat ;
                         a ?oldClass .
      }
      INSERT {
        <${PREFIX}${id}> sh:aType "${escapeLiteral(type.trim())}"^^xsd:string ;
                         sh:aDescription "${escapeLiteral(description.trim())}"^^xsd:string ;
                         sh:aDateDebut "${new Date(dateDebut).toISOString()}"^^xsd:dateTime ;
                         sh:aDateFin "${new Date(dateFin).toISOString()}"^^xsd:dateTime ;
                         sh:aEtat "${escapeLiteral(etat.trim())}"^^xsd:string ;
                         a sh:${classeRdf} , sh:Objectif .
      }
      WHERE {
        <${PREFIX}${id}> a ?oldClass .
        FILTER(?oldClass != sh:Objectif)
        OPTIONAL { <${PREFIX}${id}> sh:aType ?oldType }
        OPTIONAL { <${PREFIX}${id}> sh:aDescription ?oldDesc }
        OPTIONAL { <${PREFIX}${id}> sh:aDateDebut ?oldDebut }
        OPTIONAL { <${PREFIX}${id}> sh:aDateFin ?oldFin }
        OPTIONAL { <${PREFIX}${id}> sh:aEtat ?oldEtat }
      }
    `;

    await runUpdate(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================== DELETE ===================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      PREFIX sh: <${PREFIX}>
      DELETE WHERE { <${PREFIX}${id}> ?p ?o . }
    `;
    await runUpdate(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
