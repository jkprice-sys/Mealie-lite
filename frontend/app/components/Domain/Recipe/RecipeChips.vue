<template>
  <div v-if="items.length > 0" class="flex flex-wrap gap-1">
    <h2 v-if="title" class="w-full mt-4 text-base font-medium text-on-surface">
      {{ title }}
    </h2>
    <button
      v-for="category in items.slice(0, limit)"
      :key="category.name"
      type="button"
      :class="[
        'inline-flex items-center rounded px-2 py-0.5 font-medium bg-accent text-white',
        'transition-colors hover:brightness-90 cursor-pointer',
        small ? 'text-xs' : 'text-sm',
      ]"
      @click.prevent="$emit('item-selected', category, urlPrefix)"
    >
      {{ truncateText(category.name) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { RecipeCategory, RecipeTag, RecipeTool } from "~/lib/api/types/recipe";

export type UrlPrefixParam = "tags" | "categories" | "tools";

interface Props {
  truncate?: boolean;
  items?: RecipeCategory[] | RecipeTag[] | RecipeTool[];
  title?: boolean;
  urlPrefix?: UrlPrefixParam;
  limit?: number;
  small?: boolean;
  maxWidth?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  truncate: false,
  items: () => [],
  title: false,
  urlPrefix: "categories",
  limit: 999,
  small: false,
  maxWidth: null,
});

defineEmits(["item-selected"]);

function truncateText(text: string, length = 20, clamp = "...") {
  if (!props.truncate) return text;
  const node = document.createElement("div");
  node.innerHTML = text;
  const content = node.textContent || "";
  return content.length > length ? content.slice(0, length) + clamp : content;
}
</script>
