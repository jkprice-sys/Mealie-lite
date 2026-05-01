<template>
  <div class="flex justify-between items-center mx-2 py-1">
    <!-- Drag handle + label name -->
    <div class="handle flex items-center gap-2 cursor-grab select-none">
      <AppIcon
        :path="$globals.icons.tags"
        size="sm"
        :style="labelColor ? `color: ${labelColor}` : ''"
        class="shrink-0 text-on-surface/50"
      />
      <span class="text-sm text-on-surface">{{ modelValue.label.name }}</span>
    </div>

    <!-- Drag icon (acts as handle too) -->
    <button type="button" class="handle ml-auto p-1 rounded text-on-surface/40 hover:text-on-surface cursor-grab">
      <AppIcon :path="$globals.icons.arrowUpDown" size="sm" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ShoppingListMultiPurposeLabelOut } from "~/lib/api/types/household";

const props = defineProps<{
  useColor?: boolean;
}>();

const modelValue = defineModel<ShoppingListMultiPurposeLabelOut>({ required: true });
const { $globals } = useNuxtApp();

const labelColor = ref<string | undefined>(props.useColor ? modelValue.value.label.color : undefined);
</script>
