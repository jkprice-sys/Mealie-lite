<template>
  <div v-if="value && value.length > 0">
    <!-- Header (hidden in cook mode) -->
    <div v-if="!isCookMode" class="flex items-center mt-1 mb-2">
      <h2 class="text-xl font-medium opacity-80">
        {{ $t("recipe.ingredients") }}
      </h2>
      <AppButtonCopy
        btn-class="ml-auto"
        :copy-text="ingredientCopyText"
      />
    </div>

    <!-- Ingredient list -->
    <div>
      <div
        v-for="(ingredient, index) in value"
        :key="'ingredient' + index"
      >
        <!-- Section title -->
        <template v-if="showTitleEditor[index]">
          <h3 class="mt-3 mb-1 text-sm font-semibold text-on-surface/70 uppercase tracking-wide">
            {{ ingredient.title }}
          </h3>
          <hr class="border-border mb-1" />
        </template>

        <!-- Ingredient row -->
        <label
          class="flex items-center gap-2 py-1 cursor-pointer select-none rounded
                 hover:bg-primary/5 transition-colors px-1 -mx-1"
          :class="{ 'opacity-45': checked[index] }"
          @click.prevent="toggleChecked(index)"
        >
          <input
            :checked="checked[index]"
            type="checkbox"
            class="w-4 h-4 shrink-0 rounded border-border accent-primary"
            @change="toggleChecked(index)"
          />
          <span class="text-sm text-on-surface">
            <RecipeIngredientListItem
              :ingredient="ingredient"
              :scale="scale"
            />
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RecipeIngredientListItem from "./RecipeIngredientListItem.vue";
import { useIngredientTextParser } from "~/composables/recipes";
import type { RecipeIngredient } from "~/lib/api/types/recipe";

interface Props {
  value?: RecipeIngredient[];
  scale?: number;
  isCookMode?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  scale: 1,
  isCookMode: false,
});

const { parseIngredientText } = useIngredientTextParser();

function validateTitle(title?: string | null) {
  return !(title === undefined || title === "" || title === null);
}

const checked = ref(props.value.map(() => false));
const showTitleEditor = computed(() => props.value.map(x => validateTitle(x.title)));

const ingredientCopyText = computed(() => {
  const components: string[] = [];
  props.value.forEach((ingredient) => {
    if (ingredient.title) {
      if (components.length) components.push("");
      components.push(`[${ingredient.title}]`);
    }
    components.push(parseIngredientText(ingredient, props.scale, false));
  });
  return components.join("\n");
});

function toggleChecked(index: number) {
  checked.value.splice(index, 1, !checked.value[index]);
}
</script>

<style>
.dense-markdown p {
  margin: auto !important;
}
</style>
