<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          Dashboard
        </h1>
      </v-col>
    </v-row>

    <!-- Loading state -->
    <v-row v-if="loading">
      <v-col
        cols="12"
        class="text-center"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        />
      </v-col>
    </v-row>

    <!-- Error state -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert
          type="error"
          title="Error"
          :text="error"
        />
      </v-col>
    </v-row>

    <template v-else>
      <!-- Summary Metrics -->
      <v-row>
        <v-col
          v-for="(metric, index) in summaryMetrics"
          :key="index"
          cols="12"
          sm="6"
          md="3"
        >
          <v-card
            elevation="2"
            class="h-100"
          >
            <v-card-text>
              <div class="d-flex flex-column align-center">
                <div class="text-overline text-center">
                  {{ metric.title }}
                </div>
                <div class="text-h4 text-center font-weight-bold">
                  {{ metric.value }}
                </div>
                <div class="d-flex align-center mt-2">
                  <v-icon
                    :color="metric.trend > 0 ? 'success' : 'error'"
                    size="small"
                  >
                    {{ metric.trend > 0 ? "mdi-arrow-up" : "mdi-arrow-down" }}
                  </v-icon>
                  <span
                    :class="metric.trend > 0 ? 'text-success' : 'text-error'"
                    class="ml-1"
                  >
                    {{ Math.abs(metric.trend) }}% since last month
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts Row -->
      <v-row class="mt-6">
        <v-col
          cols="12"
          md="8"
        >
          <v-card
            elevation="2"
            height="100%"
          >
            <v-card-title class="text-subtitle-1">
              Data Processing Performance
              <v-spacer />
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon
                    v-bind="props"
                  >
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item
                    title="Last 7 days"
                    value="7d"
                  />
                  <v-list-item
                    title="Last 30 days"
                    value="30d"
                  />
                  <v-list-item
                    title="Last 90 days"
                    value="90d"
                  />
                </v-list>
              </v-menu>
            </v-card-title>

            <v-card-text
              class="d-flex justify-center align-center"
              style="height: 300px"
            >
              <div class="text-center">
                <v-icon
                  size="large"
                  color="primary"
                >
                  mdi-chart-line
                </v-icon>
                <div class="text-body-1 mt-2">
                  Performance Chart will appear here
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card
            elevation="2"
            height="100%"
          >
            <v-card-title class="text-subtitle-1">
              Data Sources Distribution
            </v-card-title>

            <v-card-text
              class="d-flex justify-center align-center"
              style="height: 300px"
            >
              <div class="text-center">
                <v-icon
                  size="large"
                  color="primary"
                >
                  mdi-chart-pie
                </v-icon>
                <div class="text-body-1 mt-2">
                  Pie Chart will appear here
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Activities -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-subtitle-1">
              Recent Activities
              <v-spacer />
              <v-btn
                size="small"
                prepend-icon="mdi-refresh"
              >
                Refresh
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Activity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(activity, index) in recentActivities"
                    :key="index"
                  >
                    <td>{{ activity.time }}</td>
                    <td>{{ activity.description }}</td>
                    <td>
                      <v-chip
                        :color="getStatusColor(activity.status)"
                        size="small"
                        text-color="white"
                      >
                        {{ activity.status }}
                      </v-chip>
                    </td>
                    <td>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useDashboardStore } from "../stores/dashboard";

const dashboardStore = useDashboardStore();

// Computed properties
const loading = computed(() => dashboardStore.loading);
const error = computed(() => dashboardStore.error);

// Sample data (will be replaced with real data from API)
const summaryMetrics = ref([
  { title: "Total Data Sources", value: "24", trend: 8.5 },
  { title: "Active Pipelines", value: "16", trend: 12.3 },
  { title: "Total Insights", value: "87", trend: 5.7 },
  { title: "Avg. Processing Time", value: "4.2s", trend: -3.1 },
]);

const recentActivities = ref([
  {
    time: "2024-02-28 09:45",
    description: 'Data source "Sales DB" updated',
    status: "Completed",
    user: "admin",
  },
  {
    time: "2024-02-28 09:30",
    description: 'New insight "Customer Churn Analysis" created',
    status: "Completed",
    user: "analyst",
  },
  {
    time: "2024-02-28 09:15",
    description: 'Pipeline "Marketing Data" sync',
    status: "Running",
    user: "system",
  },
  {
    time: "2024-02-28 08:55",
    description: 'Data source "User Analytics" connection test',
    status: "Failed",
    user: "developer",
  },
  {
    time: "2024-02-28 08:30",
    description: 'New dashboard "Executive Overview" created',
    status: "Completed",
    user: "manager",
  },
]);

// Utility functions
const getStatusColor = (status) => {
  const colors = {
    Completed: "success",
    Running: "info",
    Failed: "error",
    Pending: "warning",
  };
  return colors[status] || "primary";
};

// Fetch data on component mount
onMounted(async () => {
  try {
    await dashboardStore.fetchAllDashboardData();

    // This is for demo purposes only - in a real application, this data would come from the API
    // summaryMetrics.value = transformMetricsData(dashboardStore.metrics)
    // recentActivities.value = dashboardStore.activities
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
  }
});
</script>
