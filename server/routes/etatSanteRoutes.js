const express = require("express");
const axios = require("axios");

const router = express.Router();

const FUSEKI_ENDPOINT =
  process.env.FUSEKI_ENDPOINT || "http://localhost:3030/SmartHealth";
const PREFIX = "http://www.smarthealth-tracker.com/ontologie#";

// Sous-classes autorisées pour éviter l'injection
const ALLOWED_CLASSES = [
  "Allergie",
  "ConditionMedicale",
  "TraitementMedicale",
];

const escapeLiteral = (value = "") =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const validateEtatSante = (payload = {}) => {
  const errors = [];
  const poids = Number.parseFloat(payload.poids);
  const taille = Number.parseFloat(payload.taille);
  const temperature = Number.parseFloat(payload.temperature);
  const pression = typeof payload.pression === "string" ? payload.pression : "";
  const date = payload.date ? new Date(payload.date) : null;

  if (!Number.isFinite(poids) || poids <= 0 || poids > 500) {
    errors.push("Le poids doit être un nombre positif raisonnable (0-500kg).");
  }

  if (!Number.isFinite(taille) || taille <= 0 || taille > 3) {
    errors.push("La taille doit être comprise entre 0m et 3m.");
  }

  if (!/^\d{2,3}\/\d{2,3}$/.test(pression)) {
    errors.push("La pression sanguine doit suivre le format 120/80.");
  }

  if (!Number.isFinite(temperature) || temperature < 30 || temperature > 45) {
    errors.push("La température doit être comprise entre 30°C et 45°C.");
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    errors.push("La date doit être un format ISO valide.");
  }

  return { isValid: errors.length === 0, errors };
};

const runSelect = async (query) => {
  const response = await axios.post(`${FUSEKI_ENDPOINT}/query`, null, {
    params: { query },
    headers: { Accept: "application/sparql-results+json" },
  });

  return response.data?.results?.bindings || [];
};

const runUpdate = async (query) =>
  axios.post(`${FUSEKI_ENDPOINT}/update`, query, {
    headers: { "Content-Type": "application/sparql-update" },
  });

const mapBindingsToEtat = (bindings = []) =>
  bindings.map((binding) => ({
    id: binding.etat?.value?.replace(PREFIX, "") || "",
    classe:
      binding.classe?.value?.replace(PREFIX, "") || "EtatSante", // Allergie / ConditionMedicale / TraitementMedicale
    poids: Number.parseFloat(binding.poids?.value) || 0,
    taille: Number.parseFloat(binding.taille?.value) || 0,
    pression: binding.pression?.value || "",
    temperature: Number.parseFloat(binding.temperature?.value) || 0,
    date: binding.date?.value || null,
  }));

/* ================== GET : liste des états ================== */
router.get("/", async (_req, res) => {
  try {
    const query = `
      PREFIX sh: <${PREFIX}>
      SELECT ?etat ?classe ?poids ?taille ?pression ?temperature ?date
      WHERE {
        ?etat a sh:EtatSante ;
              sh:aPoids ?poids ;
              sh:aTaille ?taille ;
              sh:aPression ?pression ;
              sh:aTemperature ?temperature ;
              sh:aDate ?date .

        OPTIONAL {
          ?etat a ?classe .
          FILTER(?classe IN (sh:Allergie, sh:ConditionMedicale, sh:TraitementMedicale))
        }
      }
      ORDER BY DESC(?date)
    `;

    const bindings = await runSelect(query);
    res.json(mapBindingsToEtat(bindings));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/", async (req, res) => {
  const validation = validateEtatSante(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  try {
    const { poids, taille, pression, temperature, date } = req.body;

    // sécuriser la classe (si invalide → ConditionMedicale par défaut)
    const classeRdfRaw = req.body.classeRdf;
    const classeRdf = ALLOWED_CLASSES.includes(classeRdfRaw)
      ? classeRdfRaw
      : "ConditionMedicale";

    const id = `etatSante_${Date.now()}`;

    const query = `
      PREFIX sh: <${PREFIX}>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      INSERT DATA {
        sh:${id} a sh:EtatSante , sh:${classeRdf} ;
                 sh:aPoids "${Number.parseFloat(poids)}"^^xsd:decimal ;
                 sh:aTaille "${Number.parseFloat(taille)}"^^xsd:decimal ;
                 sh:aPression "${escapeLiteral(pression)}"^^xsd:string ;
                 sh:aTemperature "${Number.parseFloat(temperature)}"^^xsd:decimal ;
                 sh:aDate "${new Date(date).toISOString()}"^^xsd:dateTime .
      }
    `;

    await runUpdate(query);
    res.status(201).json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================== PUT : mise à jour ================== */
/*
  On permet aussi de changer la catégorie (classeRdf) si elle est fournie.
*/
router.put("/:id", async (req, res) => {
  const validation = validateEtatSante(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { id } = req.params;

  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }

  try {
    const { poids, taille, pression, temperature, date } = req.body;

    const classeRdfRaw = req.body.classeRdf;
    const classeRdf = ALLOWED_CLASSES.includes(classeRdfRaw)
      ? classeRdfRaw
      : null; // si null, on ne touche pas aux types spéciaux

    // On supprime les anciennes valeurs + éventuellement l’ancienne sous-classe,
    // puis on réinsère les nouvelles valeurs (et éventuellement la nouvelle sous-classe).
    const query = `
      PREFIX sh: <${PREFIX}>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      DELETE {
        ?etat sh:aPoids ?oldPoids ;
              sh:aTaille ?oldTaille ;
              sh:aPression ?oldPression ;
              sh:aTemperature ?oldTemp ;
              sh:aDate ?oldDate .
        ${
          classeRdf
            ? `
        ?etat a ?oldClass .`
            : ""
        }
      }
      INSERT {
        ?etat sh:aPoids "${Number.parseFloat(poids)}"^^xsd:decimal ;
              sh:aTaille "${Number.parseFloat(taille)}"^^xsd:decimal ;
              sh:aPression "${escapeLiteral(pression)}"^^xsd:string ;
              sh:aTemperature "${Number.parseFloat(temperature)}"^^xsd:decimal ;
              sh:aDate "${new Date(date).toISOString()}"^^xsd:dateTime .
        ${
          classeRdf
            ? `
        ?etat a sh:EtatSante , sh:${classeRdf} .`
            : ""
        }
      }
      WHERE {
        BIND(<${PREFIX}${id}> AS ?etat)
        OPTIONAL { ?etat sh:aPoids ?oldPoids }
        OPTIONAL { ?etat sh:aTaille ?oldTaille }
        OPTIONAL { ?etat sh:aPression ?oldPression }
        OPTIONAL { ?etat sh:aTemperature ?oldTemp }
        OPTIONAL { ?etat sh:aDate ?oldDate }
        ${
          classeRdf
            ? `
        OPTIONAL { 
          ?etat a ?oldClass .
          FILTER(?oldClass IN (sh:Allergie, sh:ConditionMedicale, sh:TraitementMedicale))
        }`
            : ""
        }
      }
    `;

    await runUpdate(query);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================== DELETE ================== */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }

  try {
    const query = `
      PREFIX sh: <${PREFIX}>
      DELETE WHERE {
        <${PREFIX}${id}> ?p ?o .
      }
    `;

    await runUpdate(query);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
