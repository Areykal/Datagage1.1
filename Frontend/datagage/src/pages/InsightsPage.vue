<template>
  <div>
    <v-row class="mb-4">
      <v-col
        cols="12"
        sm="6"
      >
        <h1 class="text-h4">
          Insights
        </h1>
        <p class="text-subtitle-1">
          Qwen2.5-powered data insights and visualizations
        </p>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        class="text-sm-right"
      >
        <v-btn
          color="primary"
          prepend-icon="mdi-lightbulb"
          @click="openGenerateInsightDialog"
        >
          Generate New Insight
        </v-btn>
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
      <!-- Filters and search -->
      <v-row>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search insights"
            single-line
            hide-details
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-select
            v-model="categoryFilter"
            :items="insightCategories"
            label="Category"
            density="compact"
            hide-details
            variant="outlined"
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-select
            v-model="sortOption"
            :items="sortOptions"
            label="Sort by"
            density="compact"
            hide-details
            variant="outlined"
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="d-flex justify-end align-center"
        >
          <v-btn-toggle
            v-model="viewType"
            color="primary"
            density="compact"
          >
            <v-btn
              value="grid"
              icon="mdi-view-grid"
            />
            <v-btn
              value="list"
              icon="mdi-view-list"
            />
          </v-btn-toggle>
        </v-col>
      </v-row>

      <!-- Grid View -->
      <v-row
        v-if="viewType === 'grid'"
        class="mt-4"
      >
        <v-col
          v-for="insight in filteredInsights"
          :key="insight.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            elevation="2"
            height="100%"
            class="insight-card"
          >
            <v-img
              :src="getInsightThumbnail(insight)"
              height="160px"
              cover
              class="align-end"
            >
              <v-chip
                size="small"
                :color="getCategoryColor(insight.category)"
                class="ma-2"
              >
                {{ insight.category }}
              </v-chip>
            </v-img>

            <v-card-title class="text-truncate">
              {{ insight.title }}
            </v-card-title>

            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon
                  size="small"
                  color="primary"
                  class="mr-2"
                >
                  mdi-clock-outline
                </v-icon>
                <span class="text-caption">{{
                  formatDate(insight.createdAt)
                }}</span>
              </div>

              <p class="text-body-2 mb-2">
                {{ insight.description }}
              </p>

              <div class="d-flex align-center">
                <v-icon
                  size="small"
                  color="primary"
                  class="mr-2"
                >
                  mdi-database
                </v-icon>
                <span class="text-caption">{{ insight.dataSource }}</span>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                icon
                variant="text"
                @click="viewInsight(insight)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                @click="editInsight(insight)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                @click="confirmDelete(insight)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Empty state for grid view -->
        <v-col
          v-if="filteredInsights.length === 0"
          cols="12"
          class="text-center py-6"
        >
          <v-icon
            size="64"
            color="grey-lighten-1"
          >
            mdi-lightbulb-off
          </v-icon>
          <h3 class="mt-4 text-h6">
            No insights found
          </h3>
          <p class="text-body-2 text-medium-emphasis">
            Try changing your filters or generate a new insight
          </p>
        </v-col>
      </v-row>

      <!-- List View -->
      <v-row
        v-else
        class="mt-4"
      >
        <v-col cols="12">
          <v-card elevation="1">
            <v-data-table
              :headers="tableHeaders"
              :items="filteredInsights"
              :search="search"
              :loading="loading"
            >
              <template #item.category="{ item }">
                <v-chip
                  size="small"
                  :color="getCategoryColor(item.category)"
                >
                  {{ item.category }}
                </v-chip>
              </template>

              <template #item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="viewInsight(item)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="editInsight(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="confirmDelete(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Generate Insight Dialog -->
    <v-dialog
      v-model="generateDialog"
      max-width="800"
    >
      <v-card>
        <v-card-title>Generate New Insight</v-card-title>

        <v-card-text>
          <v-stepper v-model="currentStep">
            <v-stepper-header>
              <v-stepper-item value="1">
                Data Source
              </v-stepper-item>
              <v-divider />
              <v-stepper-item value="2">
                Configuration
              </v-stepper-item>
              <v-divider />
              <v-stepper-item value="3">
                Generate
              </v-stepper-item>
            </v-stepper-header>

            <v-stepper-window>
              <!-- Step 1: Select Data Source -->
              <v-stepper-window-item value="1">
                <v-container>
                  <h3 class="text-h6 mb-4">
                    Select Data Source
                  </h3>

                  <v-row>
                    <v-col cols="12">
                      <v-select
                        v-model="newInsight.dataSourceId"
                        :items="dataSources"
                        item-title="name"
                        item-value="id"
                        label="Data Source"
                        required
                        :rules="[(v) => !!v || 'Data source is required']"
                      />
                    </v-col>

                    <v-col
                      v-if="newInsight.dataSourceId"
                      cols="12"
                    >
                      <v-select
                        v-model="newInsight.table"
                        :items="availableTables"
                        label="Table/Collection"
                        required
                        :rules="[(v) => !!v || 'Table is required']"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-stepper-window-item>

              <!-- Step 2: Configure Insight -->
              <v-stepper-window-item value="2">
                <v-container>
                  <h3 class="text-h6 mb-4">
                    Configure Insight Parameters
                  </h3>

                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="newInsight.title"
                        label="Insight Title"
                        required
                        :rules="[(v) => !!v || 'Title is required']"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-textarea
                        v-model="newInsight.description"
                        label="Description"
                        rows="3"
                      />
                    </v-col>

                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="newInsight.category"
                        :items="insightCategories"
                        label="Category"
                        required
                      />
                    </v-col>

                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="newInsight.visualizationType"
                        :items="visualizationTypes"
                        label="Visualization Type"
                        required
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-textarea
                        v-model="newInsight.prompt"
                        label="Custom Query Prompt"
                        rows="4"
                        placeholder="Describe what insights you'd like Qwen to analyze (optional)"
                        hint="Example: 'Analyze the relationship between customer age and purchase amount'"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-stepper-window-item>

              <!-- Step 3: Generate Insight -->
              <v-stepper-window-item value="3">
                <v-container>
                  <div
                    v-if="generating"
                    class="text-center py-6"
                  >
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                    />
                    <h3 class="mt-4 text-h6">
                      Generating Insight
                    </h3>
                    <p class="text-body-2">
                      Qwen2.5 is analyzing your data...
                    </p>
                  </div>

                  <div
                    v-else-if="generatedInsight"
                    class="py-4"
                  >
                    <v-alert
                      type="success"
                      class="mb-4"
                    >
                      Insight generated successfully!
                    </v-alert>

                    <h3 class="text-h6 mb-2">
                      {{ generatedInsight.title }}
                    </h3>
                    <p class="mb-4">
                      {{ generatedInsight.description }}
                    </p>

                    <div class="d-flex justify-center mb-4">
                      <v-img
                        :src="getInsightThumbnail(generatedInsight)"
                        max-height="200"
                        contain
                      />
                    </div>

                    <v-card class="mb-4">
                      <v-card-title>Key Findings</v-card-title>
                      <v-card-text>
                        <ul>
                          <li
                            v-for="(
                              finding, index
                            ) in generatedInsight.findings"
                            :key="index"
                          >
                            {{ finding }}
                          </li>
                        </ul>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-container>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>

        <v-card-actions>
          <v-btn
            v-if="currentStep !== '1'"
            color="grey"
            variant="text"
            @click="currentStep = String(parseInt(currentStep) - 1)"
          >
            Back
          </v-btn>

          <v-spacer />

          <v-btn
            color="grey"
            variant="text"
            @click="generateDialog = false"
          >
            Cancel
          </v-btn>

          <v-btn
            v-if="currentStep !== '3'"
            color="primary"
            @click="currentStep = String(parseInt(currentStep) + 1)"
          >
            Next
          </v-btn>

          <v-btn
            v-else-if="!generatedInsight"
            color="primary"
            :loading="generating"
            @click="generateInsightData"
          >
            Generate
          </v-btn>

          <v-btn
            v-else
            color="success"
            @click="saveGeneratedInsight"
          >
            Save Insight
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Insight Dialog -->
    <v-dialog
      v-model="editDialog"
      max-width="700"
    >
      <v-card>
        <v-card-title>Edit Insight</v-card-title>

        <v-card-text>
          <v-form
            ref="form"
            v-model="formValid"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentInsight.title"
                  label="Title"
                  required
                  :rules="[(v) => !!v || 'Title is required']"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentInsight.description"
                  label="Description"
                  rows="3"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="currentInsight.category"
                  :items="insightCategories"
                  label="Category"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="currentInsight.visualizationType"
                  :items="visualizationTypes"
                  label="Visualization Type"
                  disabled
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="editDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveInsight"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the insight "{{
            insightToDelete?.title
          }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteInsight"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useInsightStore } from "../stores/insight";
