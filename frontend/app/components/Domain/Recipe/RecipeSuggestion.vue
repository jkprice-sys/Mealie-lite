<template>
  <div class="rounded-lg border border-border bg-surface shadow-md p-3">
    <RecipeCardMobile
      :name="recipe.name"
      :description="recipe.description"
      :slug="recipe.slug"
      :rating="recipe.rating"
      :image="recipe.image"
      :recipe-id="recipe.id"
    />

    <div
      v-for="(organizer, idx) in missingOrganizers"
      :key="idx"
    >
      <div v-if="organizer.show" class="flex flex-row flex-wrap items-center gap-2 pt-2">
        <span class="text-xs text-on-surface/60">{{ $t("recipe-finder.missing") }}:</span>
        <label
          v-for="item in organizer.items"
          :key="item.item.id"
          class="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs cursor-pointer hover:bg-primary/5 transition-colors"
          :class="item.selected ? 'bg-primary/10 border-primary' : ''"
        >
          <input
            type="checkbox"
            :checked="item.selected"
            class="accent-primary"
            @change="handleCheckbox(item)"
          />
          {{ organizer.getLabel(item.item) }}
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RecipeCardMobile from "./RecipeCardMobile.vue";
import type { IngredientFood, RecipeSummary, RecipeTool } from "~/lib/api/types/recipe";

interface Organizer {
  type: "food" | "tool";
  item: IngredientFood | RecipeTool;
  selected: boolean;
}

interface Props {
  recipe: RecipeSummary;
  missingFoods?: IngredientFood[] | null;
  missingTools?: RecipeTool[] | null;
  disableCheckbox?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  missingFoods: null,
  missingTools: null,
  disableCheckbox: false,
});

const emit = defineEmits<{
  "add-food": [food: IngredientFood];
  "remove-food": [food: IngredientFood];
  "add-tool": [tool: RecipeTool];
  "remove-tool": [tool: RecipeTool];
}>();

const { $globals } = useNuxtApp();
const missingOrganizers = computed(() => [
  {
    type: "food",
    show: props.missingFoods?.length,
    icon: $globals.icons.foods,
    items: props.missingFoods
      ? props.missingFoods.map(food => reactive({ type: "food", item: food, selected: false } as Organizer))
      : [],
    getLabel: (item: IngredientFood) => item.pluralName || item.name,
  },
  {
    type: "tool",
    show: props.missingTools?.length,
    icon: $globals.icons.tools,
    items: props.missingTools
      ? props.missingTools.map(tool => reactive({ type: "tool", item: tool, selected: false } as Organizer))
      : [],
    getLabel: (item: RecipeTool) => item.name,
  },
]);

function handleCheckbox(organizer: Organizer) {
  if (props.disableCheckbox) return;
  organizer.selected = !organizer.selected;
  if (organizer.selected) {
    if (organizer.type === "food") emit("add-food", organizer.item as IngredientFood);
    else emit("add-tool", organizer.item as RecipeTool);
  }
  else {
    if (organizer.type === "food") emit("remove-food", organizer.item as IngredientFood);
    else emit("remove-tool", organizer.item as RecipeTool);
  }
}
</script>
