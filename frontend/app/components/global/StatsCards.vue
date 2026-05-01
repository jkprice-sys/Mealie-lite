<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to || undefined"
    class="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors"
    :class="[to ? 'hover:bg-primary/5 cursor-pointer' : '', minWidth ? `min-w-[${minWidth}]` : '']"
  >
    <!-- Icon avatar -->
    <div class="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
      <AppIcon :path="activeIcon" size="sm" class="text-on-primary" />
    </div>

    <div class="min-w-0">
      <div class="text-sm font-medium text-on-surface truncate">
        <slot name="title" />
      </div>
      <div class="text-xs text-on-surface/60 truncate">
        <slot name="value" />
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  icon: { type: String, default: null },
  minWidth: { type: String, default: "" },
  to: { type: String, default: null },
});

const { $globals } = useNuxtApp();
const activeIcon = computed(() => props.icon ?? $globals.icons.primary);
</script>
