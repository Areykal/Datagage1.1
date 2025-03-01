const bcrypt = require("bcrypt");
const { User, DataSource, Insight, Settings } = require("../models");
const { logger } = require("./logger");
const sequelize = require("../config/database");

async function seedDatabase() {
  try {
    logger.info("Starting database seeding...");

    // Create default admin user if no users exist
    const userCount = await User.count();
    if (userCount === 0) {
      logger.info("Creating default admin user...");

      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        status: "active",
        lastLogin: new Date(),
      });

      logger.info("Default admin user created successfully");
    } else {
      logger.info("Users already exist, skipping user creation");
    }

    // Create sample data sources if none exist
    const dataSourceCount = await DataSource.count();
    if (dataSourceCount === 0) {
      logger.info("Creating sample data sources...");

      const sampleDataSources = [
        {
          name: "Sample PostgreSQL",
          type: "postgresql",
          host: "localhost",
          port: 5432,
          database: "sample_db",
          username: "postgres",
          password: "postgres",
          schema: "public",
          description: "Sample PostgreSQL database for demonstration purposes",
          status: "connected",
          lastSync: new Date(),
        },
        {
          name: "Sample MySQL",
          type: "mysql",
          host: "localhost",
          port: 3306,
          database: "sample_db",
          username: "root",
          password: "mysql",
          description: "Sample MySQL database for demonstration purposes",
          status: "connected",
          lastSync: new Date(),
        },
      ];

      await DataSource.bulkCreate(sampleDataSources);
      logger.info("Sample data sources created successfully");
    } else {
      logger.info("Data sources already exist, skipping creation");
    }

    // Create sample insights if none exist
    const insightCount = await Insight.count();
    if (insightCount === 0) {
      logger.info("Creating sample insights...");

      // Get the admin user and data source we just created
      const admin = await User.findOne({
        where: { email: "admin@example.com" },
      });
      const dataSource = await DataSource.findOne();

      if (admin && dataSource) {
        const sampleInsights = [
          {
            title: "Monthly Sales Analysis",
            description:
              "Analysis of monthly sales trends across different product categories",
            category: "sales",
            visualizationType: "line_chart",
            query:
              "SELECT date_trunc('month', order_date) as month, SUM(amount) as sales FROM orders GROUP BY month ORDER BY month",
            queryConfig: {},
            aiPrompt: "Analyze monthly sales trends",
            findings: [
              {
                description: "Sales increased by 15% in Q4 compared to Q3",
                importance: 4,
                confidence: 5,
              },
              {
                description: "December had the highest sales volume",
                importance: 3,
                confidence: 5,
              },
              {
                description: "Electronics category showed the most growth",
                importance: 4,
                confidence: 4,
              },
            ],
            dataSourceId: dataSource.id,
            createdById: admin.id,
            lastRefreshed: new Date(),
            refreshInterval: 60,
            cachedData: {
              rows: [
                { month: "2023-01-01", sales: 125000 },
                { month: "2023-02-01", sales: 130000 },
                { month: "2023-03-01", sales: 145000 },
                { month: "2023-04-01", sales: 135000 },
                { month: "2023-05-01", sales: 150000 },
                { month: "2023-06-01", sales: 160000 },
              ],
              rowCount: 6,
              fields: [
                { name: "month", type: "date" },
                { name: "sales", type: "numeric" },
              ],
            },
          },
          {
            title: "Customer Retention Analysis",
            description:
              "Analysis of customer retention rates by acquisition channel",
            category: "customer",
            visualizationType: "bar_chart",
            query:
              "SELECT acquisition_channel, COUNT(DISTINCT customer_id) as customer_count, AVG(retention_days) as avg_retention FROM customers GROUP BY acquisition_channel ORDER BY avg_retention DESC",
            queryConfig: {},
            aiPrompt: "Analyze customer retention by acquisition channel",
            findings: [
              {
                description:
                  "Organic search has the highest retention rate at 68%",
                importance: 5,
                confidence: 4,
              },
              {
                description:
                  "Social media channels have the lowest retention at 42%",
                importance: 4,
                confidence: 5,
              },
              {
                description:
                  "Email marketing shows improving trends quarter over quarter",
                importance: 3,
                confidence: 3,
              },
            ],
            dataSourceId: dataSource.id,
            createdById: admin.id,
            lastRefreshed: new Date(),
            refreshInterval: 120,
            cachedData: {
              rows: [
                {
                  acquisition_channel: "Organic Search",
                  customer_count: 5420,
                  avg_retention: 185,
                },
                {
                  acquisition_channel: "Email",
                  customer_count: 3250,
                  avg_retention: 156,
                },
                {
                  acquisition_channel: "Referral",
                  customer_count: 2840,
                  avg_retention: 210,
                },
                {
                  acquisition_channel: "Paid Ads",
                  customer_count: 6320,
                  avg_retention: 94,
                },
                {
                  acquisition_channel: "Social Media",
                  customer_count: 4180,
                  avg_retention: 78,
                },
              ],
              rowCount: 5,
              fields: [
                { name: "acquisition_channel", type: "varchar" },
                { name: "customer_count", type: "integer" },
                { name: "avg_retention", type: "numeric" },
              ],
            },
          },
        ];

        await Insight.bulkCreate(sampleInsights);
        logger.info("Sample insights created successfully");
      } else {
        logger.warn(
          "Admin user or data source not found, skipping insight creation"
        );
      }
    } else {
      logger.info("Insights already exist, skipping creation");
    }

    // Create default settings if none exist
    const settingsCount = await Settings.count();
    if (settingsCount === 0) {
      logger.info("Creating default settings...");

      // Get the admin user
      const admin = await User.findOne({
        where: { email: "admin@example.com" },
      });

      if (admin) {
        const defaultSettings = [
          {
            category: "general",
            settings: {
              appName: "Qwen2.5 Data Visualization",
              timezone: "UTC",
              dateFormat: "YYYY-MM-DD",
              defaultLanguage: "en-US",
            },
            lastUpdatedById: admin.id,
          },
          {
            category: "appearance",
            settings: {
              darkMode: true,
              compactMode: false,
              primaryColor: "#1976D2",
              density: "default",
            },
            lastUpdatedById: admin.id,
          },
          {
            category: "qwen",
            settings: {
              apiEndpoint: process.env.QWEN_API_ENDPOINT || "",
              apiKey: process.env.QWEN_API_KEY || "",
              model: process.env.QWEN_MODEL || "Qwen2.5-72B-Instruct",
              temperature: 0.7,
              maxTokens: 2048,
              systemPrompt:
                "You are Qwen2.5, an AI assistant helping to analyze data and generate insights.",
            },
            lastUpdatedById: admin.id,
          },
          {
            category: "notifications",
            settings: {
              emailEnabled: false,
              slackEnabled: false,
              smtpHost: "",
              smtpPort: 587,
              smtpUsername: "",
              smtpPassword: "",
              slackWebhook: "",
              slackChannel: "#notifications",
              events: {
                dataSourceChanged: true,
                insightCreated: true,
                pipelineFailure: true,
                systemUpdates: false,
              },
            },
            lastUpdatedById: admin.id,
          },
        ];

        await Settings.bulkCreate(defaultSettings);
        logger.info("Default settings created successfully");
      } else {
        logger.warn("Admin user not found, skipping settings creation");
      }
    } else {
      logger.info("Settings already exist, skipping creation");
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Database seeding failed:", error);
    throw error;
  }
}

// Export for use in server.js
module.exports = seedDatabase;
