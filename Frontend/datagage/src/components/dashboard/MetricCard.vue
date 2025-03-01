<template>
  <v-card
    :elevation="elevation"
    class="h-100"
    :class="cardClass"
  >
    <v-card-text>
      <div class="d-flex flex-column align-center">
        <div
          v-if="icon"
          class="metric-icon mb-2"
        >
          <v-icon
            :size="iconSize"
            :color="iconColor"
          >
            {{ icon }}
          </v-icon>
        </div>

        <div class="text-overline text-center">
          {{ title }}
        </div>

        <div class="d-flex align-center justify-center">
          <v-skeleton-loader
            v-if="loading"
            type="text"
            width="100"
            height="40"
          />
          <div
            v-else
            class="text-h4 text-center font-weight-bold"
          >
            {{ value }}
          </div>
        </div>

        <div
          v-if="hasChange && !loading"
          class="d-flex align-center mt-2"
        >
          <v-icon
            :color="changeColor"
            size="small"
          >
            {{ changeIcon }}
          </v-icon>
          <span
            :class="changeColorClass"
            class="ml-1"
          >
            {{ changePrefix }}{{ Math.abs(change) }}{{ changeSuffix }}
          </span>
        </div>

        <div
          v-if="subtitle && !loading"
          class="text-caption text-center mt-1"
        >
          {{ subtitle }}
        </div>
      </div>
    </v-card-text>

    <v-divider v-if="$slots.actions" />

    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    default: "0",
  },
  change: {
    type: Number,
    default: null,
  },
  changeSuffix: {
    type: String,
    default: "%",
  },
  changePrefix: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: null,
  },
  iconColor: {
    type: String,
    default: "primary",
  },
  iconSize: {
    type: [String, Number],
    default: "x-large",
  },
  elevation: {
    type: [String, Number],
    default: 2,
  },
  subtitle: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  cardClass: {
    type: String,
    default: "",
  },
});

const hasChange = computed(() => {
  return props.change !== null && props.change !== undefined;
});

const changeIcon = computed(() => {
  if (!hasChange.value) return "";

  // If exactly zero, use a dash icon
  if (props.change === 0) return "mdi-minus";

  // Otherwise use arrow up/down
  return props.change > 0 ? "mdi-arrow-up" : "mdi-arrow-down";
});

const changeColor = computed(() => {
  if (!hasChange.value) return "";

  // If exactly zero, use a neutral color
  if (props.change === 0) return "grey";

  // By default, up is good (green), down is bad (red)
  return props.change > 0 ? "success" : "error";
});

const changeColorClass = computed(() => {
  if (!hasChange.value) return "";

  // If exactly zero, use a neutral color
  if (props.change === 0) return "text-grey";

  // By default, up is good (green), down is bad (red)
  return props.change > 0 ? "text-success" : "text-error";
});
</script>

<style scoped>
.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
