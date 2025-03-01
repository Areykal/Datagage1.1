// src/stores/datasource.js
import { defineStore } from "pinia";
import datasourceService from "../services/datasourceService";

export const useDataSourceStore = defineStore("datasource", {
  state: () => ({
    dataSources: [],
    currentDataSource: null,
    loading: false,
    error: null,
  }),

  getters: {
    getDataSourceById: (state) => (id) => {
      return state.dataSources.find((ds) => ds.id === id);
    },
  },

  actions: {
    async fetchDataSources() {
      this.loading = true;
      try {
        this.dataSources = await datasourceService.getAllDataSources();
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch data sources";
        console.error("Error fetching data sources:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchDataSource(id) {
      this.loading = true;
      try {
        this.currentDataSource = await datasourceService.getDataSource(id);
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to fetch data source";
        console.error(`Error fetching data source with id ${id}:`, error);
      } finally {
        this.loading = false;
      }
    },

    async createDataSource(datasource) {
      this.loading = true;
      try {
        const newDataSource = await datasourceService.createDataSource(
          datasource
        );
        this.dataSources.push(newDataSource);
        this.error = null;
        return newDataSource;
      } catch (error) {
        this.error = error.message || "Failed to create data source";
        console.error("Error creating data source:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateDataSource(id, datasource) {
      this.loading = true;
      try {
        const updatedDataSource = await datasourceService.updateDataSource(
          id,
          datasource
        );
        const index = this.dataSources.findIndex((ds) => ds.id === id);
        if (index !== -1) {
          this.dataSources[index] = updatedDataSource;
        }
        if (this.currentDataSource && this.currentDataSource.id === id) {
          this.currentDataSource = updatedDataSource;
        }
        this.error = null;
        return updatedDataSource;
      } catch (error) {
        this.error = error.message || "Failed to update data source";
        console.error(`Error updating data source with id ${id}:`, error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteDataSource(id) {
      this.loading = true;
      try {
        await datasourceService.deleteDataSource(id);
        this.dataSources = this.dataSources.filter((ds) => ds.id !== id);
        if (this.currentDataSource && this.currentDataSource.id === id) {
          this.currentDataSource = null;
        }
        this.error = null;
      } catch (error) {
        this.error = error.message || "Failed to delete data source";
        console.error(`Error deleting data source with id ${id}:`, error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async testConnection(datasource) {
      this.loading = true;
      try {
        const result = await datasourceService.testConnection(datasource);
        this.error = null;
        return result;
      } catch (error) {
        this.error = error.message || "Connection test failed";
        console.error("Connection test failed:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
