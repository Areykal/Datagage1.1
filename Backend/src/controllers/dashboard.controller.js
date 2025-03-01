const { DataSource, Insight, User } = require("../models");
const { createError } = require("../utils/logger");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Get dashboard summary statistics
exports.getSummary = async (req, res, next) => {
  try {
    // Get counts for each entity
    const [dataSources, insights, users] = await Promise.all([
      DataSource.count(),
      Insight.count(),
      User.count(),
    ]);

    // Get count of data sources by type
    const dataSourcesByType = await DataSource.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    // Get count of insights by category
    const insightsByCategory = await Insight.findAll({
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["category"],
      raw: true,
    });

    // Calculate success rate of data sources
    const connectedDataSources = await DataSource.count({
      where: { status: "connected" },
    });

    const connectionSuccessRate =
      dataSources > 0
        ? Math.round((connectedDataSources / dataSources) * 100)
        : 100;

    // Get recent activity metrics
    const recentInsights = await Insight.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        counts: {
          dataSources,
          insights,
          users,
        },
        dataSourcesByType,
        insightsByCategory,
        connectionSuccessRate,
        recentActivity: {
          newInsights: recentInsights,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get recent activities
exports.getRecentActivities = async (req, res, next) => {
  try {
    // Get limit from query params (default to 10)
    const limit = parseInt(req.query.limit) || 10;

    // Get recent insights with creator information
    const recentInsights = await Insight.findAll({
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: DataSource,
          as: "dataSource",
          attributes: ["id", "name", "type"],
        },
      ],
    });

    // Transform insights into activity format
    const insightActivities = recentInsights.map((insight) => ({
      id: insight.id,
      type: "insight_created",
      description: `New insight "${insight.title}" created`,
      timestamp: insight.createdAt,
      user: `${insight.creator.firstName} ${insight.creator.lastName}`,
      userId: insight.creator.id,
      details: {
        insightId: insight.id,
        insightTitle: insight.title,
        insightCategory: insight.category,
        dataSourceId: insight.dataSourceId,
        dataSourceName: insight.dataSource.name,
      },
    }));

    // Get recent data source changes
    const recentDataSources = await DataSource.findAll({
      limit,
      order: [["updatedAt", "DESC"]],
      where: {
        updatedAt: {
          [Op.ne]: sequelize.col("createdAt"), // Only get updated data sources
        },
      },
    });

    // Transform data sources into activity format
    const dataSourceActivities = recentDataSources.map((ds) => ({
      id: ds.id,
      type: "datasource_updated",
      description: `Data source "${ds.name}" updated`,
      timestamp: ds.updatedAt,
      details: {
        dataSourceId: ds.id,
        dataSourceName: ds.name,
        dataSourceType: ds.type,
        status: ds.status,
      },
    }));

    // Combine and sort activities
    const allActivities = [...insightActivities, ...dataSourceActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.status(200).json({
      status: "success",
      data: {
        activities: allActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get key metrics
exports.getKeyMetrics = async (req, res, next) => {
  try {
    // Get time range from query params (default to 30 days)
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate - days * 24 * 60 * 60 * 1000);

    // Calculate date ranges for comparison (current period vs previous period)
    const previousStartDate = new Date(startDate - days * 24 * 60 * 60 * 1000);

    // Get counts for current period
    const [currentInsights, currentDataSources] = await Promise.all([
      Insight.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      }),
      DataSource.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      }),
    ]);

    // Get counts for previous period
    const [previousInsights, previousDataSources] = await Promise.all([
      Insight.count({
        where: {
          createdAt: {
            [Op.between]: [previousStartDate, startDate],
          },
        },
      }),
      DataSource.count({
        where: {
          createdAt: {
            [Op.between]: [previousStartDate, startDate],
          },
        },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const insightChange = calculateChange(currentInsights, previousInsights);
    const dataSourceChange = calculateChange(
      currentDataSources,
      previousDataSources
    );

    // Get time-series data for insights created
    const insightTimeSeries = await getTimeSeriesData(
      Insight,
      "createdAt",
      startDate,
      endDate,
      "day"
    );

    // Get distribution of insight categories
    const insightCategories = await Insight.findAll({
      attributes: [
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["category"],
      raw: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        metrics: [
          {
            id: "total_insights",
            title: "Total Insights",
            value: currentInsights,
            change: insightChange,
            trend: insightTimeSeries,
          },
          {
            id: "data_sources",
            title: "Data Sources",
            value: currentDataSources,
            change: dataSourceChange,
          },
        ],
        distributions: {
          insightCategories,
        },
        timeSeries: {
          insights: insightTimeSeries,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get time-series data for a model
async function getTimeSeriesData(
  Model,
  dateField,
  startDate,
  endDate,
  interval = "day"
) {
  // Create date intervals
  const intervals = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    intervals.push(new Date(current));

    // Increment based on interval
    switch (interval) {
      case "hour":
        current = new Date(current.setHours(current.getHours() + 1));
        break;
      case "day":
        current = new Date(current.setDate(current.getDate() + 1));
        break;
      case "week":
        current = new Date(current.setDate(current.getDate() + 7));
        break;
      case "month":
        current = new Date(current.setMonth(current.getMonth() + 1));
        break;
      default:
        current = new Date(current.setDate(current.getDate() + 1));
    }
  }

  // Get counts for each interval
  const results = await Promise.all(
    intervals.map(async (date, index) => {
      const nextDate =
        index < intervals.length - 1
          ? intervals[index + 1]
          : new Date(endDate.getTime() + 1); // Add 1ms to include the end date

      const count = await Model.count({
        where: {
          [dateField]: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
      });

      return {
        date: formatDate(date, interval),
        value: count,
      };
    })
  );

  return results;
}

// Format date based on interval
function formatDate(date, interval) {
  switch (interval) {
    case "hour":
      return date.toISOString().slice(0, 13) + ":00";
    case "day":
      return date.toISOString().slice(0, 10);
    case "week":
      return `Week of ${date.toISOString().slice(0, 10)}`;
    case "month":
      return date.toISOString().slice(0, 7);
    default:
      return date.toISOString().slice(0, 10);
  }
}
