require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const healthProgramRoutes = require("./routes/healthPrograms");
const aiSparqlRoutes = require("./routes/aisparql");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/health-programs", healthProgramRoutes);
app.use("/api/ai-sparql", aiSparqlRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend API is running",
    endpoints: {
      auth: "/api/auth",
      healthPrograms: "/api/health-programs",
      aiSparql: "/api/ai-sparql"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));