const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class DataSource extends Model {}

DataSource.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "postgresql",
        "mysql",
        "mongodb",
        "snowflake",
        "bigquery",
        "sqlserver",
        "oracle",
        "redshift",
        "dynamodb",
        "elasticsearch"
      ),
      allowNull: false,
    },
    host: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
    },
    database: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    schema: {
      type: DataTypes.STRING,
    },
    ssl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    connectionOptions: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM("connected", "failed", "disconnected"),
      defaultValue: "disconnected",
    },
    lastSync: {
      type: DataTypes.DATE,
    },
    // Airbyte-specific fields
    airbyteConnectionId: {
      type: DataTypes.STRING,
    },
    airbyteSourceId: {
      type: DataTypes.STRING,
    },
    // Metabase-specific fields
    metabaseId: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    modelName: "DataSource",
    timestamps: true,
    paranoid: true, // Soft delete
  }
);

module.exports = DataSource;
