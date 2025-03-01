<template>
  <div
    class="page-header"
    :class="{ 'with-actions': !!$slots.actions }"
  >
    <div>
      <h1 class="text-h4">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="text-subtitle-1"
      >
        {{ subtitle }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="page-actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header.with-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

@media (max-width: 600px) {
  .page-header.with-actions {
    flex-direction: column;
    gap: 16px;
  }

  .page-actions {
    align-self: flex-start;
  }
}
</style>
