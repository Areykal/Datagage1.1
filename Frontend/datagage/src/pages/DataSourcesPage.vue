<template>
  <div>
    <v-row class="mb-4">
      <v-col
        cols="12"
        sm="6"
      >
        <h1 class="text-h4">
          Data Sources
        </h1>
        <p class="text-subtitle-1">
          Manage your data connections
        </p>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        class="text-sm-right"
      >
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openNewDataSourceDialog"
        >
          New Data Source
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

    <!-- Data sources list -->
    <template v-else>
      <!-- Filters and search -->
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search data sources"
            single-line
            hide-details
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-select
            v-model="typeFilter"
            :items="dataSourceTypes"
            label="Filter by type"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          md="5"
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
          v-for="dataSource in filteredDataSources"
          :key="dataSource.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            elevation="2"
            height="100%"
            class="data-source-card"
          >
            <v-card-item>
              <template #prepend>
                <v-avatar
                  color="primary"
                  size="large"
                  class="mr-4"
                >
                  <v-icon
                    :icon="getDataSourceIcon(dataSource.type)"
                    color="white"
                  />
                </v-avatar>
              </template>

              <v-card-title>{{ dataSource.name }}</v-card-title>
              <v-card-subtitle>{{ dataSource.type }}</v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon
                  size="small"
                  color="primary"
                  class="mr-2"
                >
                  mdi-database
                </v-icon>
                <span>{{ dataSource.database || "N/A" }}</span>
              </div>

              <div class="d-flex align-center mb-2">
                <v-icon
                  size="small"
                  color="primary"
                  class="mr-2"
                >
                  mdi-server
                </v-icon>
                <span>{{ dataSource.host || "N/A" }}</span>
              </div>

              <v-chip
                size="small"
                :color="dataSource.status === 'Connected' ? 'success' : 'error'"
                class="mt-2"
              >
                {{ dataSource.status }}
              </v-chip>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                icon
                variant="text"
                @click="viewDataSource(dataSource)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                @click="editDataSource(dataSource)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                @click="confirmDelete(dataSource)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Empty state for grid view -->
        <v-col
          v-if="filteredDataSources.length === 0"
          cols="12"
          class="text-center py-6"
        >
          <v-icon
            size="64"
            color="grey-lighten-1"
          >
            mdi-database-off
          </v-icon>
          <h3 class="mt-4 text-h6">
            No data sources found
          </h3>
          <p class="text-body-2 text-medium-emphasis">
            Try changing your filters or create a new data source
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
              :items="filteredDataSources"
              :search="search"
              :loading="loading"
            >
              <template #item.type="{ item }">
                <div class="d-flex align-center">
                  <v-avatar
                    size="32"
                    color="primary"
                    class="mr-2"
                  >
                    <v-icon
                      size="small"
                      color="white"
                    >
                      {{ getDataSourceIcon(item.type) }}
                    </v-icon>
                  </v-avatar>
                  {{ item.type }}
                </div>
              </template>

              <template #item.status="{ item }">
                <v-chip
                  size="small"
                  :color="item.status === 'Connected' ? 'success' : 'error'"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="viewDataSource(item)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="editDataSource(item)"
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

    <!-- New/Edit Data Source Dialog -->
    <v-dialog
      v-model="dataSourceDialog"
      max-width="700"
    >
      <v-card>
        <v-card-title>
          {{ isEditing ? "Edit Data Source" : "New Data Source" }}
        </v-card-title>

        <v-card-text>
          <v-form
            ref="form"
            v-model="formValid"
          >
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentDataSource.name"
                  label="Name"
                  required
                  :rules="[(v) => !!v || 'Name is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="currentDataSource.type"
                  :items="dataSourceTypes"
                  label="Type"
                  required
                  :rules="[(v) => !!v || 'Type is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentDataSource.host"
                  label="Host"
                  required
                  :rules="[(v) => !!v || 'Host is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentDataSource.port"
                  label="Port"
                  type="number"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentDataSource.database"
                  label="Database"
                  required
                  :rules="[(v) => !!v || 'Database is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentDataSource.username"
                  label="Username"
                  required
                  :rules="[(v) => !!v || 'Username is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentDataSource.password"
                  label="Password"
                  type="password"
                  required
                  :rules="[(v) => !!v || 'Password is required']"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentDataSource.description"
                  label="Description"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="testConnection"
          >
            Test Connection
          </v-btn>
          <v-btn
            color="grey"
            variant="text"
            @click="dataSourceDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveDataSource"
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
          Are you sure you want to delete the data source "{{
            dataSourceToDelete?.name
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
            @click="deleteDataSource"
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
import { useDataSourceStore } from "../stores/datasource";
import { useRouter } from "vue-router";

const router = useRouter();
const dataSourceStore = useDataSourceStore();

// State
const viewType = ref("grid");
const search = ref("");
const typeFilter = ref("");
const dataSourceDialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const dataSourceToDelete = ref(null);
const formValid = ref(false);
const form = ref(null);
const saving = ref(false);
const deleting = ref(false);

// Data source form
const currentDataSource = ref({
  name: "",
  type: "",
  host: "",
  port: "",
  database: "",
  username: "",
  password: "",
  description: "",
});

