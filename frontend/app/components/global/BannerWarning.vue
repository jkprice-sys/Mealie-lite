<template>
  <div class="flex items-start gap-3 rounded-lg border-l-4 border-warning bg-warning/10 px-4 py-3">
    <AppIcon :path="$globals.icons.alert" size="sm" class="shrink-0 mt-0.5 text-warning" />
    <div class="text-sm text-on-surface">
      <b v-if="title" class="block mb-0.5">{{ title }}</b>
      <div v-if="description">{{ description }}</div>
      <div v-if="$slots.default" class="py-2">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $globals } = useNuxtApp();

defineProps({
  title: {
    type: String,
    required: false,
    default: "",
  },
  description: {
    type: String,
    required: false,
    default: "",
  },
});
</script>