import { useDataSourceStore } from "../stores/datasource";
import { useRouter } from "vue-router";

const router = useRouter();
const insightStore = useInsightStore();
const dataSourceStore = useDataSourceStore();

// State
const viewType = ref("grid");
const search = ref("");
const categoryFilter = ref("");
const sortOption = ref("newest");
const generateDialog = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const currentStep = ref("1");
const generating = ref(false);
const formValid = ref(false);
const form = ref(null);
const saving = ref(false);
const deleting = ref(false);
const insightToDelete = ref(null);
const generatedInsight = ref(null);

// New insight form
const newInsight = ref({
  dataSourceId: null,
  table: "",
  title: "",
  description: "",
  category: "",
  visualizationType: "",
  prompt: "",
});

// Current insight for editing
const currentInsight = ref({
  id: null,
  title: "",
  description: "",
  category: "",
  visualizationType: "",
  dataSource: "",
});

// Sample data (will be replaced with real data from API)
const insights = ref([
  {
    id: 1,
    title: "Monthly Sales Analysis",
    description:
      "Analysis of monthly sales trends across different product categories",
    category: "Sales",
    visualizationType: "Line Chart",
    dataSource: "PostgreSQL Production",
    createdAt: "2024-02-25T14:30:00",
    findings: [
      "Electronics sales increased by 15% in the last quarter",
      "Home goods saw a 5% decline in January",
      "Peak sales occur consistently on Fridays",
    ],
  },
  {
    id: 2,
    title: "Customer Retention Metrics",
    description: "Cohort analysis of customer retention by acquisition channel",
    category: "Customer",
    visualizationType: "Heatmap",
    dataSource: "MySQL Analytics",
    createdAt: "2024-02-24T09:15:00",
    findings: [
      "Email campaigns have 22% higher retention rates",
      "Social media acquired customers show highest churn in month 2",
      "Loyalty program members have 3x higher retention",
    ],
  },
  {
    id: 3,
    title: "Website Performance Breakdown",
    description: "Analysis of page load times and user engagement metrics",
    category: "Performance",
    visualizationType: "Bar Chart",
    dataSource: "MongoDB User Data",
    createdAt: "2024-02-20T16:45:00",
    findings: [
      "Mobile users experience 2.5s longer load times on average",
      "Checkout page abandonment correlates with load times over 3s",
      "Safari users have highest bounce rate at 42%",
    ],
  },
  {
    id: 4,
    title: "Marketing Campaign ROI",
    description: "Return on investment analysis for recent marketing campaigns",
    category: "Marketing",
    visualizationType: "Combined Chart",
    dataSource: "Snowflake DW",
    createdAt: "2024-02-18T11:20:00",
    findings: [
      "Email campaigns show 215% ROI, highest among all channels",
      "PPC costs increased 12% while conversion decreased 3%",
      "Content marketing shows delayed ROI peaking at month 3",
    ],
  },
]);

