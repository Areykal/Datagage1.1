<template>
  <v-alert
    v-if="error"
    :type="type"
    :title="title"
    :text="errorMessage"
    :closable="closable"
    :icon="icon"
    :variant="variant"
    :border="border"
    class="mb-4"
    @click:close="onClose"
  >
    <slot>
      <div
        v-if="showDetails && details"
        class="mt-2"
      >
        <v-btn
          density="compact"
          variant="text"
          size="small"
          @click="toggleDetails"
        >
          {{ showDetailsText ? "Hide Details" : "Show Details" }}
        </v-btn>

        <v-expand-transition>
          <pre
            v-if="showDetailsText"
            class="error-details mt-2"
          >{{
            details
          }}</pre>
        </v-expand-transition>
      </div>
    </slot>
  </v-alert>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  error: {
    type: [String, Error, Object, Boolean],
    default: null,
  },
  title: {
    type: String,
    default: "Error",
  },
  type: {
    type: String,
    default: "error",
  },
  message: {
    type: String,
    default: null,
  },
  details: {
    type: [String, Object],
    default: null,
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
  closable: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String,
    default: undefined,
  },
  border: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["close"]);

const showDetailsText = ref(false);

const errorMessage = computed(() => {
  if (props.message) {
    return props.message;
  }

  if (typeof props.error === "string") {
    return props.error;
  }

  if (props.error instanceof Error) {
    return props.error.message;
  }

  if (props.error && typeof props.error === "object" && props.error.message) {
    return props.error.message;
  }

  return "An unexpected error occurred";
});

const toggleDetails = () => {
  showDetailsText.value = !showDetailsText.value;
};

const onClose = () => {
  emit("close");
};
</script>

<style scoped>
.error-details {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.v-theme--dark .error-details {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
