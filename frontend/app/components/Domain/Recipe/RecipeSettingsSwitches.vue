<template>
  <div class="space-y-2">
    <label
      v-for="(_, key) in model"
      :key="key"
      class="flex items-center justify-between gap-3 cursor-pointer text-sm text-on-surface"
      :class="{ 'opacity-50 cursor-not-allowed': key === 'locked' && !isOwner }"
    >
      <span>{{ labels[key] }}</span>
      <div class="relative shrink-0">
        <input
          v-model="model[key]"
          type="checkbox"
          class="sr-only peer"
          :disabled="key === 'locked' && !isOwner"
        />
        <div class="w-10 h-6 bg-border rounded-full peer-checked:bg-primary transition-colors" />
        <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 pointer-events-none" />
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { RecipeSettings } from "~/lib/api/types/recipe";
import { useI18n } from "#imports";

defineProps<{ isOwner?: boolean }>();

const model = defineModel<RecipeSettings>({ required: true });

const i18n = useI18n();
const labels: Record<keyof RecipeSettings, string> = {
  public:          i18n.t("recipe.public-recipe"),
  showNutrition:   i18n.t("recipe.show-nutrition-values"),
  showAssets:      i18n.t("asset.show-assets"),
  landscapeView:   i18n.t("recipe.landscape-view-coming-soon"),
  disableComments: i18n.t("recipe.disable-comments"),
  locked:          i18n.t("recipe.locked"),
};
</script>
