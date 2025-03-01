// src/services/dashboardService.js
import api from "./api";

export default {
  /**
   * Get dashboard summary statistics
   */
  getSummary() {
    return api.get("/dashboard/summary");
  },

  /**
   * Get recent activities
   */
  getRecentActivities() {
    return api.get("/dashboard/activities");
  },

  /**
   * Get key metrics
   */
  getKeyMetrics() {
    return api.get("/dashboard/metrics");
  },
};
