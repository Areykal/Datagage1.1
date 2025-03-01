const { Sequelize } = require("sequelize");
const { logger } = require("../utils/logger");

// Create Sequelize instance from environment variables
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "datagage_db",
  username: process.env.DB_USER || "datagage_user",
  password: process.env.DB_PASSWORD || "datagageuser",
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
