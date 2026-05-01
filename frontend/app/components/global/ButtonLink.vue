<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 my-1 mx-1 text-sm font-medium text-on-surface hover:bg-primary/5 transition-colors"
  >
    <AppIcon v-if="icon" :path="icon" size="sm" />
    {{ text }}
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
  to: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "",
  },
});
</script>
