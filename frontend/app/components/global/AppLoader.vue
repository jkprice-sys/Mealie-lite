<template>
  <div class="flex flex-col items-center justify-center gap-2 my-3">
    <!-- Spinner -->
    <div
      class="animate-spin rounded-full border-solid border-primary/30 border-t-primary"
      :class="spinnerClass"
    />
    <!-- Waiting text -->
    <div v-if="!small && !tiny" class="text-sm text-on-surface/60 text-center">
      <slot>{{ waitingTextCalculated }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  tiny: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
  medium: {
    type: Boolean,
    default: true,
  },
  large: {
    type: Boolean,
    default: false,
  },
  waitingText: {
    type: String,
    default: undefined,
  },
});

const spinnerClass = computed(() => {
  if (props.tiny) return "w-6 h-6 border-2";
  if (props.small) return "w-10 h-10 border-2";
  if (props.large) return "w-24 h-24 border-4";
  return "w-16 h-16 border-[3px]";
});

const i18n = useI18n();
const waitingTextCalculated = props.waitingText == null ? i18n.t("general.loading-recipes") : props.waitingText;
</script>
