<template>
  <div>
    <RecipeIngredients
      :value="recipe.recipeIngredient"
      :scale="scale"
      :is-cook-mode="isCookMode"
    />
    <div v-if="!isEditMode && recipe.tools && recipe.tools.length > 0">
      <h2 class="mt-4 text-xl font-medium opacity-80">
        {{ $t('tool.required-tools') }}
      </h2>
      <ul class="mt-2 space-y-1">
        <li
          v-for="(tool, index) in recipe.tools"
          :key="index"
          class="flex items-center gap-2 px-1 py-1"
        >
          <input
            v-model="recipeTools[index].onHand"
            type="checkbox"
            class="w-4 h-4 shrink-0 rounded border-border accent-secondary"
            @change="updateTool(index)"
          />
          <span class="text-sm text-on-surface">{{ tool.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { usePageState, usePageUser } from "~/composables/recipe-page/shared-state";
import { useToolStore } from "~/composables/store";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe, RecipeTool } from "~/lib/api/types/recipe";
import RecipeIngredients from "~/components/Domain/Recipe/RecipeIngredients.vue";

interface RecipeToolWithOnHand extends RecipeTool {
  onHand: boolean;
}

interface Props {
  recipe: NoUndefinedField<Recipe>;
  scale: number;
  isCookMode?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isCookMode: false,
});

const { isOwnGroup } = useLoggedInState();

const toolStore = isOwnGroup.value ? useToolStore() : null;
const { user } = usePageUser();
const { isEditMode } = usePageState(props.recipe.slug);

const recipeTools = ref<RecipeToolWithOnHand[]>([]);
watch(() => props.recipe.tools, () => {
  if (!(user.householdSlug && toolStore)) {
    recipeTools.value = props.recipe.tools.map(tool => ({ ...tool, onHand: false }) as RecipeToolWithOnHand);
  }
  else {
    recipeTools.value = props.recipe.tools.map((tool) => {
      const onHand = tool.householdsWithTool?.includes(user.householdSlug) || false;
      return { ...tool, onHand } as RecipeToolWithOnHand;
    });
  }
}, { immediate: true });

function updateTool(index: number) {
  if (user.id && user.householdSlug && toolStore) {
    const tool = recipeTools.value[index];
    if (tool.onHand && !tool.householdsWithTool?.includes(user.householdSlug)) {
      if (!tool.householdsWithTool) {
        tool.householdsWithTool = [user.householdSlug];
      }
      else {
        tool.householdsWithTool.push(user.householdSlug);
      }
    }
    else if (!tool.onHand && tool.householdsWithTool?.includes(user.householdSlug)) {
      tool.householdsWithTool = tool.householdsWithTool.filter(h => h !== user.householdSlug);
    }

    toolStore.actions.updateOne(tool);
  }
  else {
    console.log("no user, skipping server update");
  }
}
</script>
