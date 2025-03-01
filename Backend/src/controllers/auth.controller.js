const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { createError, logger } = require("../utils/logger");

// Create JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
};

// Function to create and send JWT token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(createError(400, "Email already in use"));
    }

    // Only allow admin role to be set by another admin
    let userRole = "user";
    if (role && req.user && req.user.role === "admin") {
      userRole = role;
    }

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: userRole,
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    logger.error("Registration error:", error);
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(createError(400, "Please provide email and password"));
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Check if user exists and password is correct
    if (!user || !(await user.validatePassword(password))) {
      return next(createError(401, "Incorrect email or password"));
    }

    // Check if user is active
    if (user.status !== "active") {
      return next(
        createError(
          401,
          "Your account has been deactivated. Please contact an administrator."
        )
      );
    }

    // Update last login time
    await user.update({ lastLogin: new Date() });

    // Send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    logger.error("Login error:", error);
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Check if both passwords are provided
    if (!currentPassword || !newPassword) {
      return next(createError(400, "Please provide current and new password"));
    }

    // Get user from database (with password)
    const user = await User.findByPk(req.user.id);

    // Check if current password matches
    if (!(await user.validatePassword(currentPassword))) {
      return next(createError(401, "Your current password is incorrect"));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send new token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
