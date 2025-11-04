require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const mesureRoutes = require('./routes/mesureRoutes');
const scoreSanteRoutes = require('./routes/scoreSanteRoutes');
const sparqlRoutes = require('./routes/sparqlRoutes');
const etatSanteRoutes = require("./routes/etatSanteRoutes");
const objectifRoutes = require("./routes/objectifRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/mesures', mesureRoutes);
app.use('/api/scores-sante', scoreSanteRoutes);
app.use('/api/sparql', sparqlRoutes);
app.use("/api/etat-sante", etatSanteRoutes);
app.use("/api/objectifs", objectifRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend SmartHealth is running!' });
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));