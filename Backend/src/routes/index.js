const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const dashboardRoutes = require("./dashboard.routes");
const datasourceRoutes = require("./datasource.routes");
const insightRoutes = require("./insight.routes");
const settingsRoutes = require("./settings.routes");

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Register routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/datasources", datasourceRoutes);
router.use("/insights", insightRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
