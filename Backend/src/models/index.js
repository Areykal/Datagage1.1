const User = require("./User");
const DataSource = require("./DataSource");
const Insight = require("./Insight");
const Settings = require("./Settings");

// Define associations between models
User.hasMany(Insight, {
  foreignKey: "createdById",
  as: "insights",
});

Insight.belongsTo(User, {
  foreignKey: "createdById",
  as: "creator",
});

DataSource.hasMany(Insight, {
  foreignKey: "dataSourceId",
  as: "insights",
});

Insight.belongsTo(DataSource, {
  foreignKey: "dataSourceId",
  as: "dataSource",
});

User.hasMany(Settings, {
  foreignKey: "lastUpdatedById",
  as: "updatedSettings",
});

Settings.belongsTo(User, {
  foreignKey: "lastUpdatedById",
  as: "lastUpdatedBy",
});

module.exports = {
  User,
  DataSource,
  Insight,
  Settings,
};
