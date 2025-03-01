const axios = require("axios");
const { logger } = require("../utils/logger");

// Metabase session token
let metabaseToken = null;
let tokenExpiry = null;

// Authenticate with Metabase and get session token
const authenticateMetabase = async () => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      throw new Error("Metabase integration disabled");
    }

    // Check if we already have a valid token
    if (metabaseToken && tokenExpiry && tokenExpiry > Date.now()) {
      return metabaseToken;
    }

    // Request new token
    const response = await axios.post(
      `${process.env.METABASE_URL}/api/session`,
      {
        username: process.env.METABASE_USERNAME,
        password: process.env.METABASE_PASSWORD,
      }
    );

    // Save token and set expiry (2 hours)
    metabaseToken = response.data.id;
    tokenExpiry = Date.now() + 2 * 60 * 60 * 1000;

    return metabaseToken;
  } catch (error) {
    logger.error("Metabase authentication error:", error);
    throw new Error(`Failed to authenticate with Metabase: ${error.message}`);
  }
};

// Metabase API client
const metabaseClient = async () => {
  try {
    const token = await authenticateMetabase();

    return axios.create({
      baseURL: `${process.env.METABASE_URL}/api`,
      headers: {
        "Content-Type": "application/json",
        "X-Metabase-Session": token,
      },
    });
  } catch (error) {
    logger.error("Failed to create Metabase client:", error);
    throw error;
  }
};

