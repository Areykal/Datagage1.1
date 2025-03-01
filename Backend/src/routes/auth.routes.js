const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// Public routes
router.post("/login", authController.login);

// Protected routes
router.use(protect);
router.get("/me", authController.getMe);
router.patch("/update-password", authController.updatePassword);

// Admin-only routes
router.post("/register", restrictTo("admin"), authController.register);

module.exports = router;
