<template>
  <div class="px-4 py-4">
    <RecipeDialogAddToShoppingList
      v-if="shoppingLists"
      v-model="state.shoppingListDialog"
      :recipes="weekRecipesWithScales"
      :shopping-lists="shoppingLists"
    />

    <!-- Date range controls -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Date range button + popover -->
      <div ref="pickerRef" class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
          @click="state.picker = !state.picker"
        >
          <AppIcon :path="$globals.icons.calendar" size="sm" />
          {{ $d(weekRange.start, "short") }} - {{ $d(weekRange.end, "short") }}
        </button>

        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div v-if="state.picker" class="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl border border-border bg-surface shadow-lg p-4 space-y-3">
            <!-- Start / end date inputs -->
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.start') }}</label>
                <input
                  :value="formatDate(weekRange.start)"
                  type="date"
                  class="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                         focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  @change="setStart(($event.target as HTMLInputElement).value)"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.end') }}</label>
                <input
                  :value="formatDate(weekRange.end)"
                  type="date"
                  class="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                         focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  @change="setEnd(($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Days past offset -->
            <div>
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('meal-plan.numberOfDaysPast-label') }}</label>
              <input
                v-model.number="numberOfDaysPast"
                type="number"
                min="0"
                class="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-on-surface
                       focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              <p class="mt-0.5 text-xs text-on-surface/50">{{ $t('meal-plan.numberOfDaysPast-hint') }}</p>
            </div>

            <!-- Days count -->
            <div>
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('meal-plan.numberOfDays-label') }}</label>
              <input
                v-model.number="numberOfDays"
                type="number"
                min="1"
                class="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-on-surface
                       focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              <p class="mt-0.5 text-xs text-on-surface/50">{{ $t('meal-plan.numberOfDays-hint') }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Tabs + actions row -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <!-- Tab nav -->
      <div class="inline-flex rounded-lg border border-border overflow-hidden">
        <NuxtLink
          :to="{ name: TABS.view, query: route.query }"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="route.name === TABS.view ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-primary/10'"
        >
          {{ $t('meal-plan.meal-planner') }}
        </NuxtLink>
        <NuxtLink
          :to="{ name: TABS.edit, query: route.query }"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="route.name === TABS.edit ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-primary/10'"
        >
          {{ $t('general.edit') }}
        </NuxtLink>
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2">
        <BaseButton
          v-if="route.name === TABS.view"
          color="info"
          :icon="$globals.icons.cartCheck"
          :text="$t('meal-plan.add-all-to-list')"
          :disabled="!hasRecipes"
          :loading="state.addAllLoading"
          @click="addAllToList"
        />
        <ButtonLink
          :icon="$globals.icons.calendar"
          :to="`/household/mealplan/settings`"
          :text="$t('general.settings')"
        />
      </div>
    </div>

    <NuxtPage
      :mealplans="mealsByDate"
      :actions="actions"
    />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { isSameDay, addDays, parseISO, format, isValid } from "date-fns";
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import { useHouseholdSelf } from "~/composables/use-households";
import { useMealplans } from "~/composables/use-group-mealplan";
import { useUserMealPlanPreferences } from "~/composables/use-users/preferences";
import type { ShoppingListSummary } from "~/lib/api/types/household";
import { useUserApi } from "~/composables/api";

definePageMeta({ middleware: ["lite-mode"] });

const TABS = {
  view: "household-mealplan-planner-view",
  edit: "household-mealplan-planner-edit",
};

const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const api = useUserApi();
const { $globals } = useNuxtApp();
const { household } = useHouseholdSelf();

useSeoMeta({
  title: i18n.t("meal-plan.dinner-this-week"),
});

const mealPlanPreferences = useUserMealPlanPreferences();
const numberOfDaysPast = ref<number>(mealPlanPreferences.value.numberOfDaysPast || 0);
const numberOfDays = ref<number>(mealPlanPreferences.value.numberOfDays || 7);
watch(numberOfDaysPast, (val) => { mealPlanPreferences.value.numberOfDaysPast = Number(val); });
watch(numberOfDays, (val) => { mealPlanPreferences.value.numberOfDays = Number(val); });

// Picker ref for click-outside close
const pickerRef = ref(null);
onClickOutside(pickerRef, () => { state.value.picker = false; });

if (route.path === "/household/mealplan/planner") {
  router.push({ name: TABS.view, query: route.query });
}

function safeParseISO(date: string, fallback: Date | undefined = undefined) {
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : fallback;
  }
  catch { return fallback; }
}

function formatDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const initialStartDate = safeParseISO(route.query.start as string, addDays(new Date(), adjustForToday(-numberOfDaysPast.value)));
const initialEndDate = safeParseISO(route.query.end as string, addDays(new Date(), adjustForToday(numberOfDays.value)));

const state = ref({
  range: [initialStartDate, initialEndDate] as [Date, Date],
  start: initialStartDate,
  picker: false,
  end: initialEndDate,
  shoppingListDialog: false,
  addAllLoading: false,
});

const shoppingLists = ref<ShoppingListSummary[]>();

const weekRange = computed(() => {
  const sorted = [...state.value.range].sort((a, b) => a.getTime() - b.getTime());
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  if (start && end) return { start, end };
  return {
    start: addDays(new Date(), adjustForToday(-numberOfDaysPast.value)),
    end: addDays(new Date(), adjustForToday(numberOfDays.value)),
  };
});

function setStart(value: string) {
  const d = safeParseISO(value);
  if (d) state.value.range = [d, state.value.range[1]];
}

function setEnd(value: string) {
  const d = safeParseISO(value);
  if (d) state.value.range = [state.value.range[0], d];
}

watch(weekRange, (newRange) => {
  router.replace({
    name: route.name || TABS.view,
    params: route.params,
    query: {
      ...route.query,
      start: format(newRange.start, "yyyy-MM-dd"),
      end: format(newRange.end, "yyyy-MM-dd"),
    },
  });
}, { immediate: true });

const { mealplans, actions } = useMealplans(weekRange);

function filterMealByDate(date: Date) {
  if (!mealplans.value) return [];
  return mealplans.value.filter(meal => isSameDay(parseISO(meal.date), date));
}

function adjustForToday(days: number) {
  return days > 0 ? days - 1 : days;
}

const days = computed(() => {
  const numDays = Math.floor((weekRange.value.end.getTime() - weekRange.value.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (numDays < 0) return [];
  return Array.from(Array(numDays).keys()).map((i) => {
    const date = new Date(weekRange.value.start.getTime());
    date.setDate(date.getDate() + i);
    return date;
  });
});

const mealsByDate = computed(() => {
  return days.value.map(day => ({ date: day, meals: filterMealByDate(day) }));
});

const hasRecipes = computed(() => {
  return mealsByDate.value.some(day => day.meals.some(meal => meal.recipe));
});

const weekRecipesWithScales = computed(() => {
  const allRecipes: any[] = [];
  for (const day of mealsByDate.value) {
    for (const meal of day.meals) {
      if (meal.recipe) allRecipes.push(meal.recipe);
    }
  }
  return allRecipes.map(recipe => ({ scale: 1, ...recipe }));
});

async function getShoppingLists() {
  const { data } = await api.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });
  if (data) { shoppingLists.value = data.items as ShoppingListSummary[] ?? []; }
}

async function addAllToList() {
  state.value.addAllLoading = true;
  await getShoppingLists();
  state.value.shoppingListDialog = true;
  state.value.addAllLoading = false;
}
</script>

<style lang="css">
.left-color-border {
  border-left: 5px solid var(--bs-primary) !important;
}
.bottom-color-border {
  border-bottom: 2px solid var(--bs-primary) !important;
}
</style>
