const { User } = require("../models");
const { createError } = require("../utils/logger");

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific user
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user (admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(createError(400, "Email already in use"));
    }

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      status,
    });

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a user
exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, role, status } = req.body;

    // Find user
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Update user details
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      role: role || user.role,
      status: status || user.status,
    });

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Don't allow self-deletion
    if (user.id === req.user.id) {
      return next(createError(400, "You cannot delete your own account"));
    }

    await user.destroy();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