// Create a database in Metabase
exports.createMetabaseDatabase = async (dataSource) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Map our database types to Metabase database types
    const engineMap = {
      postgresql: "postgres",
      mysql: "mysql",
      mongodb: "mongo",
      snowflake: "snowflake",
      bigquery: "bigquery",
      sqlserver: "sqlserver",
      oracle: "oracle",
      redshift: "redshift",
      dynamodb: "dynamodb",
      elasticsearch: "elasticsearch",
    };

    const engine = engineMap[dataSource.type] || dataSource.type;

    // Prepare details based on database type
    let details = {};

    switch (dataSource.type) {
      case "postgresql":
        details = {
          host: dataSource.host,
          port: dataSource.port || 5432,
          dbname: dataSource.database,
          schema: dataSource.schema || "public",
          user: dataSource.username,
          password: dataSource.password,
          ssl: dataSource.ssl || false,
        };
        break;

      case "mysql":
        details = {
          host: dataSource.host,
          port: dataSource.port || 3306,
          dbname: dataSource.database,
          user: dataSource.username,
          password: dataSource.password,
        };
        break;

      case "mongodb":
        details = {
          host: dataSource.host,
          port: dataSource.port || 27017,
          dbname: dataSource.database,
          user: dataSource.username,
          password: dataSource.password,
        };
        break;

      // Add more database types as needed

      default:
        return {
          success: false,
          message: `Unsupported database type for Metabase: ${dataSource.type}`,
        };
    }

    // Create database in Metabase
    const response = await client.post("/database", {
      name: dataSource.name,
      engine,
      details,
    });

    return {
      success: true,
      databaseId: response.data.id,
    };
  } catch (error) {
    logger.error("Error creating Metabase database:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Update a database in Metabase
exports.updateMetabaseDatabase = async (databaseId, dataSource) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Map our database types to Metabase database types
    const engineMap = {
      postgresql: "postgres",
      mysql: "mysql",
      mongodb: "mongo",
      snowflake: "snowflake",
      bigquery: "bigquery",
      sqlserver: "sqlserver",
      oracle: "oracle",
      redshift: "redshift",
      dynamodb: "dynamodb",
      elasticsearch: "elasticsearch",
    };

    const engine = engineMap[dataSource.type] || dataSource.type;

    // Prepare details based on database type
    let details = {};

    switch (dataSource.type) {
      case "postgresql":
        details = {
          host: dataSource.host,
          port: dataSource.port || 5432,
          dbname: dataSource.database,
          schema: dataSource.schema || "public",
          user: dataSource.username,
          password: dataSource.password,
          ssl: dataSource.ssl || false,
        };
        break;

      case "mysql":
        details = {
          host: dataSource.host,
          port: dataSource.port || 3306,
          dbname: dataSource.database,
          user: dataSource.username,
          password: dataSource.password,
        };
        break;

      case "mongodb":
        details = {
          host: dataSource.host,
          port: dataSource.port || 27017,
          dbname: dataSource.database,
          user: dataSource.username,
          password: dataSource.password,
        };
        break;

      // Add more database types as needed

      default:
        return {
          success: false,
          message: `Unsupported database type for Metabase: ${dataSource.type}`,
        };
    }

    // Update database in Metabase
    await client.put(`/database/${databaseId}`, {
      name: dataSource.name,
      engine,
      details,
    });

    // Rescan database
    await client.post(`/database/${databaseId}/rescan_values`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error updating Metabase database:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Delete a database from Metabase
exports.deleteMetabaseDatabase = async (databaseId) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Delete database from Metabase
    await client.delete(`/database/${databaseId}`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error deleting Metabase database:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Create a card (visualization) in Metabase
exports.createMetabaseCard = async (
  name,
  description,
  databaseId,
  query,
  display,
  visualizationSettings = {}
) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Create card in Metabase
    const response = await client.post("/card", {
      name,
      description,
      dataset_query: {
        type: "native",
        native: {
          query,
          template_tags: {},
        },
        database: databaseId,
      },
      display,
      visualization_settings: visualizationSettings,
    });

    return {
      success: true,
      cardId: response.data.id,
    };
  } catch (error) {
    logger.error("Error creating Metabase card:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Update a card in Metabase
exports.updateMetabaseCard = async (cardId, updates) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Get current card
    const currentCard = await client.get(`/card/${cardId}`);

    // Update card in Metabase
    await client.put(`/card/${cardId}`, {
      ...currentCard.data,
      ...updates,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error updating Metabase card:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Delete a card from Metabase
exports.deleteMetabaseCard = async (cardId) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Delete card from Metabase
    await client.delete(`/card/${cardId}`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error deleting Metabase card:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Create a dashboard in Metabase
exports.createMetabaseDashboard = async (name, description) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Create dashboard in Metabase
    const response = await client.post("/dashboard", {
      name,
      description,
    });

    return {
      success: true,
      dashboardId: response.data.id,
    };
  } catch (error) {
    logger.error("Error creating Metabase dashboard:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Add a card to a dashboard in Metabase
exports.addCardToDashboard = async (
  dashboardId,
  cardId,
  width = 4,
  height = 4,
  row = 0,
  col = 0
) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Add card to dashboard in Metabase
    const response = await client.post(`/dashboard/${dashboardId}/cards`, {
      cardId,
      parameter_mappings: [],
      visualization_settings: {},
      size_x: width,
      size_y: height,
      row,
      col,
    });

    return {
      success: true,
      dashcardId: response.data.id,
    };
  } catch (error) {
    logger.error("Error adding card to Metabase dashboard:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Generate a public link for a dashboard in Metabase
exports.createPublicDashboard = async (dashboardId) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Create public dashboard in Metabase
    const response = await client.post(`/dashboard/${dashboardId}/public_link`);

    return {
      success: true,
      publicUrl: `${process.env.METABASE_URL}/public/dashboard/${response.data.uuid}`,
    };
  } catch (error) {
    logger.error("Error creating Metabase public dashboard:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Get dashboard data from Metabase
exports.getDashboardData = async (dashboardId) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Get dashboard from Metabase
    const response = await client.get(`/dashboard/${dashboardId}`);

    return {
      success: true,
      dashboard: response.data,
    };
  } catch (error) {
    logger.error("Error getting Metabase dashboard:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// Execute a query in Metabase
exports.executeQuery = async (databaseId, query) => {
  try {
    // Skip if Metabase integration is disabled
    if (!process.env.METABASE_URL) {
      return { success: false, message: "Metabase integration disabled" };
    }

    const client = await metabaseClient();

    // Execute query in Metabase
    const response = await client.post("/dataset", {
      type: "native",
      native: {
        query,
        template_tags: {},
      },
      database: databaseId,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error("Error executing Metabase query:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};