const dataSources = ref([
  { id: 1, name: "PostgreSQL Production" },
  { id: 2, name: "MySQL Analytics" },
  { id: 3, name: "MongoDB User Data" },
  { id: 4, name: "Snowflake DW" },
]);

const availableTables = ref([
  "users",
  "orders",
  "products",
  "transactions",
  "marketing_campaigns",
  "page_views",
  "customer_feedback",
]);

// Metadata
const insightCategories = [
  "Sales",
  "Marketing",
  "Customer",
  "Financial",
  "Operational",
  "Performance",
  "Inventory",
];

const visualizationTypes = [
  "Bar Chart",
  "Line Chart",
  "Pie Chart",
  "Scatter Plot",
  "Heatmap",
  "Combined Chart",
  "Table",
  "KPI Dashboard",
];

const sortOptions = [
  { title: "Newest First", value: "newest" },
  { title: "Oldest First", value: "oldest" },
  { title: "A-Z", value: "alphabetical" },
  { title: "Category", value: "category" },
];

const tableHeaders = [
  { title: "Title", key: "title" },
  { title: "Category", key: "category" },
  { title: "Visualization", key: "visualizationType" },
  { title: "Data Source", key: "dataSource" },
  { title: "Created", key: "createdAt" },
  { title: "Actions", key: "actions", sortable: false },
];

// Computed properties
const loading = computed(() => insightStore.loading);
const error = computed(() => insightStore.error);

