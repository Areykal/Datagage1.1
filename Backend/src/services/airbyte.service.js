const axios = require("axios");
const { logger } = require("../utils/logger");

// Airbyte API client
const airbyteClient = axios.create({
  baseURL: process.env.AIRBYTE_URL,
  auth: {
    username: process.env.AIRBYTE_USERNAME,
    password: process.env.AIRBYTE_PASSWORD,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

// Handle Airbyte API errors
const handleAirbyteError = (error) => {
  if (error.response) {
    logger.error(
      `Airbyte API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
    );
    throw new Error(
      `Airbyte API error: ${error.response.status} - ${error.response.data.message || "Unknown error"}`
    );
  }
  throw error;
};

// Get Airbyte workspace ID (or create if not exists)
const getWorkspaceId = async () => {
  try {
    // First try to list workspaces
    const response = await airbyteClient.post("/workspaces/list");

    // Use the first workspace or the one matching our name
    if (response.data.workspaces && response.data.workspaces.length > 0) {
      const workspace =
        response.data.workspaces.find((w) => w.name === "Qwen Viz") ||
        response.data.workspaces[0];
      return workspace.workspaceId;
    }

    // If no workspaces, create one
    const createResponse = await airbyteClient.post("/workspaces/create", {
      name: "Qwen Viz",
    });

    return createResponse.data.workspaceId;
  } catch (error) {
    handleAirbyteError(error);
  }
};

// Create a source definition if it doesn't exist
const getSourceDefinitionId = async (sourceType) => {
  try {
    // Map our database types to Airbyte source types
    const sourceTypeMap = {
      postgresql: "postgres",
      mysql: "mysql",
      mongodb: "mongodb-v2",
      snowflake: "snowflake",
      bigquery: "bigquery",
      sqlserver: "mssql",
      oracle: "oracle",
      redshift: "redshift",
      dynamodb: "dynamodb",
      elasticsearch: "elasticsearch",
    };

    const airbyteSourceType = sourceTypeMap[sourceType] || sourceType;

    // List source definitions
    const response = await airbyteClient.post("/source_definitions/list");

    // Find matching source definition
    const sourceDefinition = response.data.sourceDefinitions.find((sd) =>
      sd.name.toLowerCase().includes(airbyteSourceType)
    );

    if (!sourceDefinition) {
      throw new Error(
        `Source definition for ${sourceType} not found in Airbyte`
      );
    }

    return sourceDefinition.sourceDefinitionId;
  } catch (error) {
    handleAirbyteError(error);
  }
};

// Get destination definition ID for PostgreSQL
const getDestinationDefinitionId = async () => {
  try {
    // List destination definitions
    const response = await airbyteClient.post("/destination_definitions/list");

    // Find PostgreSQL destination definition
    const destinationDefinition = response.data.destinationDefinitions.find(
      (dd) => dd.name.toLowerCase().includes("postgres")
    );

    if (!destinationDefinition) {
      throw new Error("PostgreSQL destination definition not found in Airbyte");
    }

    return destinationDefinition.destinationDefinitionId;
  } catch (error) {
    handleAirbyteError(error);
  }
};

// Create a destination if it doesn't exist
const getDestinationId = async (workspaceId) => {
  try {
    // List destinations
    const response = await airbyteClient.post("/destinations/list", {
      workspaceId,
    });

    // Find our destination
    const destination = response.data.destinations.find(
      (d) => d.name === "Qwen Viz Warehouse"
    );

    if (destination) {
      return destination.destinationId;
    }

    // Get PostgreSQL destination definition ID
    const destinationDefinitionId = await getDestinationDefinitionId();

    // Create destination
    const createResponse = await airbyteClient.post("/destinations/create", {
      workspaceId,
      name: "Qwen Viz Warehouse",
      destinationDefinitionId,
      connectionConfiguration: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME,
        schema: "airbyte_sync",
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false,
      },
    });

    return createResponse.data.destinationId;
  } catch (error) {
    handleAirbyteError(error);
  }
};

// Create a source in Airbyte
exports.createAirbyteSource = async (dataSource) => {
  try {
    // Skip if Airbyte integration is disabled
    if (!process.env.AIRBYTE_URL) {
      return { success: false, message: "Airbyte integration disabled" };
    }

    // Get workspace ID
    const workspaceId = await getWorkspaceId();

    // Get source definition ID
    const sourceDefinitionId = await getSourceDefinitionId(dataSource.type);

    // Prepare connection configuration based on database type
    let connectionConfiguration;

    switch (dataSource.type) {
      case "postgresql":
        connectionConfiguration = {
          host: dataSource.host,
          port: dataSource.port || 5432,
          database: dataSource.database,
          schema: dataSource.schema || "public",
          username: dataSource.username,
          password: dataSource.password,
          ssl: dataSource.ssl || false,
        };
        break;

      case "mysql":
        connectionConfiguration = {
          host: dataSource.host,
          port: dataSource.port || 3306,
          database: dataSource.database,
          username: dataSource.username,
          password: dataSource.password,
        };
        break;

      case "mongodb":
        connectionConfiguration = {
          host: dataSource.host,
          port: dataSource.port || 27017,
          database: dataSource.database,
          username: dataSource.username,
          password: dataSource.password,
          auth_source: "admin",
        };
        break;

      // Add more database types as needed

      default:
        return {
          success: false,
          message: `Unsupported database type for Airbyte: ${dataSource.type}`,
        };
    }

    // Create source
    const sourceResponse = await airbyteClient.post("/sources/create", {
      workspaceId,
      name: dataSource.name,
      sourceDefinitionId,
      connectionConfiguration,
    });

    const sourceId = sourceResponse.data.sourceId;

    // Get destination ID
    const destinationId = await getDestinationId(workspaceId);

    // Create connection between source and destination
    const connectionResponse = await airbyteClient.post("/connections/create", {
      name: `${dataSource.name} to Warehouse`,
      namespaceDefinition: "source",
      sourceId,
      destinationId,
      status: "active",
      syncCatalog: {
        streams: [], // Will be discovered when first sync runs
      },
      scheduleType: "manual",
    });

    return {
      success: true,
      sourceId,
      connectionId: connectionResponse.data.connectionId,
    };
  } catch (error) {
    logger.error("Error creating Airbyte source:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Update a source in Airbyte
exports.updateAirbyteSource = async (sourceId, connectionId, dataSource) => {
  try {
    // Skip if Airbyte integration is disabled
    if (!process.env.AIRBYTE_URL) {
      return { success: false, message: "Airbyte integration disabled" };
    }

    // Prepare connection configuration based on database type
    let connectionConfiguration;

    switch (dataSource.type) {
      case "postgresql":
        connectionConfiguration = {
          host: dataSource.host,
          port: dataSource.port || 5432,
          database: dataSource.database,
          schema: dataSource.schema || "public",
          username: dataSource.username,
          password: dataSource.password,
          ssl: dataSource.ssl || false,
        };
        break;

      case "mysql":
        connectionConfiguration = {
          host: dataSource.host,
          port: dataSource.port || 3306,
          database: dataSource.database,
          username: dataSource.username,
          password: dataSource.password,
        };
        break;

      case "mongodb":
        connectionConfiguration = {
          host: dataSource.host,
          port: dataSource.port || 27017,
          database: dataSource.database,
          username: dataSource.username,
          password: dataSource.password,
          auth_source: "admin",
        };
        break;

      // Add more database types as needed

      default:
        return {
          success: false,
          message: `Unsupported database type for Airbyte: ${dataSource.type}`,
        };
    }

    // Get current source config
    const sourceResponse = await airbyteClient.post("/sources/get", {
      sourceId,
    });

    // Update source
    await airbyteClient.post("/sources/update", {
      sourceId,
      name: dataSource.name,
      connectionConfiguration,
    });

    // Update connection name if needed
    if (connectionId) {
      const connectionResponse = await airbyteClient.post("/connections/get", {
        connectionId,
      });

      if (connectionResponse.data.name !== `${dataSource.name} to Warehouse`) {
        await airbyteClient.post("/connections/update", {
          connectionId,
          name: `${dataSource.name} to Warehouse`,
        });
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error updating Airbyte source:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Delete a source from Airbyte
exports.deleteAirbyteSource = async (sourceId, connectionId) => {
  try {
    // Skip if Airbyte integration is disabled
    if (!process.env.AIRBYTE_URL) {
      return { success: false, message: "Airbyte integration disabled" };
    }

    // Delete connection first if exists
    if (connectionId) {
      await airbyteClient.post("/connections/delete", {
        connectionId,
      });
    }

    // Delete source
    await airbyteClient.post("/sources/delete", {
      sourceId,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error deleting Airbyte source:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Trigger a sync job
exports.triggerSync = async (connectionId) => {
  try {
    // Skip if Airbyte integration is disabled
    if (!process.env.AIRBYTE_URL) {
      return { success: false, message: "Airbyte integration disabled" };
    }

    // Trigger sync
    const response = await airbyteClient.post("/connections/sync", {
      connectionId,
    });

    return {
      success: true,
      jobId: response.data.job.id,
    };
  } catch (error) {
    logger.error("Error triggering Airbyte sync:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Get sync job status
exports.getSyncStatus = async (jobId) => {
  try {
    // Skip if Airbyte integration is disabled
    if (!process.env.AIRBYTE_URL) {
      return { success: false, message: "Airbyte integration disabled" };
    }

    // Get job status
    const response = await airbyteClient.post("/jobs/get", {
      id: jobId,
    });

    return {
      success: true,
      status: response.data.job.status,
      job: response.data.job,
    };
  } catch (error) {
    logger.error("Error getting Airbyte sync status:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};
