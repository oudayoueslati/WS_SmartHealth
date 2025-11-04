require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const healthProgramRoutes = require("./routes/healthPrograms");
const paymentRoutes = require("./routes/payments");
const userRoutes = require("./routes/users");
const serviceRoutes = require("./routes/services");
const recommendationRoutes = require("./routes/recommendations");
const assistantRoutes = require("./routes/assistant");
const adminRoutes = require("./routes/admin");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/health-programs", healthProgramRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));