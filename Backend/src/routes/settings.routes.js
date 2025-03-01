const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// Only admin and analyst can view/modify settings
router.use(restrictTo("admin", "analyst"));

// Get all settings
router.get("/", settingsController.getAllSettings);

// Test connection for integration settings
router.post("/:category/test-connection", settingsController.testConnection);

// Get and update settings by category
router
  .route("/:category")
  .get(settingsController.getSettingsByCategory)
  .put(settingsController.updateSettings);

module.exports = router;
