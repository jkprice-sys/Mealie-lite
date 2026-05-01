<template>
  <div class="search-container pb-8">
    <form class="search-box px-2 pt-2" @submit.prevent="search">
      <!-- Search input -->
      <div class="flex justify-center mb-2">
        <div class="relative w-full">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 pointer-events-none">
            <AppIcon :path="$globals.icons.search" size="sm" />
          </span>
          <input
            ref="input"
            v-model="state.search"
            type="text"
            :placeholder="$t('search.search-placeholder')"
            class="w-full rounded-lg border border-border bg-surface pl-9 pr-10 py-2.5 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            @keyup.enter="hideKeyboard"
          />
          <button
            v-if="state.search"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface transition-colors"
            @click="state.search = ''"
          >
            <AppIcon :path="$globals.icons.close" size="sm" />
          </button>
        </div>
      </div>

      <!-- Filter row: search filters + sort menu + settings menu -->
      <div class="flex flex-wrap items-center gap-2 mt-4">
        <RecipeExplorerPageSearchFilters />

        <!-- Sort menu -->
        <Menu as="div" class="relative inline-block ml-auto">
          <MenuButton
            class="inline-flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-primary/5 transition-colors focus:outline-none"
          >
            <AppIcon
              :path="state.orderDirection === 'asc' ? $globals.icons.sortDescending : $globals.icons.sortAscending"
              size="sm"
            />
            <span v-if="!isXs">{{ sortText }}</span>
          </MenuButton>

          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <MenuItems class="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-lg border border-border bg-surface shadow-lg py-1 focus:outline-none">
              <!-- Sort direction toggle -->
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface transition-colors"
                  :class="active ? 'bg-primary/10' : ''"
                  @click="toggleOrderDirection"
                >
                  <AppIcon
                    :path="state.orderDirection === 'asc' ? $globals.icons.sortAscending : $globals.icons.sortDescending"
                    size="sm"
                  />
                  {{ state.orderDirection === 'asc' ? $t('general.sort-descending') : $t('general.sort-ascending') }}
                </button>
              </MenuItem>

              <hr class="border-border my-1" />

              <!-- Sort field options -->
              <MenuItem
                v-for="v in sortable"
                :key="v.name"
                v-slot="{ active }"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                  :class="[
                    active ? 'bg-primary/10' : '',
                    state.orderBy === v.value ? 'text-primary font-medium' : 'text-on-surface',
                  ]"
                  @click="v.value === 'random' ? setRandomOrderByWrapper() : setOrderBy(v.value)"
                >
                  <AppIcon :path="v.icon" size="sm" />
                  {{ v.name }}
                  <span
                    v-if="v.value === 'random' && showRandomLoading"
                    class="ml-auto animate-spin w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full inline-block"
                  />
                </button>
              </MenuItem>
            </MenuItems>
          </Transition>
        </Menu>

        <!-- Settings popover -->
        <div ref="settingsRef" class="relative inline-block">
          <button
            type="button"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border text-on-surface hover:bg-primary/5 transition-colors focus:outline-none"
            @click="settingsOpen = !settingsOpen"
          >
            <AppIcon :path="$globals.icons.cog" size="sm" />
          </button>

          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="settingsOpen"
              class="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-surface shadow-lg p-3 space-y-3"
            >
              <!-- Auto-search toggle -->
              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-sm text-on-surface">{{ $t('search.auto-search') }}</span>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="state.auto"
                  class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0"
                  :class="state.auto ? 'bg-primary' : 'bg-on-surface/20'"
                  @click="state.auto = !state.auto"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                    :class="state.auto ? 'translate-x-4' : 'translate-x-0.5'"
                  />
                </button>
              </label>
              <!-- Reset button -->
              <button
                type="button"
                class="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
                @click="reset"
              >
                {{ $t("general.reset") }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Manual search button (when auto-search is off) -->
      <div v-if="!state.auto" class="search-button-container mt-12">
        <button
          type="submit"
          class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-on-primary hover:bg-primary/90 transition-colors"
        >
          <AppIcon :path="$globals.icons.search" size="sm" />
          {{ $t("search.search") }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside, useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import RecipeExplorerPageSearchFilters from "./RecipeExplorerPageSearchFilters.vue";
import { useRecipeExplorerSearch, clearRecipeExplorerSearchState } from "~/composables/use-recipe-explorer-search";

const emit = defineEmits<{
  ready: [];
}>();

const auth = useMealieAuth();
const route = useRoute();
const { $globals } = useNuxtApp();
const i18n = useI18n();

const bp = useBreakpoints(breakpointsTailwind);
const isXs = bp.smallerOrEqual("xs");

const showRandomLoading = ref(false);
const settingsOpen = ref(false);
const settingsRef = ref<HTMLElement | null>(null);
onClickOutside(settingsRef, () => { settingsOpen.value = false; });

const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const {
  state,
  passedQueryWithSeed,
  search,
  reset,
  toggleOrderDirection,
  setOrderBy,
  setRandomOrderBy,
  filterItems,
  initialize,
} = useRecipeExplorerSearch(groupSlug);

defineExpose({
  passedQueryWithSeed,
  filterItems,
});

onMounted(async () => {
  await initialize();
  emit("ready");
});

onUnmounted(() => {
  clearRecipeExplorerSearchState(groupSlug.value);
});

const sortText = computed(() => {
  const sort = sortable.value.find(s => s.value === state.value.orderBy);
  return sort ? sort.name : "";
});

const sortable = computed(() => [
  { icon: $globals.icons.orderAlphabeticalAscending, name: i18n.t("general.sort-alphabetically"), value: "name" },
  { icon: $globals.icons.newBox, name: i18n.t("general.created"), value: "created_at" },
  { icon: $globals.icons.chefHat, name: i18n.t("general.last-made"), value: "last_made" },
  { icon: $globals.icons.star, name: i18n.t("general.rating"), value: "rating" },
  { icon: $globals.icons.update, name: i18n.t("general.updated"), value: "updated_at" },
  { icon: $globals.icons.diceMultiple, name: i18n.t("general.random"), value: "random" },
]);

const input = ref<HTMLInputElement | null>(null);

function hideKeyboard() {
  input.value?.blur();
}

async function setRandomOrderByWrapper() {
  if (!showRandomLoading.value) showRandomLoading.value = true;
  await setRandomOrderBy();
}
</script>

<style scoped>
.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.search-container {
  display: flex;
  justify-content: center;
}

.search-box {
  width: 950px;
}

.search-button-container {
  margin: 0 auto;
  max-width: 500px;
}
</style>
