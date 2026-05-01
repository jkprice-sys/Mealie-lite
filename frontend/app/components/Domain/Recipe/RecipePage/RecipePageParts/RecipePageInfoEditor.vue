<template>
  <div class="space-y-4">
    <!-- Recipe name -->
    <div>
      <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.recipe-name') }}</label>
      <input
        v-model="recipe.name"
        type="text"
        required
        class="w-full border-b border-border bg-transparent text-base text-on-surface
               focus:outline-none focus:border-primary transition-colors py-1"
      />
    </div>

    <!-- Servings / yield quantity / yield text -->
    <div class="grid grid-cols-6 gap-3">
      <div class="col-span-2">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.servings') }}</label>
        <input
          :value="recipe.recipeServings"
          type="number"
          min="0"
          step="any"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 focus:outline-none focus:border-primary transition-colors py-1"
          @input="recipe.recipeServings = parseFloat(($event.target as HTMLInputElement).value) || 0"
        />
      </div>
      <div class="col-span-2">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.yield') }}</label>
        <input
          :value="recipe.recipeYieldQuantity"
          type="number"
          min="0"
          step="any"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 focus:outline-none focus:border-primary transition-colors py-1"
          @input="recipe.recipeYieldQuantity = parseFloat(($event.target as HTMLInputElement).value) || 0"
        />
      </div>
      <div class="col-span-2">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.yield-text') }}</label>
        <input
          v-model="recipe.recipeYield"
          type="text"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 focus:outline-none focus:border-primary transition-colors py-1"
        />
      </div>
    </div>

    <!-- Times -->
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-[120px]">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.total-time') }}</label>
        <input
          v-model="recipe.totalTime"
          type="text"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 focus:outline-none focus:border-primary transition-colors py-1"
        />
      </div>
      <div class="flex-1 min-w-[120px]">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.prep-time') }}</label>
        <input
          v-model="recipe.prepTime"
          type="text"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 focus:outline-none focus:border-primary transition-colors py-1"
        />
      </div>
      <div class="flex-1 min-w-[120px]">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.perform-time') }}</label>
        <input
          v-model="recipe.performTime"
          type="text"
          class="w-full border-b border-border bg-transparent text-sm text-on-surface
                 focus:outline-none focus:border-primary transition-colors py-1"
        />
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.description') }}</label>
      <textarea
        v-model="recipe.description"
        rows="3"
        class="w-full border-b border-border bg-transparent text-sm text-on-surface
               focus:outline-none focus:border-primary transition-colors py-1 resize-y"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
</script>
