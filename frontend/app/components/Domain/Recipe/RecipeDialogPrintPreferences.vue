<template>
  <BaseDialog
    v-model="dialog"
    :icon="$globals.icons.printerSettings"
    :title="$t('general.print-preferences')"
    width="70%"
    max-width="816px"
  >
    <div class="px-6 py-4">
      <!-- Print config controls -->
      <div class="flex flex-wrap gap-6 mb-4">
        <!-- Image position toggle -->
        <div class="flex flex-col items-center gap-2">
          <span class="text-xs font-medium text-on-surface/60">{{ $t('recipe.recipe-image') }}</span>
          <div class="inline-flex rounded-lg border border-border overflow-hidden">
            <button
              v-for="pos in [ImagePosition.left, ImagePosition.right, ImagePosition.hidden]"
              :key="pos"
              type="button"
              class="px-3 py-2 transition-colors"
              :class="preferences.imagePosition === pos ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-primary/5'"
              @click="preferences.imagePosition = pos"
            >
              <AppIcon
                :path="pos === ImagePosition.left ? $globals.icons.dockLeft : pos === ImagePosition.right ? $globals.icons.dockRight : $globals.icons.windowClose"
                size="sm"
              />
            </button>
          </div>
        </div>

        <!-- Toggle switches -->
        <div class="flex flex-col gap-2">
          <label v-for="(pref, key) in prefToggles" :key="key" class="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              role="switch"
              :aria-checked="preferences[key]"
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0"
              :class="preferences[key] ? 'bg-primary' : 'bg-on-surface/20'"
              @click="preferences[key] = !preferences[key]"
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                :class="preferences[key] ? 'translate-x-4' : 'translate-x-0.5'"
              />
            </button>
            <span class="text-sm text-on-surface">{{ pref }}</span>
          </label>
        </div>
      </div>

      <!-- Print preview -->
      <div class="rounded-lg border border-border max-h-[40vh] overflow-y-auto">
        <RecipePrintView :recipe="recipe" />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { Recipe } from "~/lib/api/types/recipe";
import { ImagePosition, useUserPrintPreferences } from "~/composables/use-users/preferences";
import RecipePrintView from "~/components/Domain/Recipe/RecipePrintView.vue";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";

interface Props {
  recipe?: NoUndefinedField<Recipe>;
}
withDefaults(defineProps<Props>(), {
  recipe: undefined,
});

const { $globals } = useNuxtApp();
const i18n = useI18n();
const dialog = defineModel<boolean>({ default: false });
const preferences = useUserPrintPreferences();

const prefToggles = computed(() => ({
  showDescription: i18n.t("recipe.description") as string,
  showNotes: i18n.t("recipe.notes") as string,
  showNutrition: i18n.t("recipe.nutrition") as string,
  expandChildRecipes: i18n.t("recipe.include-linked-recipe-ingredients") as string,
}));
</script>
