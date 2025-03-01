const { Insight, DataSource, User } = require("../models");
const { createError, logger } = require("../utils/logger");
const { executeQuery, getSchemaInfo } = require("../services/database.service");
const {
  generateInsights,
  recommendVisualization,
  generateSQLQuery,
} = require("../services/qwen.service");
const {
  createMetabaseCard,
  updateMetabaseCard,
  deleteMetabaseCard,
  createMetabaseDashboard,
  addCardToDashboard,
} = require("../services/metabase.service");

// Get all insights
exports.getAllInsights = async (req, res, next) => {
  try {
    // Get query parameters
    const {
      category,
      limit = 50,
      offset = 0,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build filter conditions
    const where = {};
    if (category) {
      where.category = category;
    }

    // Get insights with related data
    const insights = await Insight.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]],
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

    // Get total count for pagination
    const totalCount = await Insight.count({ where });

    res.status(200).json({
      status: "success",
      results: insights.length,
      total: totalCount,
      data: {
        insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific insight
exports.getInsight = async (req, res, next) => {
  try {
    const insight = await Insight.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: DataSource,
          as: "dataSource",
        },
      ],
    });

    if (!insight) {
      return next(createError(404, "Insight not found"));
    }

    res.status(200).json({
      status: "success",
      data: {
        insight,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new insight
exports.createInsight = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      visualizationType,
      query,
      queryConfig,
      aiPrompt,
      findings,
      dataSourceId,
      refreshInterval,
    } = req.body;

    // Check if data source exists
    const dataSource = await DataSource.findByPk(dataSourceId);
    if (!dataSource) {
      return next(createError(404, "Data source not found"));
    }

    // Create insight
    const newInsight = await Insight.create({
      title,
      description,
      category,
      visualizationType,
      query,
      queryConfig: queryConfig || {},
      aiPrompt,
      findings: findings || [],
      dataSourceId,
      createdById: req.user.id,
      refreshInterval: refreshInterval || 60,
      lastRefreshed: new Date(),
    });

    // If query is provided, execute it to cache the data
    if (query) {
      try {
        const queryResult = await executeQuery(dataSource, query);

        // Store the cached data
        await newInsight.update({
          cachedData: queryResult,
        });

        // Create visualization in Metabase if integration is enabled
        if (dataSource.metabaseId && process.env.METABASE_URL) {
          try {
            // Create a card in Metabase
            const metabaseResult = await createMetabaseCard(
              title,
              description,
              dataSource.metabaseId,
              query,
              mapVisualizationType(visualizationType),
              createVisualizationSettings(visualizationType, queryResult)
            );

            if (metabaseResult.success) {
              // Create a dashboard if this is our first card
              let dashboardId = null;

              if (!metabaseResult.dashboardId) {
                const dashboardResult = await createMetabaseDashboard(
                  "Qwen2.5 AI Insights",
                  "Insights generated using Qwen2.5 AI"
                );

                if (dashboardResult.success) {
                  dashboardId = dashboardResult.dashboardId;
                }
              }

              // Add card to dashboard
              if (dashboardId && metabaseResult.cardId) {
                await addCardToDashboard(dashboardId, metabaseResult.cardId);
              }

              // Update insight with Metabase info
              await newInsight.update({
                metabaseDashboardId: dashboardId,
                metabaseCardId: metabaseResult.cardId,
              });
            }
          } catch (error) {
            logger.warn("Failed to create Metabase visualization:", error);
            // Continue even if Metabase integration fails
          }
        }
      } catch (error) {
        logger.warn("Failed to execute query for caching:", error);
        // Continue even if query execution fails
      }
    }

    // Get the insight with related data
    const insight = await Insight.findByPk(newInsight.id, {
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

    res.status(201).json({
      status: "success",
      data: {
        insight,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update an insight
exports.updateInsight = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      visualizationType,
      query,
      queryConfig,
      aiPrompt,
      findings,
      refreshInterval,
    } = req.body;

    // Find the insight
    const insight = await Insight.findByPk(req.params.id);
    if (!insight) {
      return next(createError(404, "Insight not found"));
    }

    // Check if the user has permission to update
    // Only allow creator or admin users to update
    if (insight.createdById !== req.user.id && req.user.role !== "admin") {
      return next(
        createError(403, "You do not have permission to update this insight")
      );
    }

    // Prepare update data
    const updateData = {
      title: title || insight.title,
      description:
        description !== undefined ? description : insight.description,
      category: category || insight.category,
      visualizationType: visualizationType || insight.visualizationType,
      aiPrompt: aiPrompt !== undefined ? aiPrompt : insight.aiPrompt,
      findings: findings || insight.findings,
      refreshInterval: refreshInterval || insight.refreshInterval,
    };

    // Update query and queryConfig only if provided
    if (query) {
      updateData.query = query;
    }

    if (queryConfig) {
      updateData.queryConfig = queryConfig;
    }

    // Update the insight
    await insight.update(updateData);

    // If query changed, execute it to refresh cache
    if (query && query !== insight.query) {
      try {
        // Get data source
        const dataSource = await DataSource.findByPk(insight.dataSourceId);
        if (dataSource) {
          // Execute query
          const queryResult = await executeQuery(dataSource, query);

          // Update cached data
          await insight.update({
            cachedData: queryResult,
            lastRefreshed: new Date(),
          });

          // Update Metabase card if exists
          if (
            insight.metabaseCardId &&
            dataSource.metabaseId &&
            process.env.METABASE_URL
          ) {
            try {
              await updateMetabaseCard(insight.metabaseCardId, {
                name: title || insight.title,
                description:
                  description !== undefined ? description : insight.description,
                dataset_query: {
                  type: "native",
                  native: {
                    query,
                    template_tags: {},
                  },
                  database: dataSource.metabaseId,
                },
                display: mapVisualizationType(
                  visualizationType || insight.visualizationType
                ),
                visualization_settings: createVisualizationSettings(
                  visualizationType || insight.visualizationType,
                  queryResult
                ),
              });
            } catch (error) {
              logger.warn("Failed to update Metabase card:", error);
            }
          }
        }
      } catch (error) {
        logger.warn("Failed to execute updated query for caching:", error);
      }
    }

    // Get the updated insight with related data
    const updatedInsight = await Insight.findByPk(insight.id, {
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

    res.status(200).json({
      status: "success",
      data: {
        insight: updatedInsight,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete an insight
exports.deleteInsight = async (req, res, next) => {
  try {
    const insight = await Insight.findByPk(req.params.id);
    if (!insight) {
      return next(createError(404, "Insight not found"));
    }

    // Check if the user has permission to delete
    // Only allow creator or admin users to delete
    if (insight.createdById !== req.user.id && req.user.role !== "admin") {
      return next(
        createError(403, "You do not have permission to delete this insight")
      );
    }

    // Delete Metabase card if exists
    if (insight.metabaseCardId && process.env.METABASE_URL) {
      try {
        await deleteMetabaseCard(insight.metabaseCardId);
      } catch (error) {
        logger.warn("Failed to delete Metabase card:", error);
      }
    }

    // Delete the insight
    await insight.destroy();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Generate an insight using Qwen
exports.generateInsight = async (req, res, next) => {
  try {
    const {
      dataSourceId,
      table,
      title,
      description,
      category,
      visualizationType,
      prompt,
    } = req.body;

    // Check if data source exists
    const dataSource = await DataSource.findByPk(dataSourceId);
    if (!dataSource) {
      return next(createError(404, "Data source not found"));
    }

    // Get schema information for the data source
    const schemaInfo = await getSchemaInfo(dataSource);

    // Generate SQL query based on prompt and schema
    const sqlResult = await generateSQLQuery({
      schemaInfo,
      prompt,
      databaseType: dataSource.type,
    });

    if (!sqlResult.success) {
      return next(
        createError(500, `Failed to generate SQL query: ${sqlResult.message}`)
      );
    }

    // Execute the generated query
    let queryResult;
    try {
      queryResult = await executeQuery(dataSource, sqlResult.query);
    } catch (error) {
      return next(
        createError(500, `Failed to execute generated query: ${error.message}`)
      );
    }

    // Generate insights from the query results
    const insightResult = await generateInsights({
      data: queryResult.rows,
      prompt,
      dataType: "tabular", // Assuming tabular data for SQL results
    });

    if (!insightResult.success) {
      return next(
        createError(
          500,
          `Failed to generate insights: ${insightResult.message}`
        )
      );
    }

    // Recommend visualization if not specified
    let visType = visualizationType;
    if (!visType) {
      const vizResult = await recommendVisualization({
        data: queryResult.rows.slice(0, 10), // Sample of data
        goal: prompt,
        dataType: "tabular",
      });

      if (vizResult.success) {
        visType = vizResult.recommendation.recommendedType;
      } else {
        visType = "table"; // Default to table if recommendation fails
      }
    }

    // Prepare the response
    const generatedInsight = {
      title: title || insightResult.insights.title || "Generated Insight",
      description: description || insightResult.insights.summary || "",
      category: category || "sales", // Default category
      visualizationType: visType,
      query: sqlResult.query,
      queryConfig: {},
      aiPrompt: prompt,
      findings: insightResult.insights.insights || [],
      dataSourceId,
      sampleData: queryResult.rows.slice(0, 10), // Return a sample of data
      visualizationSuggestions:
        insightResult.insights.visualizationSuggestions || [],
      recommendations: insightResult.insights.recommendations || [],
    };

    res.status(200).json({
      status: "success",
      data: {
        insight: generatedInsight,
      },
    });
  } catch (error) {
    logger.error("Error generating insight:", error);
    next(error);
  }
};

// Get visualization data for an insight
exports.getVisualizationData = async (req, res, next) => {
  try {
    const insight = await Insight.findByPk(req.params.id);

    if (!insight) {
      return next(createError(404, "Insight not found"));
    }

    // If we have cached data and it's not expired, return it
    const cacheAge =
      (new Date() - new Date(insight.lastRefreshed)) / (60 * 1000); // Age in minutes
    if (insight.cachedData && cacheAge < insight.refreshInterval) {
      return res.status(200).json({
        status: "success",
        data: {
          visualizationData: insight.cachedData,
          cached: true,
          lastRefreshed: insight.lastRefreshed,
        },
      });
    }

    // Otherwise, execute the query to get fresh data
    const dataSource = await DataSource.findByPk(insight.dataSourceId);

    if (!dataSource) {
      return next(createError(404, "Data source for this insight not found"));
    }

    // Execute the query
    const queryResult = await executeQuery(dataSource, insight.query);

    // Update cached data
    await insight.update({
      cachedData: queryResult,
      lastRefreshed: new Date(),
    });

    res.status(200).json({
      status: "success",
      data: {
        visualizationData: queryResult,
        cached: false,
        lastRefreshed: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to map visualization type to Metabase display type
function mapVisualizationType(visualizationType) {
  const mapping = {
    bar_chart: "bar",
    line_chart: "line",
    pie_chart: "pie",
    scatter_plot: "scatter",
    heatmap: "map",
    combined_chart: "combo",
    table: "table",
    kpi_dashboard: "scalar",
  };

  return mapping[visualizationType] || "table";
}

// Helper function to create visualization settings for Metabase
function createVisualizationSettings(visualizationType, queryResult) {
  // Default settings
  const settings = {
    "graph.dimensions": [],
    "graph.metrics": [],
  };

  // If we have field data, use it to configure visualization
  if (queryResult && queryResult.fields && queryResult.fields.length > 0) {
    const fields = queryResult.fields;

    switch (visualizationType) {
      case "bar_chart":
        if (fields.length >= 2) {
          settings["graph.dimensions"] = [fields[0].name];
          settings["graph.metrics"] = [fields[1].name];
        }
        break;

      case "line_chart":
        if (fields.length >= 2) {
          settings["graph.dimensions"] = [fields[0].name];
          settings["graph.metrics"] = [fields[1].name];
          settings["graph.x_axis.scale"] = "timeseries";
        }
        break;

      case "pie_chart":
        if (fields.length >= 2) {
          settings["graph.dimensions"] = [fields[0].name];
          settings["graph.metrics"] = [fields[1].name];
        }
        break;

      case "scatter_plot":
        if (fields.length >= 3) {
          settings["graph.dimensions"] = [fields[0].name];
          settings["graph.metrics"] = [fields[1].name, fields[2].name];
        }
        break;

      default:
        // For other types, just use default settings
        break;
    }
  }

  return settings;
}
