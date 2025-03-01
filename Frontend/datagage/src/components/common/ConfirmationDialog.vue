<template>
  <v-dialog
    v-model="dialogModel"
    :max-width="maxWidth"
    @click:outside="onCancel"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>

      <v-card-text>
        <slot>{{ message }}</slot>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          :color="cancelBtnColor"
          :variant="cancelBtnVariant"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelBtnText }}
        </v-btn>

        <v-btn
          :color="confirmBtnColor"
          :loading="loading"
          :disabled="loading"
          @click="onConfirm"
        >
          {{ confirmBtnText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Confirmation",
  },
  message: {
    type: String,
    default: "Are you sure you want to proceed?",
  },
  confirmBtnText: {
    type: String,
    default: "Confirm",
  },
  cancelBtnText: {
    type: String,
    default: "Cancel",
  },
  confirmBtnColor: {
    type: String,
    default: "primary",
  },
  cancelBtnColor: {
    type: String,
    default: "grey",
  },
  cancelBtnVariant: {
    type: String,
    default: "text",
  },
  maxWidth: {
    type: [String, Number],
    default: "500",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const onConfirm = () => {
  emit("confirm");
};

const onCancel = () => {
  if (!props.loading) {
    emit("cancel");
    emit("update:modelValue", false);
  }
};
</script>
