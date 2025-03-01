const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Settings extends Model {}

Settings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM(
        "general",
        "appearance",
        "qwen",
        "metabase",
        "airbyte",
        "notifications"
      ),
      allowNull: false,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    lastUpdatedById: {
      type: DataTypes.UUID,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Settings",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["category"],
      },
    ],
  }
);

module.exports = Settings;
