const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Insight extends Model {}

Insight.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    category: {
      type: DataTypes.ENUM(
        "sales",
        "marketing",
        "customer",
        "financial",
        "operational",
        "performance",
        "inventory"
      ),
      allowNull: false,
    },
    visualizationType: {
      type: DataTypes.ENUM(
        "bar_chart",
        "line_chart",
        "pie_chart",
        "scatter_plot",
        "heatmap",
        "combined_chart",
        "table",
        "kpi_dashboard"
      ),
      allowNull: false,
    },
    query: {
      type: DataTypes.TEXT,
    },
    queryConfig: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    aiPrompt: {
      type: DataTypes.TEXT,
    },
    findings: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    dataSourceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "DataSources",
        key: "id",
      },
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    // Metabase-specific fields
    metabaseDashboardId: {
      type: DataTypes.INTEGER,
    },
    metabaseCardId: {
      type: DataTypes.INTEGER,
    },
    // Data caching and refresh settings
    lastRefreshed: {
      type: DataTypes.DATE,
    },
    refreshInterval: {
      type: DataTypes.INTEGER, // minutes
      defaultValue: 60, // 1 hour default
    },
    cachedData: {
      type: DataTypes.JSONB,
    },
  },
  {
    sequelize,
    modelName: "Insight",
    timestamps: true,
    paranoid: true, // Soft delete
  }
);

module.exports = Insight;
