<template>
  <div>
    <!-- Landscape: image spans full width above; portrait: image shares row at 50% beside card -->
    <div class="flex justify-end flex-wrap items-stretch">
      <!-- Landscape image (rendered above the card, full width) -->
      <RecipePageInfoCardImage
        v-if="landscape"
        :recipe="recipe"
      />

      <!-- Info card: full-width in landscape, half-width in portrait -->
      <div
        class="flex flex-col justify-center items-center"
        :class="landscape ? 'w-full' : 'w-full sm:w-1/2'"
      >
        <div class="w-full px-4 py-4">
          <!-- Title + rating -->
          <div class="flex flex-col items-center">
            <h2 class="text-2xl font-normal p-0 text-center opacity-80 break-words w-full">
              {{ recipe.name }}
            </h2>
            <RecipeRating
              :key="recipe.slug"
              :model-value="recipe.rating"
              :recipe-id="recipe.id"
              :slug="recipe.slug"
            />
          </div>

          <hr class="my-2 border-t border-border" />

          <SafeMarkdown :source="recipe.description" class="my-3" />

          <hr v-if="recipe.description" class="border-t border-border" />

          <!-- Yield, last-made, and time cards -->
          <div class="flex flex-row flex-wrap justify-center mt-2">
            <!-- Yield + last made -->
            <div class="mx-6">
              <div
                v-if="recipe.recipeYieldQuantity || recipe.recipeYield"
                class="flex flex-wrap justify-center mb-4"
              >
                <RecipeYield
                  :yield-quantity="recipe.recipeYieldQuantity"
                  :yield-text="recipe.recipeYield"
                  :scale="recipeScale"
                />
              </div>
              <div class="flex flex-wrap justify-center mb-4">
                <RecipeLastMade
                  v-if="isOwnGroup"
                  :recipe="recipe"
                />
              </div>
            </div>

            <!-- Time card -->
            <div v-if="recipe.prepTime || recipe.totalTime || recipe.performTime" class="mx-6">
              <RecipeTimeCard
                container-class="flex flex-wrap justify-center"
                :prep-time="recipe.prepTime"
                :total-time="recipe.totalTime"
                :perform-time="recipe.performTime"
                class="mb-4"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Portrait image (rendered beside the card, max half width) -->
      <RecipePageInfoCardImage
        v-if="!landscape"
        :recipe="recipe"
        max-width="50%"
        class="my-auto"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import RecipeRating from "~/components/Domain/Recipe/RecipeRating.vue";
import RecipeLastMade from "~/components/Domain/Recipe/RecipeLastMade.vue";
import RecipeTimeCard from "~/components/Domain/Recipe/RecipeTimeCard.vue";
import RecipeYield from "~/components/Domain/Recipe/RecipeYield.vue";
import RecipePageInfoCardImage from "~/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInfoCardImage.vue";
import type { Recipe } from "~/lib/api/types/recipe";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  recipeScale?: number;
  landscape: boolean;
}

withDefaults(defineProps<Props>(), {
  recipeScale: 1,
});

const { isOwnGroup } = useLoggedInState();
</script>