// Sample data (will be replaced with real data from API)
const dataSources = ref([
  {
    id: 1,
    name: "PostgreSQL Production",
    type: "PostgreSQL",
    host: "db.example.com",
    port: 5432,
    database: "production_db",
    username: "admin",
    description: "Main production database",
    status: "Connected",
    lastSync: "2024-02-28 10:30",
  },
  {
    id: 2,
    name: "MySQL Analytics",
    type: "MySQL",
    host: "analytics.example.com",
    port: 3306,
    database: "analytics_db",
    username: "analyst",
    description: "Analytics data warehouse",
    status: "Connected",
    lastSync: "2024-02-28 09:15",
  },
  {
    id: 3,
    name: "MongoDB User Data",
    type: "MongoDB",
    host: "mongo.example.com",
    port: 27017,
    database: "users",
    username: "app_user",
    description: "User profile and activity data",
    status: "Connected",
    lastSync: "2024-02-28 08:45",
  },
  {
    id: 4,
    name: "Snowflake DW",
    type: "Snowflake",
    host: "snowflake.example.com",
    database: "ENTERPRISE_DW",
    username: "dw_user",
    description: "Enterprise data warehouse",
    status: "Failed",
    lastSync: "2024-02-27 17:20",
  },
]);

// Sample metadata
const dataSourceTypes = [
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Snowflake",
  "BigQuery",
  "SQL Server",
  "Oracle",
  "Redshift",
  "DynamoDB",
  "Elasticsearch",
];

const tableHeaders = [
  { title: "Name", key: "name" },
  { title: "Type", key: "type" },
  { title: "Host", key: "host" },
  { title: "Database", key: "database" },
  { title: "Status", key: "status" },
  { title: "Last Sync", key: "lastSync" },
  { title: "Actions", key: "actions", sortable: false },
];

// Computed properties
const loading = computed(() => dataSourceStore.loading);
const error = computed(() => dataSourceStore.error);

const filteredDataSources = computed(() => {
  let filtered = dataSources.value;

  if (typeFilter.value) {
    filtered = filtered.filter((ds) => ds.type === typeFilter.value);
  }

  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(
      (ds) =>
        ds.name.toLowerCase().includes(searchLower) ||
        ds.type.toLowerCase().includes(searchLower) ||
        ds.host.toLowerCase().includes(searchLower) ||
        (ds.database && ds.database.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
});

// Methods
const getDataSourceIcon = (type) => {
  const icons = {
    PostgreSQL: "mdi-database",
    MySQL: "mdi-database",
    MongoDB: "mdi-database",
    Snowflake: "mdi-snowflake",
    BigQuery: "mdi-google",
    "SQL Server": "mdi-microsoft",
    Oracle: "mdi-database",
    Redshift: "mdi-aws",
    DynamoDB: "mdi-aws",
    Elasticsearch: "mdi-elasticsearch",
  };

  return icons[type] || "mdi-database";
};

const openNewDataSourceDialog = () => {
  isEditing.value = false;
  currentDataSource.value = {
    name: "",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    description: "",
  };
  dataSourceDialog.value = true;
};

const editDataSource = (dataSource) => {
  isEditing.value = true;
  currentDataSource.value = { ...dataSource, password: "••••••••" };
  dataSourceDialog.value = true;
};

const viewDataSource = (dataSource) => {
  // Navigate to data source details page
  router.push(`/datasources/${dataSource.id}`);
};

const confirmDelete = (dataSource) => {
  dataSourceToDelete.value = dataSource;
  deleteDialog.value = true;
};

const testConnection = async () => {
  try {
    // Call API to test connection
    await dataSourceStore.testConnection(currentDataSource.value);

    // Show success message (would use a snackbar or alert in a real app)
    alert("Connection successful!");
  } catch (error) {
    // Show error message
    alert(`Connection failed: ${error.message}`);
  }
};

const saveDataSource = async () => {
  if (!formValid.value) return;

  saving.value = true;
  try {
    if (isEditing.value) {
      // Update existing data source
      await dataSourceStore.updateDataSource(
        currentDataSource.value.id,
        currentDataSource.value
      );
    } else {
      // Create new data source
      await dataSourceStore.createDataSource(currentDataSource.value);
    }

    dataSourceDialog.value = false;

    // In a real app, we'd refresh the data here or use the returned data
    // For now, we'll simulate it with our sample data
    if (!isEditing.value) {
      const newId = dataSources.value.length + 1;
      dataSources.value.push({
        ...currentDataSource.value,
        id: newId,
        status: "Connected",
        lastSync: new Date().toLocaleString(),
      });
    } else {
      const index = dataSources.value.findIndex(
        (ds) => ds.id === currentDataSource.value.id
      );
      if (index !== -1) {
        dataSources.value[index] = {
          ...dataSources.value[index],
          ...currentDataSource.value,
          password: undefined, // Don't store password in the UI state
        };
      }
    }
  } catch (error) {
    console.error("Error saving data source:", error);
    // Show error message
    alert(`Failed to save: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

const deleteDataSource = async () => {
  if (!dataSourceToDelete.value) return;

  deleting.value = true;
  try {
    // Delete data source
    await dataSourceStore.deleteDataSource(dataSourceToDelete.value.id);

    // Remove from local list
    dataSources.value = dataSources.value.filter(
      (ds) => ds.id !== dataSourceToDelete.value.id
    );

    deleteDialog.value = false;
    dataSourceToDelete.value = null;
  } catch (error) {
    console.error("Error deleting data source:", error);
    // Show error message
    alert(`Failed to delete: ${error.message}`);
  } finally {
    deleting.value = false;
  }
};

// Fetch data on component mount
onMounted(async () => {
  try {
    await dataSourceStore.fetchDataSources();

    // In a real app, we'd use the data from the store
    // For now, we'll stick with our sample data
    // dataSources.value = dataSourceStore.dataSources
  } catch (error) {
    console.error("Failed to load data sources:", error);
  }
});
</script>

<style scoped>
.data-source-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.data-source-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
</style>
