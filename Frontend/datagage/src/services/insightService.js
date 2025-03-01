// src/services/insightService.js
import api from "./api";

export default {
  /**
   * Get all insights
   */
  getAllInsights() {
    return api.get("/insights");
  },

  /**
   * Get a specific insight by ID
   */
  getInsight(id) {
    return api.get(`/insights/${id}`);
  },

  /**
   * Create a new insight
   */
  createInsight(insight) {
    return api.post("/insights", insight);
  },

  /**
   * Update an existing insight
   */
  updateInsight(id, insight) {
    return api.put(`/insights/${id}`, insight);
  },

  /**
   * Delete an insight
   */
  deleteInsight(id) {
    return api.delete(`/insights/${id}`);
  },

  /**
   * Generate an insight using Qwen2.5
   */
  generateInsight(params) {
    return api.post("/insights/generate", params);
  },

  /**
   * Get data for a specific visualization
   */
  getVisualizationData(id, params) {
    return api.get(`/insights/${id}/data`, { params });
  },
};
