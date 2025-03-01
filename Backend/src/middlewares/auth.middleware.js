const jwt = require("jsonwebtoken");
const { createError } = require("../utils/logger");
const { User } = require("../models");

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        createError(401, "You are not logged in. Please log in to get access.")
      );
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(
        createError(401, "The user belonging to this token no longer exists.")
      );
    }

    // 4) Check if user is active
    if (currentUser.status !== "active") {
      return next(
        createError(
          401,
          "This user account has been deactivated. Please contact an administrator."
        )
      );
    }

    // 5) GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    next(createError(401, "Invalid token. Please log in again."));
  }
};

// Middleware to restrict access to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array of allowed roles, e.g. ['admin', 'analyst']
    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, "You do not have permission to perform this action")
      );
    }
    next();
  };
};
