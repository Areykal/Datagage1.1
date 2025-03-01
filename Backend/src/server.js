const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const db = require("./config/database");
const { logger } = require("./utils/logger");
const routes = require("./routes");
const seedDatabase = require("./utils/seedDatabase");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Database connection and sync
    await db.authenticate();
    logger.info("Database connection established successfully");

    // Sync database models
    await db.sync({ alter: process.env.NODE_ENV === "development" });
    logger.info("Database models synchronized");

    // Seed database with initial data if in development mode
    if (process.env.NODE_ENV === "development") {
      await seedDatabase();
    }

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

module.exports = app; // Export for testing
