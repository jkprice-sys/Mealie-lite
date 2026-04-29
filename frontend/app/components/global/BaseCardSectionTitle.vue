<template>
  <!-- BaseCardSectionTitle — section headings with optional icon + divider -->
  <div
    class="pb-2"
    :class="{ 'mt-8': section }"
  >
    <div class="flex items-center gap-2 py-0">
      <AppIcon
        v-if="icon"
        :path="icon"
        size="sm"
        class="text-on-surface/60 shrink-0"
      />
      <h3 class="text-lg font-normal text-on-surface">
        {{ title }}
      </h3>
    </div>
    <p v-if="$slots.default" class="pt-1 text-sm text-on-surface/70">
      <slot />
    </p>
    <hr class="mt-1 mb-3 border-t border-border" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  title:   { type: String,  required: true },
  icon:    { type: String,  default: "" },
  section: { type: Boolean, default: false },
});
</script>
