<template>
  <div>
    <!-- Recipe Categories -->
    <div
      v-if="recipe.recipeCategory.length > 0 || isEditForm"
      class="bs-card"
      :class="{ 'mt-10': !isEditForm }"
    >
      <h3 class="px-4 py-2 font-semibold text-on-surface">
        {{ $t("recipe.categories") }}
      </h3>
      <hr class="mx-2 border-t border-border" />
      <div class="px-4 py-3">
        <RecipeOrganizerSelector
          v-if="isEditForm"
          v-model="recipe.recipeCategory"
          :return-object="true"
          :show-add="true"
          selector-type="categories"
        />
        <RecipeChips
          v-else
          :items="recipe.recipeCategory"
          v-bind="$attrs"
        />
      </div>
    </div>

    <!-- Recipe Tags -->
    <div
      v-if="recipe.tags.length > 0 || isEditForm"
      class="bs-card mt-4"
    >
      <h3 class="px-4 py-2 font-semibold text-on-surface">
        {{ $t("tag.tags") }}
      </h3>
      <hr class="mx-2 border-t border-border" />
      <div class="px-4 py-3">
        <RecipeOrganizerSelector
          v-if="isEditForm"
          v-model="recipe.tags"
          :return-object="true"
          :show-add="true"
          selector-type="tags"
        />
        <RecipeChips
          v-else
          :items="recipe.tags"
          url-prefix="tags"
          v-bind="$attrs"
        />
      </div>
    </div>

    <!-- Recipe Tools (edit mode only) -->
    <div
      v-if="isEditForm"
      class="bs-card mt-2"
    >
      <h3 class="px-4 py-2 font-semibold text-on-surface">
        {{ $t('tool.required-tools') }}
      </h3>
      <hr class="mx-2 border-t border-border" />
      <div class="px-4 py-3">
        <RecipeOrganizerSelector
          v-model="recipe.tools"
          selector-type="tools"
          v-bind="$attrs"
        />
      </div>
    </div>

    <!-- Nutrition + Assets (controlled by recipe settings) -->
    <RecipeNutrition
      v-if="recipe.settings.showNutrition && !liteMode"
      v-model="recipe.nutrition"
      class="mt-4"
      :edit="isEditForm"
    />
    <RecipeAssets
      v-if="recipe.settings.showAssets"
      v-model="recipe.assets"
      :edit="isEditForm"
      :slug="recipe.slug"
      :recipe-id="recipe.id"
    />
  </div>
</template>

<script setup lang="ts">
import { usePageState } from "~/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";
import RecipeOrganizerSelector from "@/components/Domain/Recipe/RecipeOrganizerSelector.vue";
import RecipeNutrition from "~/components/Domain/Recipe/RecipeNutrition.vue";
import RecipeChips from "@/components/Domain/Recipe/RecipeChips.vue";
import RecipeAssets from "@/components/Domain/Recipe/RecipeAssets.vue";
import { useLiteMode } from "~/composables/use-lite-mode";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const { isEditForm } = usePageState(recipe.value.slug);
const liteMode = useLiteMode();
</script>
