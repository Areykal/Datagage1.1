<template>
  <div
    v-if="loading"
    class="loading-overlay"
  >
    <div class="loading-content">
      <v-progress-circular
        :size="size"
        :width="width"
        :color="color"
        indeterminate
      />

      <div
        v-if="message"
        class="loading-message"
      >
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "Loading...",
  },
  size: {
    type: [Number, String],
    default: 64,
  },
  width: {
    type: [Number, String],
    default: 4,
  },
  color: {
    type: String,
    default: "primary",
  },
});
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  border-radius: inherit;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-message {
  margin-top: 16px;
  color: white;
  font-size: 1rem;
}
</style>
