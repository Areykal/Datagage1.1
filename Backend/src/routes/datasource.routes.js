const express = require("express");
const router = express.Router();
const datasourceController = require("../controllers/datasource.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// Test connection route (no modifications to database)
router.post("/test", datasourceController.testConnection);

// Standard CRUD routes
router
  .route("/")
  .get(datasourceController.getAllDataSources)
  .post(restrictTo("admin", "analyst"), datasourceController.createDataSource);

router
  .route("/:id")
  .get(datasourceController.getDataSource)
  .patch(restrictTo("admin", "analyst"), datasourceController.updateDataSource)
  .delete(restrictTo("admin"), datasourceController.deleteDataSource);

module.exports = router;
