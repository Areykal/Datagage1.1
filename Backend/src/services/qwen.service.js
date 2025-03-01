const axios = require("axios");
const { logger } = require("../utils/logger");

// Configuration for Qwen API
const qwenConfig = {
  apiEndpoint: process.env.QWEN_API_ENDPOINT,
  apiKey: process.env.QWEN_API_KEY,
  model: process.env.QWEN_MODEL || "Qwen2.5-72B-Instruct",
  defaultTemperature: 0.7,
  defaultMaxTokens: 2048,
};

// Create Qwen API client
const qwenClient = axios.create({
  baseURL: qwenConfig.apiEndpoint,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${qwenConfig.apiKey}`,
  },
});

/**
 * Generate data insights using Qwen AI
 *
 * @param {Object} params - Parameters for insight generation
 * @param {Object} params.data - Data to analyze
 * @param {String} params.prompt - User prompt for analysis
 * @param {String} params.dataType - Type of data (e.g., 'tabular', 'time_series')
 * @param {Object} params.config - Additional configuration
 * @returns {Promise<Object>} Generated insights
 */
exports.generateInsights = async (params) => {
  try {
    const { data, prompt, dataType, config = {} } = params;

    // Skip if Qwen integration is disabled or not configured
    if (!qwenConfig.apiEndpoint || !qwenConfig.apiKey) {
      return {
        success: false,
        message: "Qwen AI integration is not configured",
      };
    }

    // Construct system message based on data type and configuration
    const systemMessage = constructSystemMessage(dataType, config);

    // Prepare data and prompt for analysis
    const preparedData = prepareData(data, dataType);
    const userPrompt = constructUserPrompt(preparedData, prompt, dataType);

    // Call Qwen API
    const response = await qwenClient.post("", {
      model: config.model || qwenConfig.model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: config.temperature || qwenConfig.defaultTemperature,
      max_tokens: config.maxTokens || qwenConfig.defaultMaxTokens,
    });

    // Parse and structure insights from response
    const rawInsights = response.data.choices[0].message.content;
    const structuredInsights = parseInsights(rawInsights, dataType);

    return {
      success: true,
      insights: structuredInsights,
      rawResponse: rawInsights,
    };
  } catch (error) {
    logger.error("Error generating insights with Qwen AI:", error);
    return {
      success: false,
      message: `Failed to generate insights: ${error.message}`,
    };
  }
};

/**
 * Generate visualization recommendations
 *
 * @param {Object} params - Parameters for visualization recommendation
 * @param {Object} params.data - Sample data to visualize
 * @param {String} params.goal - User's goal for visualization
 * @param {String} params.dataType - Type of data
 * @returns {Promise<Object>} Visualization recommendations
 */
exports.recommendVisualization = async (params) => {
  try {
    const { data, goal, dataType } = params;

    // Skip if Qwen integration is disabled or not configured
    if (!qwenConfig.apiEndpoint || !qwenConfig.apiKey) {
      return {
        success: false,
        message: "Qwen AI integration is not configured",
      };
    }

    // Prepare system message for visualization recommendation
    const systemMessage = `
      You are a data visualization expert. Your task is to recommend the most appropriate 
      visualization type based on the provided data and user's goal. Analyze the data structure, 
      the variables present, and the user's intent to provide a thoughtful recommendation.
      
      Respond with a JSON object containing:
      1. recommendedType: The primary visualization recommended
      2. alternativeTypes: Array of 1-3 alternative visualization types
      3. rationale: Explanation of why the primary recommendation is appropriate
      4. configuration: Suggested configuration for the visualization (colors, axes, etc.)
    `;

    // Prepare user prompt
    const userPrompt = `
      I need a visualization recommendation for the following data:
      
      Data Sample: ${JSON.stringify(data.slice(0, 5))}
      
      Data Type: ${dataType}
      Visualization Goal: ${goal}
      
      Please provide your expert recommendation on the best way to visualize this data.
    `;

    // Call Qwen API
    const response = await qwenClient.post("", {
      model: qwenConfig.model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent recommendations
      max_tokens: 1000,
    });

    // Parse recommendations
    const rawRecommendation = response.data.choices[0].message.content;
    const structuredRecommendation = JSON.parse(rawRecommendation);

    return {
      success: true,
      recommendation: structuredRecommendation,
    };
  } catch (error) {
    logger.error(
      "Error generating visualization recommendations with Qwen AI:",
      error
    );
    return {
      success: false,
      message: `Failed to generate visualization recommendations: ${error.message}`,
    };
  }
};

/**
 * Generate SQL query based on natural language description
 *
 * @param {Object} params - Parameters for SQL generation
 * @param {Object} params.schemaInfo - Database schema information
 * @param {String} params.prompt - User's natural language query
 * @param {String} params.databaseType - Type of database (e.g., 'postgresql', 'mysql')
 * @returns {Promise<Object>} Generated SQL query
 */
exports.generateSQLQuery = async (params) => {
  try {
    const { schemaInfo, prompt, databaseType } = params;

    // Skip if Qwen integration is disabled or not configured
    if (!qwenConfig.apiEndpoint || !qwenConfig.apiKey) {
      return {
        success: false,
        message: "Qwen AI integration is not configured",
      };
    }

    // Prepare system message for SQL generation
    const systemMessage = `
      You are an expert SQL developer. Your task is to generate a SQL query based on the 
      user's natural language description and the provided database schema.
      
      The database type is: ${databaseType}
      
      The schema information is as follows:
      ${JSON.stringify(schemaInfo, null, 2)}
      
      Generate only the SQL query without explanation. Ensure it's valid for the specified database type.
      If the query is complex, add comments to explain the approach.
    `;

    // Call Qwen API
    const response = await qwenClient.post("", {
      model: qwenConfig.model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      temperature: 0.1, // Very low temperature for precise SQL generation
      max_tokens: 1000,
    });

    // Extract SQL query
    const sqlQuery = response.data.choices[0].message.content.trim();

    return {
      success: true,
      query: sqlQuery,
    };
  } catch (error) {
    logger.error("Error generating SQL query with Qwen AI:", error);
    return {
      success: false,
      message: `Failed to generate SQL query: ${error.message}`,
    };
  }
};

/**
 * Construct system message based on data type and configuration
 *
 * @param {String} dataType - Type of data
 * @param {Object} config - Additional configuration
 * @returns {String} System message
 */
function constructSystemMessage(dataType, config) {
  const baseMessage = `
    You are an expert data analyst using Qwen2.5-72B-Instruct AI to analyze data and provide insights.
    Your task is to analyze the provided data and extract meaningful insights based on the user's prompt.
    
    Respond with a JSON object containing:
    1. title: A concise title for the analysis
    2. summary: A brief summary of the key findings
    3. insights: An array of specific insights, each with:
       - description: The insight in plain language
       - importance: A rating from 1-5 of how important/significant this insight is
       - confidence: A rating from 1-5 of your confidence in this insight
    4. recommendations: Suggested actions based on the insights
    5. visualizationSuggestions: Recommended ways to visualize the insights
  `;

  // Add data type specific guidance
  let additionalGuidance = "";

  switch (dataType) {
    case "tabular":
      additionalGuidance = `
        For tabular data, focus on:
        - Identifying patterns and outliers in the dataset
        - Analyzing relationships between different columns
        - Calculating summary statistics and their significance
        - Segmenting the data to reveal hidden insights
      `;
      break;

    case "time_series":
      additionalGuidance = `
        For time series data, focus on:
        - Identifying trends, seasonality, and cyclical patterns
        - Detecting anomalies and change points
        - Forecasting future values if appropriate
        - Comparing different time periods
      `;
      break;

    case "categorical":
      additionalGuidance = `
        For categorical data, focus on:
        - Distribution analysis and frequency counting
        - Correlation between different categories
        - Identifying significant over/under-representation
        - Grouping and classification patterns
      `;
      break;

    default:
      additionalGuidance = `
        Analyze the data comprehensively, looking for:
        - Key patterns, trends, and anomalies
        - Correlations and potential causal relationships
        - Meaningful segments and groupings
        - Actionable insights for decision making
      `;
  }

  return `${baseMessage}\n\n${additionalGuidance}`;
}

/**
 * Prepare data for analysis based on data type
 *
 * @param {Object} data - Raw data
 * @param {String} dataType - Type of data
 * @returns {String} Prepared data as string
 */
function prepareData(data, dataType) {
  // For large datasets, sample or summarize
  let processedData = data;

  if (Array.isArray(data) && data.length > 50) {
    // Take a representative sample
    processedData = data.slice(0, 50);
  }

  return JSON.stringify(processedData, null, 2);
}

/**
 * Construct user prompt based on data, user prompt, and data type
 *
 * @param {String} data - Prepared data as string
 * @param {String} userPrompt - User's prompt
 * @param {String} dataType - Type of data
 * @returns {String} Constructed user prompt
 */
function constructUserPrompt(data, userPrompt, dataType) {
  return `
    Data Type: ${dataType}
    
    Analysis Request: ${userPrompt}
    
    Data:
    ${data}
    
    Please analyze this data and provide insights based on my request.
  `;
}

/**
 * Parse insights from raw response
 *
 * @param {String} rawInsights - Raw insights from Qwen
 * @param {String} dataType - Type of data
 * @returns {Object} Structured insights
 */
function parseInsights(rawInsights, dataType) {
  try {
    // Try to parse as JSON
    return JSON.parse(rawInsights);
  } catch (error) {
    // If not valid JSON, try to extract structured information
    logger.warn(
      "Failed to parse insights as JSON, attempting structured extraction"
    );

    const structuredInsights = {
      title: extractTitle(rawInsights),
      summary: extractSummary(rawInsights),
      insights: extractInsightsList(rawInsights),
      recommendations: extractRecommendations(rawInsights),
      visualizationSuggestions: extractVisualizationSuggestions(rawInsights),
    };

    return structuredInsights;
  }
}

/**
 * Extract title from raw text
 *
 * @param {String} text - Raw text
 * @returns {String} Extracted title
 */
function extractTitle(text) {
  const titleMatch = text.match(/(?:^|\n)#\s+(.*?)(?:\n|$)/);
  if (titleMatch) return titleMatch[1].trim();

  const titleLines = text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, 2);
  return titleLines.length > 0
    ? titleLines[0].trim()
    : "Data Analysis Insights";
}

/**
 * Extract summary from raw text
 *
 * @param {String} text - Raw text
 * @returns {String} Extracted summary
 */
function extractSummary(text) {
  const summaryMatch = text.match(
    /(?:Summary|Key Findings)[:]\s*([\s\S]*?)(?:\n\n|\n#)/i
  );
  return summaryMatch ? summaryMatch[1].trim() : "";
}

/**
 * Extract insights list from raw text
 *
 * @param {String} text - Raw text
 * @returns {Array} List of insights
 */
function extractInsightsList(text) {
  const insightsSection = text.match(
    /(?:Insights|Key Insights|Findings)[:]([\s\S]*?)(?:\n\n|\n#|Recommendations:)/i
  );

  if (!insightsSection) return [];

  const insightItems = insightsSection[1]
    .split(/\n\s*[-*]\s+/)
    .filter((item) => item.trim().length > 0);

  return insightItems.map((item) => ({
    description: item.trim(),
    importance: estimateImportance(item),
    confidence: estimateConfidence(item),
  }));
}

/**
 * Estimate importance from insight text
 *
 * @param {String} text - Insight text
 * @returns {Number} Importance score (1-5)
 */
function estimateImportance(text) {
  const importanceIndicators = [
    "significant",
    "critical",
    "important",
    "major",
    "key",
    "crucial",
    "essential",
    "substantial",
    "considerable",
    "remarkable",
    "notable",
  ];

  const textLower = text.toLowerCase();
  let score = 3; // Default medium importance

  // Adjust score based on language
  importanceIndicators.forEach((indicator) => {
    if (textLower.includes(indicator)) score++;
  });

  return Math.min(Math.max(score, 1), 5); // Ensure score is between 1-5
}

/**
 * Estimate confidence from insight text
 *
 * @param {String} text - Insight text
 * @returns {Number} Confidence score (1-5)
 */
function estimateConfidence(text) {
  const confidenceIndicators = {
    high: [
      "clearly",
      "definitely",
      "certainly",
      "undoubtedly",
      "always",
      "every",
      "all",
      "100%",
      "absolutely",
    ],
    medium: [
      "likely",
      "probably",
      "often",
      "generally",
      "tends to",
      "typically",
      "usually",
    ],
    low: [
      "possibly",
      "perhaps",
      "might",
      "may",
      "could",
      "sometimes",
      "occasional",
      "uncertain",
      "unclear",
    ],
  };

  const textLower = text.toLowerCase();
  let score = 3; // Default medium confidence

  // Check for high confidence indicators
  confidenceIndicators.high.forEach((indicator) => {
    if (textLower.includes(indicator)) score++;
  });

  // Check for low confidence indicators
  confidenceIndicators.low.forEach((indicator) => {
    if (textLower.includes(indicator)) score--;
  });

  return Math.min(Math.max(score, 1), 5); // Ensure score is between 1-5
}

/**
 * Extract recommendations from raw text
 *
 * @param {String} text - Raw text
 * @returns {Array} List of recommendations
 */
function extractRecommendations(text) {
  const recommendationsSection = text.match(
    /(?:Recommendations|Suggested Actions)[:]([\s\S]*?)(?:\n\n|\n#|Visualization|$)/i
  );

  if (!recommendationsSection) return [];

  const recommendationItems = recommendationsSection[1]
    .split(/\n\s*[-*]\s+/)
    .filter((item) => item.trim().length > 0);

  return recommendationItems.map((item) => item.trim());
}

/**
 * Extract visualization suggestions from raw text
 *
 * @param {String} text - Raw text
 * @returns {Array} List of visualization suggestions
 */
function extractVisualizationSuggestions(text) {
  const visualizationSection = text.match(
    /(?:Visualization|Chart|Graph|Plot)(?:\s+Suggestions|s|\s+Recommendations)?[:]([\s\S]*?)(?:\n\n|\n#|$)/i
  );

  if (!visualizationSection) return [];

  const visualizationItems = visualizationSection[1]
    .split(/\n\s*[-*]\s+/)
    .filter((item) => item.trim().length > 0);

  return visualizationItems.map((item) => item.trim());
}
