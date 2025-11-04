require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// 🔹 Import des routes
const healthProgramRoutes = require("./routes/healthPrograms");
const paymentRoutes = require("./routes/payments");
const userRoutes = require("./routes/users");
const serviceRoutes = require("./routes/services");
const recommendationRoutes = require("./routes/recommendations");
const assistantRoutes = require("./routes/assistant");
const adminRoutes = require("./routes/admin");
const aiSparqlRoutes = require("./routes/aisparql");
const habitudeRoutes = require("./routes/habits");
const habitudeLogsRoutes = require("./routes/habitLogs");
const authRoutes = require("./routes/auth");
const saifAiRoutes = require('./routes/saif-ai-sparql');
const evenementRoutes = require("./routes/evenementRoutes");
const articleRoutes = require("./routes/articleRoutes"); 
const aiRoutes = require("./routes/ai-even"); 
const aiarticleRoutes = require("./routes/ai-articles"); 
const aienhancedRoutes = require("./routes/ai-enhanced"); 

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
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai-sparql", aiSparqlRoutes);
app.use("/api/evenements", evenementRoutes);
app.use("/api/articles", articleRoutes);
app.use("/ai", aiRoutes);
app.use("/aiarticle", aiarticleRoutes);
app.use("/aienhanced", aienhancedRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend API is running",
    endpoints: {
      auth: "/api/auth",
      healthPrograms: "/api/health-programs",
      aiSparql: "/api/ai-sparql"
    }
  })});
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
