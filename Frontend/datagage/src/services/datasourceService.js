// src/services/datasourceService.js
import api from "./api";

export default {
  /**
   * Get all data sources
   */
  getAllDataSources() {
    return api.get("/datasources");
  },

  /**
   * Get a specific data source by ID
   */
  getDataSource(id) {
    return api.get(`/datasources/${id}`);
  },

  /**
   * Create a new data source
   */
  createDataSource(datasource) {
    return api.post("/datasources", datasource);
  },

  /**
   * Update an existing data source
   */
  updateDataSource(id, datasource) {
    return api.put(`/datasources/${id}`, datasource);
  },

  /**
   * Delete a data source
   */
  deleteDataSource(id) {
    return api.delete(`/datasources/${id}`);
  },

  /**
   * Test a data source connection
   */
  testConnection(datasource) {
    return api.post("/datasources/test", datasource);
  },
};
