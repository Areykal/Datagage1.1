const { DataSource } = require("../models");
const { createError, logger } = require("../utils/logger");
const { testConnection } = require("../services/database.service");
const {
  createAirbyteSource,
  updateAirbyteSource,
  deleteAirbyteSource,
} = require("../services/airbyte.service");
const {
  createMetabaseDatabase,
  updateMetabaseDatabase,
  deleteMetabaseDatabase,
} = require("../services/metabase.service");

// Get all data sources
exports.getAllDataSources = async (req, res, next) => {
  try {
    const dataSources = await DataSource.findAll({
      attributes: { exclude: ["password"] }, // Don't send passwords
    });

    res.status(200).json({
      status: "success",
      results: dataSources.length,
      data: {
        dataSources,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific data source
exports.getDataSource = async (req, res, next) => {
  try {
    const dataSource = await DataSource.findByPk(req.params.id, {
      attributes: { exclude: ["password"] }, // Don't send password
    });

    if (!dataSource) {
      return next(createError(404, "Data source not found"));
    }

    res.status(200).json({
      status: "success",
      data: {
        dataSource,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new data source
exports.createDataSource = async (req, res, next) => {
  try {
    const {
      name,
      type,
      host,
      port,
      database,
      username,
      password,
      description,
      schema,
      ssl,
      connectionOptions,
    } = req.body;

    // Test connection before creating
    const connectionResult = await testConnection({
      type,
      host,
      port,
      database,
      username,
      password,
      schema,
      ssl,
      connectionOptions,
    });

    if (!connectionResult.success) {
      return next(
        createError(400, `Connection test failed: ${connectionResult.message}`)
      );
    }

    // Create data source in database
    const newDataSource = await DataSource.create({
      name,
      type,
      host,
      port,
      database,
      username,
      password,
      description,
      schema,
      ssl,
      connectionOptions,
      status: "connected",
    });

    // Create the source in Airbyte (if integration is enabled)
    try {
      const airbyteResult = await createAirbyteSource(newDataSource);
      if (airbyteResult.success) {
        await newDataSource.update({
          airbyteSourceId: airbyteResult.sourceId,
          airbyteConnectionId: airbyteResult.connectionId,
        });
      }
    } catch (error) {
      logger.warn("Failed to create Airbyte source:", error);
      // Continue even if Airbyte integration fails
    }

    // Create the database in Metabase (if integration is enabled)
    try {
      const metabaseResult = await createMetabaseDatabase(newDataSource);
      if (metabaseResult.success) {
        await newDataSource.update({
          metabaseId: metabaseResult.databaseId,
        });
      }
    } catch (error) {
      logger.warn("Failed to create Metabase database:", error);
      // Continue even if Metabase integration fails
    }

    // Don't send password in response
    newDataSource.password = undefined;

    res.status(201).json({
      status: "success",
      data: {
        dataSource: newDataSource,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a data source
exports.updateDataSource = async (req, res, next) => {
  try {
    const {
      name,
      type,
      host,
      port,
      database,
      username,
      password,
      description,
      schema,
      ssl,
      connectionOptions,
    } = req.body;

    // Find the data source
    const dataSource = await DataSource.findByPk(req.params.id);

    if (!dataSource) {
      return next(createError(404, "Data source not found"));
    }

    // If connection details changed, test connection
    if (
      type !== dataSource.type ||
      host !== dataSource.host ||
      port !== dataSource.port ||
      database !== dataSource.database ||
      username !== dataSource.username ||
      password !== undefined || // Password is being updated
      schema !== dataSource.schema ||
      ssl !== dataSource.ssl ||
      JSON.stringify(connectionOptions) !==
        JSON.stringify(dataSource.connectionOptions)
    ) {
      const connectionResult = await testConnection({
        type: type || dataSource.type,
        host: host || dataSource.host,
        port: port || dataSource.port,
        database: database || dataSource.database,
        username: username || dataSource.username,
        password: password || dataSource.password,
        schema: schema || dataSource.schema,
        ssl: ssl !== undefined ? ssl : dataSource.ssl,
        connectionOptions: connectionOptions || dataSource.connectionOptions,
      });

      if (!connectionResult.success) {
        return next(
          createError(
            400,
            `Connection test failed: ${connectionResult.message}`
          )
        );
      }
    }

    // Update the data source
    const updateData = {
      name: name || dataSource.name,
      type: type || dataSource.type,
      host: host || dataSource.host,
      port: port || dataSource.port,
      database: database || dataSource.database,
      username: username || dataSource.username,
      description: description || dataSource.description,
      schema: schema || dataSource.schema,
      ssl: ssl !== undefined ? ssl : dataSource.ssl,
      connectionOptions: connectionOptions || dataSource.connectionOptions,
      status: "connected",
    };

    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    await dataSource.update(updateData);

    // Update in Airbyte if connected
    if (dataSource.airbyteSourceId) {
      try {
        await updateAirbyteSource(
          dataSource.airbyteSourceId,
          dataSource.airbyteConnectionId,
          {
            ...updateData,
            password: password || dataSource.password,
          }
        );
      } catch (error) {
        logger.warn("Failed to update Airbyte source:", error);
      }
    }

    // Update in Metabase if connected
    if (dataSource.metabaseId) {
      try {
        await updateMetabaseDatabase(dataSource.metabaseId, {
          ...updateData,
          password: password || dataSource.password,
        });
      } catch (error) {
        logger.warn("Failed to update Metabase database:", error);
      }
    }

    // Don't send password in response
    dataSource.password = undefined;

    res.status(200).json({
      status: "success",
      data: {
        dataSource,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a data source
exports.deleteDataSource = async (req, res, next) => {
  try {
    const dataSource = await DataSource.findByPk(req.params.id);

    if (!dataSource) {
      return next(createError(404, "Data source not found"));
    }

    // Delete from Airbyte if connected
    if (dataSource.airbyteSourceId) {
      try {
        await deleteAirbyteSource(
          dataSource.airbyteSourceId,
          dataSource.airbyteConnectionId
        );
      } catch (error) {
        logger.warn("Failed to delete Airbyte source:", error);
      }
    }

    // Delete from Metabase if connected
    if (dataSource.metabaseId) {
      try {
        await deleteMetabaseDatabase(dataSource.metabaseId);
      } catch (error) {
        logger.warn("Failed to delete Metabase database:", error);
      }
    }

    // Delete from our database
    await dataSource.destroy();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Test connection to a data source
exports.testConnection = async (req, res, next) => {
  try {
    const {
      type,
      host,
      port,
      database,
      username,
      password,
      schema,
      ssl,
      connectionOptions,
    } = req.body;

    const result = await testConnection({
      type,
      host,
      port,
      database,
      username,
      password,
      schema,
      ssl,
      connectionOptions,
    });

    res.status(200).json({
      status: result.success ? "success" : "error",
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};
