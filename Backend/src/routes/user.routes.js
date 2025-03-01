const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// Admin-only routes
router
  .route("/")
  .get(restrictTo("admin"), userController.getAllUsers)
  .post(restrictTo("admin"), userController.createUser);

router
  .route("/:id")
  .get(restrictTo("admin"), userController.getUser)
  .patch(restrictTo("admin"), userController.updateUser)
  .delete(restrictTo("admin"), userController.deleteUser);

module.exports = router;
