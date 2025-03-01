const express = require("express");
const router = express.Router();
const insightController = require("../controllers/insight.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// Generate AI insight
router.post("/generate", insightController.generateInsight);

// Get visualization data
router.get("/:id/data", insightController.getVisualizationData);

// Standard CRUD routes
router
  .route("/")
  .get(insightController.getAllInsights)
  .post(restrictTo("admin", "analyst"), insightController.createInsight);

router
  .route("/:id")
  .get(insightController.getInsight)
  .patch(insightController.updateInsight)
  .delete(insightController.deleteInsight);

module.exports = router;
