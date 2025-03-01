const { Sequelize } = require("sequelize");
const { Client } = require("pg");
const mysql = require("mysql2/promise");
const { MongoClient } = require("mongodb");
const { logger } = require("../utils/logger");

// Test database connection based on type
exports.testConnection = async (connectionConfig) => {
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
  } = connectionConfig;

  try {
    let result = {
      success: false,
      message: "",
      data: null,
    };

    switch (type) {
      case "postgresql":
        result = await testPostgresConnection({
          host,
          port,
          database,
          username,
          password,
          schema,
          ssl,
          connectionOptions,
        });
        break;

      case "mysql":
        result = await testMySQLConnection({
          host,
          port,
          database,
          username,
          password,
          connectionOptions,
        });
        break;

      case "mongodb":
        result = await testMongoDBConnection({
          host,
          port,
          database,
          username,
          password,
          connectionOptions,
        });
        break;

      // Add more database types as needed

      default:
        return {
          success: false,
          message: `Unsupported database type: ${type}`,
          data: null,
        };
    }

    return result;
  } catch (error) {
    logger.error(`Connection test error for ${type}:`, error);
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      data: null,
    };
  }
};

// Execute query on a data source
exports.executeQuery = async (dataSource, query, params = []) => {
  try {
    switch (dataSource.type) {
      case "postgresql":
        return await executePostgresQuery(dataSource, query, params);

      case "mysql":
        return await executeMySQLQuery(dataSource, query, params);

      case "mongodb":
        return await executeMongoDBQuery(dataSource, query);

      // Add more database types as needed

      default:
        throw new Error(`Unsupported database type: ${dataSource.type}`);
    }
  } catch (error) {
    logger.error(`Query execution error for ${dataSource.type}:`, error);
    throw error;
  }
};

// Get schema information from a data source
exports.getSchemaInfo = async (dataSource) => {
  try {
    switch (dataSource.type) {
      case "postgresql":
        return await getPostgresSchemaInfo(dataSource);

      case "mysql":
        return await getMySQLSchemaInfo(dataSource);

      case "mongodb":
        return await getMongoDBSchemaInfo(dataSource);

      // Add more database types as needed

      default:
        throw new Error(`Unsupported database type: ${dataSource.type}`);
    }
  } catch (error) {
    logger.error(`Schema info error for ${dataSource.type}:`, error);
    throw error;
  }
};

// PostgreSQL connection test
async function testPostgresConnection(config) {
  const { host, port, database, username, password, schema, ssl } = config;

  const client = new Client({
    host,
    port: port || 5432,
    database,
    user: username,
    password,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    schema: schema || "public",
  });

  try {
    await client.connect();
    const result = await client.query("SELECT NOW() as time");
    await client.end();

    return {
      success: true,
      message: "Connection successful",
      data: {
        timestamp: result.rows[0].time,
        database_type: "PostgreSQL",
      },
    };
  } catch (error) {
    if (client) {
      await client.end().catch(() => {});
    }
    throw error;
  }
}

// MySQL connection test
async function testMySQLConnection(config) {
  const { host, port, database, username, password } = config;

  const connection = await mysql.createConnection({
    host,
    port: port || 3306,
    database,
    user: username,
    password,
  });

  try {
    await connection.connect();
    const [rows] = await connection.execute("SELECT NOW() as time");
    await connection.end();

    return {
      success: true,
      message: "Connection successful",
      data: {
        timestamp: rows[0].time,
        database_type: "MySQL",
      },
    };
  } catch (error) {
    if (connection) {
      await connection.end().catch(() => {});
    }
    throw error;
  }
}

// MongoDB connection test
async function testMongoDBConnection(config) {
  const { host, port, database, username, password } = config;

  const url = username
    ? `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`
    : `mongodb://${host}:${port || 27017}/${database}`;

  const client = new MongoClient(url, {
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(database);
    const collections = await db.listCollections().toArray();
    await client.close();

    return {
      success: true,
      message: "Connection successful",
      data: {
        collections_count: collections.length,
        database_type: "MongoDB",
      },
    };
  } catch (error) {
    if (client) {
      await client.close().catch(() => {});
    }
    throw error;
  }
}

// Execute query on PostgreSQL
async function executePostgresQuery(dataSource, query, params = []) {
  const { host, port, database, username, password, schema, ssl } = dataSource;

  const client = new Client({
    host,
    port: port || 5432,
    database,
    user: username,
    password,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    schema: schema || "public",
  });

  try {
    await client.connect();
    const result = await client.query(query, params);
    await client.end();

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map((field) => ({
        name: field.name,
        type: field.dataTypeID,
      })),
    };
  } catch (error) {
    if (client) {
      await client.end().catch(() => {});
    }
    throw error;
  }
}

// Execute query on MySQL
async function executeMySQLQuery(dataSource, query, params = []) {
  const { host, port, database, username, password } = dataSource;

  const connection = await mysql.createConnection({
    host,
    port: port || 3306,
    database,
    user: username,
    password,
  });

  try {
    await connection.connect();
    const [rows, fields] = await connection.execute(query, params);
    await connection.end();

    return {
      rows,
      rowCount: rows.length,
      fields: fields.map((field) => ({
        name: field.name,
        type: field.type,
      })),
    };
  } catch (error) {
    if (connection) {
      await connection.end().catch(() => {});
    }
    throw error;
  }
}

