<template>
  <span
    v-bind="$attrs"
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium truncate max-w-full"
    :style="[
      label.color ? { backgroundColor: label.color, color: textColor } : {},
      !label.color ? { backgroundColor: 'var(--color-border)', color: 'var(--color-on-surface)' } : {},
    ]"
  >
    {{ label.name }}
  </span>
</template>

<script setup lang="ts">
import { getTextColor } from "~/composables/use-text-color";
import type { MultiPurposeLabelSummary } from "~/lib/api/types/recipe";

const props = defineProps<{
  label: MultiPurposeLabelSummary;
}>();

const textColor = computed(() => getTextColor(props.label.color));
</script>
