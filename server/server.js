require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const healthProgramRoutes = require("./routes/healthPrograms");
const evenementRoutes = require("./routes/evenementRoutes"); 
const articleRoutes = require("./routes/articleRoutes"); 

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/health-programs", healthProgramRoutes);
app.use("/api/evenements", evenementRoutes);
app.use("/api/articles", articleRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running ✅" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at: http://localhost:${PORT}`)
);
