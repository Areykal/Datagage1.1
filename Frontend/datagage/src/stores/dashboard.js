// src/stores/dashboard.js
import { defineStore } from "pinia";
import dashboardService from "../services/dashboardService";

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    summary: null,
    activities: [],
    metrics: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSummary() {
      this.loading = true;
      try {
        this.summary = await dashboardService.getSummary();
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch summary";
        console.error("Error fetching dashboard summary:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchActivities() {
      this.loading = true;
      try {
        this.activities = await dashboardService.getRecentActivities();
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch activities";
        console.error("Error fetching recent activities:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchMetrics() {
      this.loading = true;
      try {
        this.metrics = await dashboardService.getKeyMetrics();
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch metrics";
        console.error("Error fetching key metrics:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchAllDashboardData() {
      this.loading = true;
      try {
        // Fetch all dashboard data in parallel
        const [summary, activities, metrics] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecentActivities(),
          dashboardService.getKeyMetrics(),
        ]);

        this.summary = summary;
        this.activities = activities;
        this.metrics = metrics;
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch dashboard data";
        console.error("Error fetching dashboard data:", error);
      } finally {
        this.loading = false;
      }
    },
  },
});
