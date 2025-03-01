<template>
  <v-chip
    :color="getStatusColor"
    :text-color="getTextColor"
    :size="size"
    :variant="variant"
    :class="chipClass"
  >
    <v-icon
      v-if="showIcon"
      :size="iconSize"
      :start="true"
      class="mr-1"
    >
      {{ getStatusIcon }}
    </v-icon>
    {{ text }}
  </v-chip>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: "small",
  },
  variant: {
    type: String,
    default: "flat",
  },
  showIcon: {
    type: Boolean,
    default: false,
  },
  iconSize: {
    type: String,
    default: "small",
  },
  chipClass: {
    type: String,
    default: "",
  },
  customColors: {
    type: Object,
    default: () => ({}),
  },
});

const getStatusColor = computed(() => {
  // First check custom colors
  if (props.customColors && props.customColors[props.status]) {
    return props.customColors[props.status];
  }

  // Default color mapping
  const statusColorMap = {
    success: "success",
    completed: "success",
    active: "success",
    online: "success",
    connected: "success",
    pending: "warning",
    warning: "warning",
    "in-progress": "warning",
    processing: "warning",
    error: "error",
    failed: "error",
    inactive: "error",
    disconnected: "error",
    info: "info",
    default: "default",
  };

  const normalizedStatus = props.status.toLowerCase();
  return statusColorMap[normalizedStatus] || "default";
});

const getTextColor = computed(() => {
  // For flat variant, we should use white text for better contrast
  if (props.variant === "flat") {
    return "white";
  }

  return undefined; // Let Vuetify determine the best text color
});

const getStatusIcon = computed(() => {
  const iconMap = {
    success: "mdi-check-circle",
    completed: "mdi-check-circle",
    active: "mdi-check-circle",
    online: "mdi-check-circle",
    connected: "mdi-check-circle",
    pending: "mdi-clock",
    warning: "mdi-alert-circle",
    "in-progress": "mdi-progress-clock",
    processing: "mdi-progress-clock",
    error: "mdi-close-circle",
    failed: "mdi-close-circle",
    inactive: "mdi-close-circle",
    disconnected: "mdi-lan-disconnect",
    info: "mdi-information",
    default: "mdi-help-circle",
  };

  const normalizedStatus = props.status.toLowerCase();
  return iconMap[normalizedStatus] || "mdi-help-circle";
});
</script>
