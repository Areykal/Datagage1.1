<template>
  <v-card
    :elevation="elevation"
    height="100%"
  >
    <v-card-title class="text-subtitle-1">
      {{ title }}
      <v-spacer />
      <slot name="actions">
        <v-menu v-if="timeRanges.length > 0">
          <template #activator="{ props }">
            <v-btn
              variant="text"
              size="small"
              v-bind="props"
            >
              {{ selectedTimeRange }}
              <v-icon end>
                mdi-chevron-down
              </v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(range, index) in timeRanges"
              :key="index"
              :value="range.value"
              @click="timeRangeChanged(range.value)"
            >
              <v-list-item-title>{{ range.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </slot>
    </v-card-title>

    <v-card-text :style="{ height: chartHeight }">
      <div
        v-if="loading"
        class="d-flex justify-center align-center h-100"
      >
        <v-progress-circular
          indeterminate
          :color="loadingColor"
        />
      </div>

      <div
        v-else-if="error"
        class="d-flex justify-center align-center h-100 flex-column"
      >
        <v-icon
          color="error"
          size="large"
        >
          mdi-alert-circle
        </v-icon>
        <div class="text-body-2 mt-2 text-center">
          {{ errorMessage }}
        </div>
      </div>

      <div
        v-else-if="!chartData || chartData.length === 0"
        class="d-flex justify-center align-center h-100 flex-column"
      >
        <v-icon
          color="grey"
          size="large"
        >
          mdi-chart-line
        </v-icon>
        <div class="text-body-2 mt-2 text-center">
          No data available
        </div>
      </div>

      <div
        v-else
        class="chart-container h-100"
      >
        <canvas ref="chartCanvas" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  title: {
    type: String,
    default: "Chart",
  },
  chartData: {
    type: Array,
    default: () => [],
  },
  xKey: {
    type: String,
    default: "x",
  },
  yKey: {
    type: String,
    default: "y",
  },
  lineColor: {
    type: String,
    default: "#1976D2",
  },
  fillColor: {
    type: String,
    default: "rgba(25, 118, 210, 0.1)",
  },
  borderWidth: {
    type: Number,
    default: 2,
  },
  tension: {
    type: Number,
    default: 0.4,
  },
  pointRadius: {
    type: Number,
    default: 3,
  },
  chartHeight: {
    type: String,
    default: "300px",
  },
  timeRanges: {
    type: Array,
    default: () => [],
  },
  defaultTimeRange: {
    type: String,
    default: "7d",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [Boolean, String, Error],
    default: false,
  },
  loadingColor: {
    type: String,
    default: "primary",
  },
  elevation: {
    type: [String, Number],
    default: 2,
  },
});

const emit = defineEmits(["timeRangeChange"]);

const chartCanvas = ref(null);
const chart = ref(null);
const selectedTimeRange = ref(props.defaultTimeRange);

const errorMessage = computed(() => {
  if (typeof props.error === "string") {
    return props.error;
  }
  if (props.error instanceof Error) {
    return props.error.message;
  }
  return "Failed to load chart data";
});

// Initialize or update chart
const initChart = () => {
  if (!chartCanvas.value) return;

  // If chart already exists, destroy it
  if (chart.value) {
    chart.value.destroy();
  }

  const ctx = chartCanvas.value.getContext("2d");

  // Get the current theme colors
  const isDarkTheme =
    document.documentElement.classList.contains("v-theme--dark");
  const gridColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";
  const textColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.7)"
    : "rgba(0, 0, 0, 0.7)";

  // Prepare data
  const labels = props.chartData.map((item) => item[props.xKey]);
  const data = props.chartData.map((item) => item[props.yKey]);

  // Create new chart
  chart.value = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: props.title,
          data,
          borderColor: props.lineColor,
          backgroundColor: props.fillColor,
          borderWidth: props.borderWidth,
          tension: props.tension,
          pointRadius: props.pointRadius,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
};

const timeRangeChanged = (range) => {
  selectedTimeRange.value = range;
  emit("timeRangeChange", range);
};

// Watch for changes in chart data
watch(
  () => props.chartData,
  () => {
    if (!props.loading && !props.error) {
      initChart();
    }
  },
  { deep: true }
);

// Initialize chart on mount
onMounted(() => {
  if (props.chartData.length > 0 && !props.loading && !props.error) {
    initChart();
  }

  // Listen for theme changes
  window.addEventListener("themeChange", initChart);
});

// Clean up on unmount
onUnmounted(() => {
  if (chart.value) {
    chart.value.destroy();
  }

  window.removeEventListener("themeChange", initChart);
});
</script>

<style scoped>
.chart-container {
  position: relative;
}
</style>