// Execute query on MongoDB
async function executeMongoDBQuery(dataSource, query) {
  const { host, port, database, username, password } = dataSource;

  const url = username
    ? `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`
    : `mongodb://${host}:${port || 27017}/${database}`;

  const client = new MongoClient(url, {
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(database);

    // Parse the query (assumed to be in a JSON-like format describing the operation)
    const queryObj = typeof query === "string" ? JSON.parse(query) : query;

    const {
      collection,
      operation,
      filter = {},
      projection = {},
      options = {},
    } = queryObj;

    const coll = db.collection(collection);
    let result;

    switch (operation) {
      case "find":
        result = await coll.find(filter, options).project(projection).toArray();
        break;
      case "findOne":
        result = await coll.findOne(filter, { projection, ...options });
        break;
      case "aggregate":
        result = await coll.aggregate(filter).toArray();
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    await client.close();

    return {
      rows: result,
      rowCount: Array.isArray(result) ? result.length : result ? 1 : 0,
      fields:
        result && result.length > 0
          ? Object.keys(result[0]).map((key) => ({
              name: key,
              type: typeof result[0][key],
            }))
          : [],
    };
  } catch (error) {
    if (client) {
      await client.close().catch(() => {});
    }
    throw error;
  }
}

// Get schema info for PostgreSQL
async function getPostgresSchemaInfo(dataSource) {
  const { host, port, database, username, password, schema, ssl } = dataSource;

  const client = new Client({
    host,
    port: port || 5432,
    database,
    user: username,
    password,
    ssl: ssl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Get all tables in the schema
    const tablesQuery = `
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = $1 
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_name
    `;

    const tablesResult = await client.query(tablesQuery, [schema || "public"]);

    const tables = [];

    // For each table, get column information
    for (const table of tablesResult.rows) {
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = $1 
          AND table_name = $2
        ORDER BY 
          ordinal_position
      `;

      const columnsResult = await client.query(columnsQuery, [
        schema || "public",
        table.table_name,
      ]);

      tables.push({
        name: table.table_name,
        columns: columnsResult.rows.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          length: col.character_maximum_length,
          nullable: col.is_nullable === "YES",
          default: col.column_default,
        })),
      });
    }

    await client.end();

    return {
      database: database,
      schema: schema || "public",
      tables,
    };
  } catch (error) {
    if (client) {
      await client.end().catch(() => {});
    }
    throw error;
  }
}

// Get schema info for MySQL
async function getMySQLSchemaInfo(dataSource) {
  const { host, port, database, username, password } = dataSource;

  const connection = await mysql.createConnection({
    host,
    port: port || 3306,
    database,
    user: username,
    password,
  });

  try {
    await connection.connect();

    // Get all tables
    const [tablesResult] = await connection.execute(
      `
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = ? 
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_name
    `,
      [database]
    );

    const tables = [];

    // For each table, get column information
    for (const table of tablesResult) {
      const [columnsResult] = await connection.execute(
        `
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = ? 
          AND table_name = ?
        ORDER BY 
          ordinal_position
      `,
        [database, table.table_name]
      );

      tables.push({
        name: table.table_name,
        columns: columnsResult.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          length: col.character_maximum_length,
          nullable: col.is_nullable === "YES",
          default: col.column_default,
        })),
      });
    }

    await connection.end();

    return {
      database,
      tables,
    };
  } catch (error) {
    if (connection) {
      await connection.end().catch(() => {});
    }
    throw error;
  }
}

// Get schema info for MongoDB
async function getMongoDBSchemaInfo(dataSource) {
  const { host, port, database, username, password } = dataSource;

  const url = username
    ? `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`
    : `mongodb://${host}:${port || 27017}/${database}`;

  const client = new MongoClient(url, {
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(database);

    // Get all collections
    const collections = await db.listCollections().toArray();

    const result = [];

    // For each collection, sample documents to infer schema
    for (const collection of collections) {
      const sampleDocs = await db
        .collection(collection.name)
        .find()
        .limit(5)
        .toArray();

      const fields = new Set();
      const fieldTypes = {};

      // Analyze sample documents to infer schema
      sampleDocs.forEach((doc) => {
        Object.keys(doc).forEach((field) => {
          fields.add(field);
          const type = typeof doc[field];
          if (!fieldTypes[field]) {
            fieldTypes[field] = [type];
          } else if (!fieldTypes[field].includes(type)) {
            fieldTypes[field].push(type);
          }
        });
      });

      result.push({
        name: collection.name,
        fields: [...fields].map((field) => ({
          name: field,
          types: fieldTypes[field],
        })),
        document_count: await db.collection(collection.name).countDocuments(),
      });
    }

    await client.close();

    return {
      database,
      collections: result,
    };
  } catch (error) {
    if (client) {
      await client.close().catch(() => {});
    }
    throw error;
  }
}
