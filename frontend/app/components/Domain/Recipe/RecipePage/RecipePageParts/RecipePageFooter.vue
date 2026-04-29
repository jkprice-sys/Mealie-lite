<template>
  <div>
    <!-- Original URL: editable in edit mode, link in view mode -->
    <div class="flex justify-end">
      <div v-if="isEditForm" class="w-full mt-10">
        <label class="block text-xs text-on-surface/60 mb-1">
          {{ $t('recipe.original-url') }}
        </label>
        <input
          v-model="recipe.orgURL"
          type="url"
          class="w-full rounded border border-border bg-surface px-3 py-1.5 text-sm text-on-surface
                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary
                 focus:border-primary transition-colors"
        />
      </div>
      <a
        v-else-if="recipe.orgURL && !isCookMode"
        :href="recipe.orgURL"
        target="_blank"
        class="text-sm text-secondary hover:underline transition-colors -mr-2"
      >
        {{ $t("recipe.original-url") }}
      </a>
    </div>

    <!-- API Extras (edit mode only, shown to advanced users) -->
    <AdvancedOnly>
      <div v-if="isEditForm" class="mb-2 -mx-2 mt-4">
        <h3 class="text-xl font-medium opacity-80 px-4 py-2 text-on-surface">
          {{ $t('recipe.api-extras') }}
        </h3>
        <hr class="ml-4 border-t border-border" />
        <div class="px-4 py-3 text-sm text-on-surface">
          <p class="mb-2 text-on-surface/70">{{ $t('recipe.api-extras-description') }}</p>

          <!-- Existing extras -->
          <div
            v-for="(_, key) in recipe.extras"
            :key="key"
            class="flex items-center gap-2 mt-2"
            style="max-width: 432px;"
          >
            <button
              type="button"
              class="bs-btn bs-btn-error rounded-full p-1.5 shrink-0"
              @click="removeApiExtra(key)"
            >
              <AppIcon :path="$globals.icons.delete" size="sm" />
            </button>
            <div class="flex-1">
              <label class="block text-xs text-on-surface/60 mb-0.5">{{ key }}</label>
              <input
                v-model="recipe.extras[key]"
                type="text"
                class="w-full rounded border border-border bg-surface px-3 py-1 text-sm text-on-surface
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>

          <!-- Add new extra -->
          <div class="flex items-end gap-3 ml-2 mt-3">
            <div>
              <label class="block text-xs text-on-surface/60 mb-1">
                {{ $t('recipe.message-key') }}
              </label>
              <input
                v-model="apiNewKey"
                type="text"
                style="min-width: 200px;"
                class="rounded border border-border bg-surface px-3 py-1.5 text-sm text-on-surface
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
            <BaseButton
              create
              size="small"
              class="ml-2 mb-0.5"
              @click="createApiExtra"
            />
          </div>
        </div>
      </div>
    </AdvancedOnly>
  </div>
</template>

<script setup lang="ts">
import { usePageState } from "~/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const { isEditForm, isCookMode } = usePageState(recipe.value.slug);
const apiNewKey = ref("");

function createApiExtra() {
  if (!recipe.value) {
    return;
  }
  if (!recipe.value.extras) {
    recipe.value.extras = {};
  }
  // check for duplicate keys
  if (Object.keys(recipe.value.extras).includes(apiNewKey.value)) {
    return;
  }
  recipe.value.extras[apiNewKey.value] = "";
  apiNewKey.value = "";
}

function removeApiExtra(key: string | number) {
  if (!recipe.value) {
    return;
  }
  if (!recipe.value.extras) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete recipe.value.extras[key];
  recipe.value.extras = { ...recipe.value.extras };
}
</script>
