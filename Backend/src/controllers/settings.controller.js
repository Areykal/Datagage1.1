const { Settings } = require("../models");
const { createError } = require("../utils/logger");
const axios = require("axios");

// Get all settings
exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findAll();

    // Group settings by category
    const groupedSettings = settings.reduce((result, setting) => {
      result[setting.category] = setting.settings;
      return result;
    }, {});

    res.status(200).json({
      status: "success",
      data: {
        settings: groupedSettings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get settings by category
exports.getSettingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    // Validate category
    if (!isValidCategory(category)) {
      return next(createError(400, `Invalid settings category: ${category}`));
    }

    // Find settings for the specified category
    const settings = await Settings.findOne({
      where: { category },
    });

    if (!settings) {
      return res.status(200).json({
        status: "success",
        data: {
          settings: getDefaultSettings(category),
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        settings: settings.settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update settings by category
exports.updateSettings = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { settings } = req.body;

    // Validate category
    if (!isValidCategory(category)) {
      return next(createError(400, `Invalid settings category: ${category}`));
    }

    // Validate settings specific to the category
    const validationResult = validateSettings(category, settings);
    if (!validationResult.valid) {
      return next(createError(400, validationResult.message));
    }

    // Find or create settings for the specified category
    let settingsRecord = await Settings.findOne({
      where: { category },
    });

    if (settingsRecord) {
      // Update existing settings
      await settingsRecord.update({
        settings,
        lastUpdatedById: req.user.id,
      });
    } else {
      // Create new settings
      settingsRecord = await Settings.create({
        category,
        settings,
        lastUpdatedById: req.user.id,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        settings: settingsRecord.settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Test connection for integration settings
exports.testConnection = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { settings } = req.body;

    // Validate category
    if (!["qwen", "metabase", "airbyte"].includes(category)) {
      return next(createError(400, "Invalid integration category"));
    }

    // Test connection based on category
    let result;
    switch (category) {
      case "qwen":
        result = await testQwenConnection(settings);
        break;
      case "metabase":
        result = await testMetabaseConnection(settings);
        break;
      case "airbyte":
        result = await testAirbyteConnection(settings);
        break;
      default:
        result = { success: false, message: "Unsupported integration type" };
    }

    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: result.message,
      });
    }

    res.status(200).json({
      status: "success",
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// Test Qwen API connection
async function testQwenConnection(settings) {
  try {
    const { apiEndpoint, apiKey, model } = settings;

    if (!apiEndpoint || !apiKey) {
      return {
        success: false,
        message: "Missing required settings: apiEndpoint and apiKey",
      };
    }

    // Try a simple request to the Qwen API
    const response = await axios.post(
      apiEndpoint,
      {
        model: model || "Qwen2.5-72B-Instruct",
        messages: [
          { role: "system", content: "You are an AI assistant." },
          { role: "user", content: 'Say "Hello World"' },
        ],
        max_tokens: 10,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    return {
      success: true,
      message: "Successfully connected to Qwen API",
      data: {
        model: model || "Qwen2.5-72B-Instruct",
        response: response.data.choices[0].message.content,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Qwen API: ${error.message}`,
    };
  }
}

// Test Metabase connection
async function testMetabaseConnection(settings) {
  try {
    const { url, username, password } = settings;

    if (!url || !username || !password) {
      return {
        success: false,
        message: "Missing required settings: url, username, and password",
      };
    }

    // Try to get a session token from Metabase
    const response = await axios.post(
      `${url}/api/session`,
      {
        username,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (!response.data.id) {
      return {
        success: false,
        message: "Failed to authenticate with Metabase",
      };
    }

    return {
      success: true,
      message: "Successfully connected to Metabase",
      data: {
        tokenExists: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Metabase: ${error.message}`,
    };
  }
}

// Test Airbyte connection
async function testAirbyteConnection(settings) {
  try {
    const { url, username, password, apiKey } = settings;

    if (!url) {
      return {
        success: false,
        message: "Missing required setting: url",
      };
    }

    // Set up authentication headers
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    // Set up auth object if username and password are provided
    const auth = username && password ? { username, password } : undefined;

    // Try to list workspaces from Airbyte
    const response = await axios.post(
      `${url}/workspaces/list`,
      {},
      {
        headers,
        auth,
        timeout: 5000, // 5 second timeout
      }
    );

    if (!response.data.workspaces) {
      return {
        success: false,
        message: "Failed to get workspaces from Airbyte",
      };
    }

    return {
      success: true,
      message: "Successfully connected to Airbyte",
      data: {
        workspaces: response.data.workspaces.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Airbyte: ${error.message}`,
    };
  }
}

// Validate if category is valid
function isValidCategory(category) {
  return [
    "general",
    "appearance",
    "qwen",
    "metabase",
    "airbyte",
    "notifications",
  ].includes(category);
}

// Validate settings based on category
function validateSettings(category, settings) {
  if (!settings || typeof settings !== "object") {
    return {
      valid: false,
      message: "Settings must be an object",
    };
  }

  switch (category) {
    case "general":
      // Check required general settings
      if (!settings.appName) {
        return {
          valid: false,
          message: "Application name is required",
        };
      }
      break;

    case "qwen":
      // Check required Qwen settings
      if (!settings.apiEndpoint || !settings.apiKey) {
        return {
          valid: false,
          message: "API endpoint and API key are required for Qwen integration",
        };
      }
      break;

    case "metabase":
      // Check required Metabase settings
      if (!settings.url || !settings.username || !settings.password) {
        return {
          valid: false,
          message:
            "URL, username, and password are required for Metabase integration",
        };
      }
      break;

    case "airbyte":
      // Check required Airbyte settings
      if (!settings.url) {
        return {
          valid: false,
          message: "URL is required for Airbyte integration",
        };
      }
      break;

    case "notifications":
      // Check notification settings format
      if (settings.emailEnabled && (!settings.smtpHost || !settings.smtpPort)) {
        return {
          valid: false,
          message:
            "SMTP host and port are required when email notifications are enabled",
        };
      }
      if (settings.slackEnabled && !settings.slackWebhook) {
        return {
          valid: false,
          message:
            "Slack webhook URL is required when Slack notifications are enabled",
        };
      }
      break;

    default:
      // No specific validation for other categories
      break;
  }

  return { valid: true };
}

// Get default settings for a category
function getDefaultSettings(category) {
  switch (category) {
    case "general":
      return {
        appName: "Qwen2.5 Data Visualization",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        defaultLanguage: "en-US",
      };

    case "appearance":
      return {
        darkMode: true,
        compactMode: false,
        primaryColor: "#1976D2",
        density: "default",
      };

    case "qwen":
      return {
        apiEndpoint: process.env.QWEN_API_ENDPOINT || "",
        apiKey: "",
        model: process.env.QWEN_MODEL || "Qwen2.5-72B-Instruct",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt:
          "You are Qwen2.5, an AI assistant helping to analyze data and generate insights.",
      };

    case "metabase":
      return {
        url: process.env.METABASE_URL || "",
        username: process.env.METABASE_USERNAME || "",
        password: "",
        sessionToken: "",
      };

    case "airbyte":
      return {
        url: process.env.AIRBYTE_URL || "",
        username: process.env.AIRBYTE_USERNAME || "",
        password: "",
        apiKey: "",
        workspaceId: "",
      };

    case "notifications":
      return {
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
      };

    default:
      return {};
  }
}
