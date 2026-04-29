<template>
  <div>
    <!-- Toolbar: title, random, sort, view toggle -->
    <div
      v-if="!disableToolbar"
      class="flex items-center gap-1 pb-2"
    >
      <AppIcon
        v-if="title"
        :path="displayTitleIcon"
        size="lg"
        class="shrink-0 text-on-surface/70"
      />
      <span class="text-base font-medium text-on-surface">{{ title }}</span>
      <div class="flex-1" />

      <!-- Random recipe button -->
      <button
        type="button"
        class="bs-btn bs-btn-sm bs-btn-ghost gap-1"
        :disabled="recipes.length === 0"
        @click="navigateRandom"
      >
        <AppIcon :path="$globals.icons.diceMultiple" size="sm" />
        <span v-if="!xs">{{ $t("general.random") }}</span>
      </button>

      <!-- Sort dropdown -->
      <Menu v-if="!disableSort" as="div" class="relative">
        <MenuButton
          class="bs-btn bs-btn-sm bs-btn-ghost gap-1"
          :disabled="sortLoading"
        >
          <AppIcon :path="preferences.sortIcon" size="sm" />
          <span v-if="!xs">{{ $t("general.sort") }}</span>
          <!-- Spinner while sort is loading -->
          <svg
            v-if="sortLoading"
            class="animate-spin w-3 h-3 text-on-surface/60"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </MenuButton>

        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems
            class="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg
                   shadow-lg py-1 z-50 min-w-44 focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="sortRecipes(EVENTS.az)"
              >
                <AppIcon :path="$globals.icons.orderAlphabeticalAscending" size="sm" />
                {{ $t("general.sort-alphabetically") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="sortRecipes(EVENTS.rating)"
              >
                <AppIcon :path="$globals.icons.star" size="sm" />
                {{ $t("general.rating") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="sortRecipes(EVENTS.created)"
              >
                <AppIcon :path="$globals.icons.newBox" size="sm" />
                {{ $t("general.created") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="sortRecipes(EVENTS.updated)"
              >
                <AppIcon :path="$globals.icons.update" size="sm" />
                {{ $t("general.updated") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="sortRecipes(EVENTS.lastMade)"
              >
                <AppIcon :path="$globals.icons.chefHat" size="sm" />
                {{ $t("general.last-made") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="sortRecipes(EVENTS.shuffle)"
              >
                <AppIcon :path="$globals.icons.diceMultiple" size="sm" />
                {{ $t("general.random") }}
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>

      <!-- View toggle (desktop only) -->
      <ContextMenu
        v-if="!smAndDown"
        :items="[
          {
            title: $t('general.toggle-view'),
            icon: $globals.icons.eye,
            event: 'toggle-dense-view',
          },
        ]"
        @toggle-dense-view="toggleMobileCards()"
      />
    </div>

    <!-- Recipe grid -->
    <div v-if="recipes && ready" class="mt-2">
      <!-- Desktop card grid -->
      <div
        v-if="!useMobileCards"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <RecipeCard
          v-for="recipe in recipes"
          :key="recipe.id!"
          :name="recipe.name!"
          :description="recipe.description!"
          :slug="recipe.slug!"
          :rating="recipe.rating!"
          :image="recipe.image!"
          :tags="recipe.tags!"
          :recipe-id="recipe.id!"
        />
      </div>

      <!-- Mobile / compact card grid -->
      <div
        v-else
        class="grid gap-3"
        :class="singleColumn
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'"
      >
        <RecipeCardMobile
          v-for="recipe in recipes"
          :key="recipe.id!"
          :name="recipe.name!"
          :description="recipe.description!"
          :slug="recipe.slug!"
          :rating="recipe.rating!"
          :image="recipe.image!"
          :tags="recipe.tags!"
          :recipe-id="recipe.id!"
        />
      </div>

      <!-- Infinite scroll sentinel (replaces v-intersect on v-card) -->
      <div ref="scrollSentinel" class="h-1 w-full" aria-hidden="true" />
    </div>

    <!-- Loading overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <AppLoader v-if="loading" :loading="loading" />
    </Transition>

    <AppScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn, useIntersectionObserver } from "@vueuse/core";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import RecipeCard from "./RecipeCard.vue";
import RecipeCardMobile from "./RecipeCardMobile.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useLazyRecipes } from "~/composables/recipes";
import type { Recipe } from "~/lib/api/types/recipe";
import { useUserSortPreferences } from "~/composables/use-users/preferences";
import type { RecipeSearchQuery } from "~/lib/api/user/recipes/recipe";

const REPLACE_RECIPES_EVENT = "replaceRecipes";
const APPEND_RECIPES_EVENT = "appendRecipes";

interface Props {
  disableToolbar?: boolean;
  disableSort?: boolean;
  icon?: string | null;
  title?: string | null;
  singleColumn?: boolean;
  recipes?: Recipe[];
  query?: RecipeSearchQuery | null;
}
const props = withDefaults(defineProps<Props>(), {
  disableToolbar: false,
  disableSort: false,
  icon: null,
  title: null,
  singleColumn: false,
  recipes: () => [],
  query: null,
});

const emit = defineEmits<{
  replaceRecipes: [recipes: Recipe[]];
  appendRecipes: [recipes: Recipe[]];
}>();

const { xs, smAndDown } = useDisplay();
const preferences = useUserSortPreferences();

const EVENTS = {
  az: "az",
  rating: "rating",
  created: "created",
  updated: "updated",
  lastMade: "lastMade",
  shuffle: "shuffle",
};

const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const { isOwnGroup } = useLoggedInState();
const useMobileCards = computed(() => {
  return smAndDown.value || preferences.value.useMobileCards;
});

const displayTitleIcon = computed(() => {
  return props.icon || $globals.icons.tags;
});

const sortLoading = ref(false);
const randomSeed = ref(Date.now().toString());

const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const page = ref(1);
const perPage = 32;
const hasMore = ref(true);
const ready = ref(false);
const loading = ref(false);

const { fetchMore, getRandom } = useLazyRecipes(isOwnGroup.value ? null : groupSlug.value);
const { savePosition, getSavedPage, restorePosition } = useScrollPosition();
const router = useRouter();

// Infinite scroll via IntersectionObserver — replaces Vuetify's v-intersect directive
const scrollSentinel = ref<HTMLElement | null>(null);
useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    infiniteScroll();
  }
});

const queryFilter = computed(() => {
  return props.query?.queryFilter || null;
});

async function fetchRecipes(pageCount = 1) {
  const orderDir = props.query?.orderDirection || preferences.value.orderDirection;
  const orderByNullPosition = props.query?.orderByNullPosition || orderDir === "asc" ? "first" : "last";
  const orderBy = props.query?.orderBy || preferences.value.orderBy;
  const localQuery = { ...props.query };
  if (orderBy === "random") {
    localQuery._searchSeed = randomSeed.value;
  }
  return await fetchMore(
    page.value,
    perPage * pageCount,
    orderBy,
    orderDir,
    orderByNullPosition,
    localQuery,
    queryFilter.value,
  );
}

onMounted(async () => {
  loading.value = true;
  const savedPage = getSavedPage(route.path);

  if (savedPage && savedPage > 2) {
    page.value = 1;
    hasMore.value = true;
    const newRecipes = await fetchRecipes(savedPage);
    if (newRecipes.length < perPage * savedPage) {
      hasMore.value = false;
    }
    page.value = savedPage;
    emit(REPLACE_RECIPES_EVENT, newRecipes);
    ready.value = true;
    restorePosition(route.path);
  }
  else {
    await initRecipes();
    ready.value = true;
    if (savedPage) {
      restorePosition(route.path);
    }
  }
  loading.value = false;
});

let lastQuery: string | undefined = JSON.stringify(props.query);
watch(
  () => props.query,
  async (newValue: RecipeSearchQuery | undefined | null) => {
    const newValueString = JSON.stringify(newValue);
    if (lastQuery !== newValueString) {
      lastQuery = newValueString;
      ready.value = false;
      await initRecipes();
      ready.value = true;
    }
  },
);

async function initRecipes() {
  if (preferences.value.orderBy === "random") {
    randomSeed.value = Date.now().toString();
  }
  page.value = 1;
  hasMore.value = true;

  const newRecipes = await fetchRecipes(page.value + 1);
  if (newRecipes.length < perPage) {
    hasMore.value = false;
  }

  page.value = page.value + 1;
  emit(REPLACE_RECIPES_EVENT, newRecipes);
}

const infiniteScroll = useThrottleFn(async () => {
  if (!hasMore.value || loading.value) {
    return;
  }

  loading.value = true;
  page.value = page.value + 1;

  const newRecipes = await fetchRecipes();
  if (newRecipes.length < perPage) {
    hasMore.value = false;
  }
  if (newRecipes.length) {
    emit(APPEND_RECIPES_EVENT, newRecipes);
  }

  savePosition(route.path, page.value);
  loading.value = false;
}, 500);

async function sortRecipes(sortType: string) {
  if (sortLoading.value || loading.value) {
    return;
  }

  function setter(
    orderBy: string,
    ascIcon: string,
    descIcon: string,
    defaultOrderDirection = "asc",
    filterNull = false,
  ) {
    if (preferences.value.orderBy !== orderBy) {
      preferences.value.orderBy = orderBy;
      preferences.value.orderDirection = defaultOrderDirection;
      preferences.value.filterNull = filterNull;
    }
    else {
      preferences.value.orderDirection = preferences.value.orderDirection === "asc" ? "desc" : "asc";
    }
    preferences.value.sortIcon = preferences.value.orderDirection === "asc" ? ascIcon : descIcon;
  }

  switch (sortType) {
    case EVENTS.az:
      setter("name", $globals.icons.sortAlphabeticalAscending, $globals.icons.sortAlphabeticalDescending, "asc", false);
      break;
    case EVENTS.rating:
      setter("rating", $globals.icons.sortAscending, $globals.icons.sortDescending, "desc", true);
      break;
    case EVENTS.created:
      setter("created_at", $globals.icons.sortCalendarAscending, $globals.icons.sortCalendarDescending, "desc", false);
      break;
    case EVENTS.updated:
      setter("updated_at", $globals.icons.sortClockAscending, $globals.icons.sortClockDescending, "desc", false);
      break;
    case EVENTS.lastMade:
      setter("last_made", $globals.icons.sortCalendarAscending, $globals.icons.sortCalendarDescending, "desc", true);
      break;
    case EVENTS.shuffle:
      setter("random", $globals.icons.diceMultiple, $globals.icons.diceMultiple);
      randomSeed.value = Date.now().toString();
      break;
    default:
      console.log("Unknown Event", sortType);
      return;
  }

  page.value = 1;
  hasMore.value = true;
  sortLoading.value = true;
  loading.value = true;

  const newRecipes = await fetchRecipes();
  emit(REPLACE_RECIPES_EVENT, newRecipes);

  sortLoading.value = false;
  loading.value = false;
}

async function navigateRandom() {
  const recipe = await getRandom(props.query, queryFilter.value);
  if (!recipe?.slug) {
    return;
  }
  router.push(`/g/${groupSlug.value}/r/${recipe.slug}`);
}

function toggleMobileCards() {
  preferences.value.useMobileCards = !preferences.value.useMobileCards;
}
</script>
