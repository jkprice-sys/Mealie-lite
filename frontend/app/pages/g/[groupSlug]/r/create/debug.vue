<template>
  <div>
    <form @submit.prevent="debugUrl(recipeUrl)">
      <h2 class="text-lg font-semibold text-on-surface mb-1">
        {{ $t('recipe.recipe-debugger') }}
      </h2>
      <p class="text-sm text-on-surface/70 mb-4">
        {{ $t('recipe.recipe-debugger-description') }}
      </p>

      <!-- URL input -->
      <div class="relative mb-1">
        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <AppIcon :path="$globals.icons.link" size="sm" class="text-on-surface/40" />
        </div>
        <input
          v-model="recipeUrl"
          type="url"
          autofocus
          required
          :placeholder="$t('new-recipe.recipe-url')"
          class="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2.5 text-sm
                 text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
      <p class="text-xs text-on-surface/50 mb-4 ml-1">
        {{ $t('new-recipe.url-form-hint') }}
      </p>

      <!-- OpenAI option -->
      <div v-if="$appInfo.enableOpenai" class="mb-4">
        <p class="text-sm text-on-surface/70 mb-2">
          {{ $t('recipe.recipe-debugger-use-openai-description') }}
        </p>
        <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
          <input v-model="state.useOpenAI" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
          {{ $t('recipe.use-openai') }}
        </label>
      </div>

      <!-- Submit -->
      <div class="flex justify-center">
        <BaseButton
          type="submit"
          :disabled="!recipeUrl"
          :loading="state.loading"
          color="info"
          class="w-64"
        >
          <template #icon>
            {{ $globals.icons.robot }}
          </template>
          {{ $t('recipe.debug') }}
        </BaseButton>
      </div>
    </form>

    <!-- Debug results -->
    <section v-if="debugData" class="mt-6">
      <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface mb-3">
        <input v-model="debugTreeView" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
        {{ $t('recipe.tree-view') }}
      </label>
      <RecipeJsonEditor
        v-model="debugData"
        height="700px"
        :mode="debugTreeView ? 'tree' : 'text'"
        :main-menu-bar="false"
        :read-only="true"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { Recipe } from "~/lib/api/types/recipe";

const { $globals, $appInfo } = useNuxtApp();

const state = reactive({
  loading: false,
  useOpenAI: false,
});

const api = useUserApi();
const route = useRoute();
const router = useRouter();

const recipeUrl = computed({
  set(recipe_import_url: string | null) {
    if (recipe_import_url !== null) {
      router.replace({ query: { ...route.query, recipe_import_url: recipe_import_url.trim() } });
    }
  },
  get() {
    return route.query.recipe_import_url as string | null;
  },
});

const debugTreeView = ref(false);
const debugData = ref<Recipe | null>(null);

async function debugUrl(url: string | null) {
  if (!url) return;
  state.loading = true;
  const { data } = await api.recipes.testCreateOneUrl(url, state.useOpenAI);
  state.loading = false;
  debugData.value = data;
}
</script>
