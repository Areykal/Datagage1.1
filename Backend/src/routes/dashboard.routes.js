const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { protect } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// Dashboard summary and metrics routes
router.get("/summary", dashboardController.getSummary);
router.get("/activities", dashboardController.getRecentActivities);
router.get("/metrics", dashboardController.getKeyMetrics);

module.exports = router;