const filteredInsights = computed(() => {
  let filtered = insights.value;

  if (categoryFilter.value) {
    filtered = filtered.filter(
      (insight) => insight.category === categoryFilter.value
    );
  }

  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(
      (insight) =>
        insight.title.toLowerCase().includes(searchLower) ||
        insight.description.toLowerCase().includes(searchLower) ||
        insight.category.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  switch (sortOption.value) {
    case "newest":
      return [...filtered].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    case "oldest":
      return [...filtered].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    case "alphabetical":
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    case "category":
      return [...filtered].sort((a, b) => a.category.localeCompare(b.category));
    default:
      return filtered;
  }
});

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getCategoryColor = (category) => {
  const colors = {
    Sales: "green",
    Marketing: "purple",
    Customer: "blue",
    Financial: "amber",
    Operational: "brown",
    Performance: "teal",
    Inventory: "indigo",
  };

  return colors[category] || "grey";
};

const getInsightThumbnail = (insight) => {
  // In a real app, we'd use actual thumbnails from the API
  // For demo purposes, we'll use placeholder images based on visualization type
  const visualizationImages = {
    "Bar Chart":
      "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Bar+Chart",
    "Line Chart":
      "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Line+Chart",
    "Pie Chart":
      "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Pie+Chart",
    "Scatter Plot":
      "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Scatter+Plot",
    Heatmap: "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Heatmap",
    "Combined Chart":
      "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Combined+Chart",
    Table: "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Table",
    "KPI Dashboard":
      "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=KPI+Dashboard",
  };

  return (
    visualizationImages[insight.visualizationType] ||
    "https://via.placeholder.com/500x300/1E1E1E/FFFFFF?text=Visualization"
  );
};

const openGenerateInsightDialog = () => {
  newInsight.value = {
    dataSourceId: null,
    table: "",
    title: "",
    description: "",
    category: "",
    visualizationType: "",
    prompt: "",
  };
  currentStep.value = "1";
  generatedInsight.value = null;
  generateDialog.value = true;
};

const generateInsightData = async () => {
  generating.value = true;

  try {
    // In a real app, we'd call the API here
    // await insightStore.generateInsight(newInsight.value)

    // For demo purposes, we'll simulate a response after a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock generated insight
    generatedInsight.value = {
      id: Date.now(),
      title: newInsight.value.title || "Sales Trend Analysis",
      description:
        newInsight.value.description ||
        "Analysis of monthly sales trends with product category breakdown",
      category: newInsight.value.category || "Sales",
      visualizationType: newInsight.value.visualizationType || "Line Chart",
      dataSource:
        dataSources.value.find((ds) => ds.id === newInsight.value.dataSourceId)
          ?.name || "Unknown",
      createdAt: new Date().toISOString(),
      findings: [
        "Product category A shows consistent growth of 5% month-over-month",
        "Seasonal peak occurs in November-December timeframe",
        "Weekend sales are 37% higher than weekday sales on average",
        "Online channel outperforms retail by 24% in profit margin",
      ],
    };
  } catch (error) {
    console.error("Error generating insight:", error);
  } finally {
    generating.value = false;
  }
};

const saveGeneratedInsight = () => {
  if (!generatedInsight.value) return;

  // In a real app, we'd call the API here
  // await insightStore.createInsight(generatedInsight.value)

  // For demo purposes, we'll add it to our local array
  insights.value.push(generatedInsight.value);

  generateDialog.value = false;
  generatedInsight.value = null;
};

const viewInsight = (insight) => {
  // Navigate to insight details page
  router.push(`/insights/${insight.id}`);
};

const editInsight = (insight) => {
  currentInsight.value = { ...insight };
  editDialog.value = true;
};

const confirmDelete = (insight) => {
  insightToDelete.value = insight;
  deleteDialog.value = true;
};

const saveInsight = async () => {
  if (!formValid.value) return;

  saving.value = true;
  try {
    // Update insight
    await insightStore.updateInsight(
      currentInsight.value.id,
      currentInsight.value
    );

    // Update local array
    const index = insights.value.findIndex(
      (item) => item.id === currentInsight.value.id
    );
    if (index !== -1) {
      insights.value[index] = {
        ...insights.value[index],
        ...currentInsight.value,
      };
    }

    editDialog.value = false;
  } catch (error) {
    console.error("Error saving insight:", error);
    // Show error message
    alert(`Failed to save: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

const deleteInsight = async () => {
  if (!insightToDelete.value) return;

  deleting.value = true;
  try {
    // Delete insight
    await insightStore.deleteInsight(insightToDelete.value.id);

    // Remove from local list
    insights.value = insights.value.filter(
      (item) => item.id !== insightToDelete.value.id
    );

    deleteDialog.value = false;
    insightToDelete.value = null;
  } catch (error) {
    console.error("Error deleting insight:", error);
    // Show error message
    alert(`Failed to delete: ${error.message}`);
  } finally {
    deleting.value = false;
  }
};

// Fetch data on component mount
onMounted(async () => {
  try {
    await insightStore.fetchInsights();

    // In a real app, we'd use the store data
    // insights.value = insightStore.insights

    // Also fetch data sources for the generate dialog
    await dataSourceStore.fetchDataSources();
    // dataSources.value = dataSourceStore.dataSources
  } catch (error) {
    console.error("Failed to load insights:", error);
  }
});
</script>

<style scoped>
.insight-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.insight-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
</style>
