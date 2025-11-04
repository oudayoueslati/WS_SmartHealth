require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// 🔹 Import des routes
const healthProgramRoutes = require("./routes/healthPrograms");
const habitudeRoutes = require("./routes/habits");
const habitudeLogsRoutes = require("./routes/habitLogs");
const authRoutes = require("./routes/auth");
const saifAiRoutes = require('./routes/saif-ai-sparql');

// Exemple de connexion
const login = (userData) => {
  localStorage.setItem("currentUser", JSON.stringify(userData));
};

// Exemple de déconnexion
const logout = () => {
  localStorage.removeItem("currentUser");
};


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes principales
app.use("/api/auth", authRoutes);
app.use("/api/health-programs", healthProgramRoutes);
app.use("/api/habitudes", habitudeRoutes);
app.use("/api/habitude-logs", habitudeLogsRoutes);
app.use('/api/saif-ai', saifAiRoutes); // ✅ Cette ligne est cruciale
// Route de test
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "✅ Backend API is running",
    saifAI: "🟢 Route Saif AI disponible",
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "GET /api/saif-ai/statut",
      "POST /api/saif-ai/comprendre",
      "POST /api/saif-ai/executer",
      "POST /api/saif-ai/apprendre"
    ]
  });
});


// Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ Backend API is running" });
});

// Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
