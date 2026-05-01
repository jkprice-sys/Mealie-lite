<template>
  <div>
    <form ref="domUrlForm" @submit.prevent="submitForm">

      <!-- Title -->
      <h2 class="text-lg font-semibold text-on-surface mb-1">
        {{ $t('recipe.scrape-recipe') }}
      </h2>

      <!-- Description -->
      <div class="text-sm text-on-surface/70 mb-4 space-y-1">
        <p>{{ $t('recipe.scrape-recipe-description') }}</p>
        <p v-if="$appInfo.enableOpenaiTranscriptionServices">
          {{ $t('recipe.scrape-recipe-description-transcription') }}
        </p>
        <template v-if="!liteMode">
          <p>
            {{ $t('recipe.scrape-recipe-have-a-lot-of-recipes') }}
            <RouterLink :to="bulkImporterTarget" class="text-primary underline">
              {{ $t('recipe.scrape-recipe-suggest-bulk-importer') }}
            </RouterLink>.
          </p>
          <p>
            {{ $t('recipe.scrape-recipe-have-raw-html-or-json-data') }}
            <RouterLink :to="htmlOrJsonImporterTarget" class="text-primary underline">
              {{ $t('recipe.scrape-recipe-you-can-import-from-raw-data-directly') }}
            </RouterLink>.
          </p>
        </template>
      </div>

      <!-- URL input -->
      <div class="relative mb-1">
        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <AppIcon :path="$globals.icons.link" size="sm" class="text-on-surface/40" />
        </div>
        <input
          v-model="recipeUrl"
          type="url"
          autofocus
          :placeholder="$t('new-recipe.recipe-url')"
          required
          class="w-full rounded-lg border border-border bg-surface pl-9 pr-9 py-2.5 text-sm
                 text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                 focus:ring-primary focus:border-primary transition-colors"
        />
        <!-- Clear button -->
        <button
          v-if="recipeUrl"
          type="button"
          class="absolute inset-y-0 right-3 flex items-center text-on-surface/40
                 hover:text-on-surface/70 transition-colors"
          @click="clearUrl"
        >
          <AppIcon :path="$globals.icons.close" size="sm" />
        </button>
      </div>
      <p class="text-xs text-on-surface/50 mb-4 ml-1">
        {{ $t('new-recipe.url-form-hint') }}
      </p>

      <!-- Optional checkboxes (hidden in lite mode) -->
      <div v-if="!liteMode" class="flex flex-col gap-2 mb-4">
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
      <div class="flex flex-col items-center gap-2">
        <BaseButton
          type="submit"
          :disabled="!recipeUrl"
          :loading="state.loading"
          class="w-64"
        />
        <p class="text-xs text-on-surface/50 min-h-[1rem]">
          {{ createStatus }}&nbsp;
        </p>
      </div>
    </form>

    <!-- Error alert -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state.error"
        class="mt-6 rounded-lg bg-error text-white px-5 py-4"
      >
        <div class="flex items-center gap-2 font-semibold text-base mb-3">
          <AppIcon :path="$globals.icons.robot" size="lg" />
          {{ $t("new-recipe.error-title") }}
        </div>
        <hr class="border-white/30 my-3" />
        <p class="text-sm mb-2">
          {{ $t("recipe.scrape-recipe-website-being-blocked") }}
          <RouterLink :to="htmlOrJsonImporterTarget" class="underline text-white">
            {{ $t("recipe.scrape-recipe-try-importing-raw-html-instead") }}
          </RouterLink>
        </p>
        <p class="text-sm mb-3">{{ $t("new-recipe.error-details") }}</p>
        <div class="flex flex-wrap gap-4 text-sm">
          <a class="underline text-white" href="https://developers.google.com/search/docs/data-types/recipe" target="_blank" rel="noreferrer nofollow">
            {{ $t("new-recipe.google-ld-json-info") }}
          </a>
          <a class="underline text-white" href="https://github.com/mealie-recipes/mealie/issues" target="_blank" rel="noreferrer nofollow">
            {{ $t("new-recipe.github-issues") }}
          </a>
          <a class="underline text-white" href="https://schema.org/Recipe" target="_blank" rel="noreferrer nofollow">
            {{ $t("new-recipe.recipe-markup-specification") }}
          </a>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { useTagStore } from "~/composables/store/use-tag-store";
import { useNewRecipeOptions } from "~/composables/use-new-recipe-options";
import { useLiteMode } from "~/composables/use-lite-mode";

const liteMode = useLiteMode();

definePageMeta({
  key: route => route.path,
});

const state = reactive({ error: false, loading: false });

const auth = useMealieAuth();
const api = useUserApi();
const route = useRoute();
const router = useRouter();
const { $appInfo, $globals } = useNuxtApp();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const tags = useTagStore();

const {
  importKeywordsAsTags,
  importCategories,
  stayInEditMode,
  parseRecipe,
  navigateToRecipe,
} = useNewRecipeOptions({ enableParseRecipe: !liteMode });

const bulkImporterTarget    = computed(() => `/g/${groupSlug.value}/r/create/bulk`);
const htmlOrJsonImporterTarget = computed(() => `/g/${groupSlug.value}/r/create/html`);

// ── URL v-model synced to query param ────────────────────────────────────────
const recipeUrl = computed({
  set(val: string | null) {
    if (val !== null) {
      router.replace({ query: { ...route.query, recipe_import_url: val.trim() } });
    }
  },
  get() {
    return route.query.recipe_import_url as string | null;
  },
});

function clearUrl() {
  router.replace({ query: { ...route.query, recipe_import_url: undefined } });
}

// ── Handle response ───────────────────────────────────────────────────────────
function handleResponse(response: any, refreshTags = false) {
  if (response?.status !== 201) {
    state.error = true;
    state.loading = false;
    return;
  }
  if (refreshTags) tags.actions.refresh();
  navigateToRecipe(response.data, groupSlug.value, `/g/${groupSlug.value}/r/create/url`);
}

// ── Submit ────────────────────────────────────────────────────────────────────
const domUrlForm = ref<HTMLFormElement | null>(null);
const createStatus = ref<string | null>(null);

function submitForm() {
  createByUrl(recipeUrl.value, importKeywordsAsTags.value, importCategories.value);
}

async function createByUrl(url: string | null, keywords: boolean, categories: boolean) {
  if (!url || url.trim() === "") return;
  if (domUrlForm.value && !domUrlForm.value.checkValidity()) return;

  state.loading = true;
  state.error = false;
  const { response } = await api.recipes.createOneByUrl(
    url,
    keywords,
    categories,
    (message: string) => { createStatus.value = message; },
  );
  createStatus.value = null;
  handleResponse(response, keywords);
}

// ── Auto-submit if URL in query params on mount ───────────────────────────────
onMounted(() => {
  if (recipeUrl.value?.includes("https")) {
    const importKeywordsAsTagsParam = route.query.use_keywords;
    if (importKeywordsAsTagsParam === "1") importKeywordsAsTags.value = true;
    else if (importKeywordsAsTagsParam === "0") importKeywordsAsTags.value = false;

    const stayInEditModeParam = route.query.edit;
    if (stayInEditModeParam === "1") stayInEditMode.value = true;
    else if (stayInEditModeParam === "0") stayInEditMode.value = false;

    createByUrl(recipeUrl.value, importKeywordsAsTags.value, false);
  }
});

// ── Clean query on leave ──────────────────────────────────────────────────────
const isLeaving = ref(false);
onBeforeRouteLeave((to) => {
  if (isLeaving.value) return;
  isLeaving.value = true;
  router.replace({ query: undefined }).then(() => router.push(to));
});
</script>
