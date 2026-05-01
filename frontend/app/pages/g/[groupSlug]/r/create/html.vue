<template>
  <form @submit.prevent="createFromHtmlOrJson(newRecipeData, importKeywordsAsTags, importCategories, newRecipeUrl)">

    <h2 class="text-lg font-semibold text-on-surface mb-1">
      {{ $t('recipe.import-from-html-or-json') }}
    </h2>
    <div class="text-sm text-on-surface/70 mb-4 space-y-1">
      <p>{{ $t("recipe.import-from-html-or-json-description") }}</p>
      <p>
        {{ $t("recipe.json-import-format-description-colon") }}
        <a href="https://schema.org/Recipe" target="_blank" class="text-primary underline">
          https://schema.org/Recipe
        </a>
      </p>
    </div>

    <!-- JSON editor toggle -->
    <label class="flex items-center gap-3 cursor-pointer text-sm text-on-surface mb-4">
      <div class="relative shrink-0">
        <input
          v-model="state.isEditJSON"
          type="checkbox"
          class="sr-only peer"
          @change="handleIsEditJson"
        />
        <div class="w-10 h-6 bg-border rounded-full peer-checked:bg-primary transition-colors" />
        <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
      </div>
      {{ $t('recipe.json-editor') }}
    </label>

    <!-- Optional source URL -->
    <div class="relative mb-1">
      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <AppIcon :path="$globals.icons.link" size="sm" class="text-on-surface/40" />
      </div>
      <input
        v-model="newRecipeUrl"
        type="url"
        :placeholder="$t('new-recipe.recipe-url')"
        class="w-full max-w-[500px] rounded-lg border border-border bg-surface pl-9 pr-4 py-2.5 text-sm
               text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
               focus:ring-primary focus:border-primary transition-colors"
      />
    </div>
    <p class="text-xs text-on-surface/50 mb-4 ml-1">
      {{ $t('new-recipe.copy-and-paste-the-source-url-of-your-data-optional') }}
    </p>

    <!-- JSON editor or plain textarea -->
    <RecipeJsonEditor
      v-if="state.isEditJSON"
      v-model="newRecipeData"
      height="250px"
      mode="code"
      :main-menu-bar="false"
    />
    <textarea
      v-else
      v-model="newRecipeData"
      autofocus
      :placeholder="$t('new-recipe.recipe-html-or-json')"
      rows="8"
      class="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-mono
             text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
             focus:ring-primary focus:border-primary transition-colors resize-y"
    />

    <!-- Options (non-lite only) -->
    <div v-if="!liteMode" class="flex flex-col gap-2 my-4">
      <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
        <input v-model="importKeywordsAsTags" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
        {{ $t('recipe.import-original-keywords-as-tags') }}
      </label>
      <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
        <input v-model="importCategories" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
        {{ $t('recipe.import-original-categories') }}
      </label>
      <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
        <input v-model="stayInEditMode" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
        {{ $t('recipe.stay-in-edit-mode') }}
      </label>
      <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
        <input v-model="parseRecipe" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
        {{ $t('recipe.parse-recipe-ingredients-after-import') }}
      </label>
    </div>

    <!-- Submit -->
    <div class="flex flex-col items-center gap-2 mt-4">
      <BaseButton
        type="submit"
        :disabled="!newRecipeData"
        :loading="state.loading"
        class="w-64"
      />
      <p class="text-xs text-on-surface/50 min-h-[1rem]">
        {{ createStatus }}&nbsp;
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { AxiosResponse } from "axios";
import { useTagStore } from "~/composables/store/use-tag-store";
import { useUserApi } from "~/composables/api";
import { useNewRecipeOptions } from "~/composables/use-new-recipe-options";
import { useLiteMode } from "~/composables/use-lite-mode";

const liteMode = useLiteMode();
const { $globals } = useNuxtApp();

const state = reactive({
  error: false,
  loading: false,
  isEditJSON: false,
});

const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const api = useUserApi();
const tags = useTagStore();

const {
  importKeywordsAsTags,
  importCategories,
  stayInEditMode,
  parseRecipe,
  navigateToRecipe,
} = useNewRecipeOptions({ enableParseRecipe: !liteMode });

function handleResponse(response: AxiosResponse<string> | null, refreshTags = false) {
  if (response?.status !== 201) {
    state.error = true;
    state.loading = false;
    return;
  }
  if (refreshTags) tags.actions.refresh();
  navigateToRecipe(response.data, groupSlug.value, `/g/${groupSlug.value}/r/create/html`);
}

const newRecipeData = ref<string | object | null>(null);
const newRecipeUrl = ref<string | null>(null);

function handleIsEditJson() {
  if (state.isEditJSON) {
    if (newRecipeData.value) {
      try {
        newRecipeData.value = JSON.parse(newRecipeData.value as string);
      }
      catch {
        newRecipeData.value = { data: newRecipeData.value };
      }
    }
    else {
      newRecipeData.value = {};
    }
  }
  else if (newRecipeData.value && Object.keys(newRecipeData.value as object).length > 0) {
    newRecipeData.value = JSON.stringify(newRecipeData.value);
  }
  else {
    newRecipeData.value = null;
  }
}
handleIsEditJson();

const createStatus = ref<string | null>(null);

async function createFromHtmlOrJson(
  htmlOrJsonData: string | object | null,
  keywords: boolean,
  categories: boolean,
  url: string | null = null,
) {
  if (!htmlOrJsonData) return;

  const dataString = typeof htmlOrJsonData === "string"
    ? htmlOrJsonData
    : JSON.stringify(htmlOrJsonData);

  state.loading = true;
  const { response } = await api.recipes.createOneByHtmlOrJson(
    dataString,
    keywords,
    categories,
    url,
    (message: string) => { createStatus.value = message; },
  );
  createStatus.value = null;
  handleResponse(response, keywords);
}
</script>
