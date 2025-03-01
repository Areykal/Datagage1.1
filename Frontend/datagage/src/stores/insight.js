// src/stores/insight.js
import { defineStore } from "pinia";
import insightService from "../services/insightService";

export const useInsightStore = defineStore("insight", {
  state: () => ({
    insights: [],
    currentInsight: null,
    visualizationData: null,
    loading: false,
    generating: false,
    error: null,
  }),

  getters: {
    getInsightById: (state) => (id) => {
      return state.insights.find((insight) => insight.id === id);
    },
  },

  actions: {
    async fetchInsights() {
      this.loading = true;
      try {
        this.insights = await insightService.getAllInsights();
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch insights";
        console.error("Error fetching insights:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchInsight(id) {
      this.loading = true;
      try {
        this.currentInsight = await insightService.getInsight(id);
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch insight";
        console.error(`Error fetching insight with id ${id}:`, error);
      } finally {
        this.loading = false;
      }
    },

    async createInsight(insight) {
      this.loading = true;
      try {
        const newInsight = await insightService.createInsight(insight);
        this.insights.push(newInsight);
        this.error = null;
        return newInsight;
      } catch (error) {
        this.error = error.message || "Failed to create insight";
        console.error("Error creating insight:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateInsight(id, insight) {
      this.loading = true;
      try {
        const updatedInsight = await insightService.updateInsight(id, insight);
        const index = this.insights.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.insights[index] = updatedInsight;
        }
        if (this.currentInsight && this.currentInsight.id === id) {
          this.currentInsight = updatedInsight;
        }
        this.error = null;
        return updatedInsight;
      } catch (error) {
        this.error = error.message || "Failed to update insight";
        console.error(`Error updating insight with id ${id}:`, error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteInsight(id) {
      this.loading = true;
      try {
        await insightService.deleteInsight(id);
        this.insights = this.insights.filter((item) => item.id !== id);
        if (this.currentInsight && this.currentInsight.id === id) {
          this.currentInsight = null;
        }
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to delete insight";
        console.error(`Error deleting insight with id ${id}:`, error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async generateInsight(params) {
      this.generating = true;
      try {
        const generatedInsight = await insightService.generateInsight(params);
        this.error = null;
        return generatedInsight;
      } catch (error) {
        this.error = error.message || "Failed to generate insight";
        console.error("Error generating insight:", error);
        throw error;
      } finally {
        this.generating = false;
      }
    },

    async fetchVisualizationData(id, params) {
      this.loading = true;
      try {
        this.visualizationData = await insightService.getVisualizationData(
          id,
          params
        );
        this.error = null;
        return this.visualizationData;
      } catch (error) {
        this.error = error.message || "Failed to fetch visualization data";
        console.error(
          `Error fetching visualization data for insight ${id}:`,
          error
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
