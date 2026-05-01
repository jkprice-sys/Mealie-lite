<template>
  <div>
    <!-- Create/Edit Meal Dialog -->
    <BaseDialog
      v-model="state.dialog"
      :title="newMeal.existing ? $t('meal-plan.update-this-meal-plan') : $t('meal-plan.create-a-new-meal-plan')"
      :submit-text="newMeal.existing ? $t('general.update') : $t('general.create')"
      color="primary"
      :icon="$globals.icons.foods"
      :submit-disabled="isCreateDisabled"
      can-submit
      @submit="() => {
        if (newMeal.existing) {
          actions.updateOne({ ...newMeal, date: newMealDateString });
        } else {
          actions.createOne({ ...newMeal, date: newMealDateString });
        }
        resetDialog();
      }"
      @close="resetDialog()"
    >
      <div class="px-4 py-3 space-y-3">
        <!-- Date picker -->
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.date') }}</label>
          <input
            :value="newMealDateString"
            type="date"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            @change="setMealDate(($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- Entry type -->
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.entry-type') }}</label>
          <select
            v-model="newMeal.entryType"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <option v-for="opt in planTypeOptions" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
          </select>
        </div>

        <!-- Note toggle -->
        <label class="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            role="switch"
            :aria-checked="dialog.note"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0"
            :class="dialog.note ? 'bg-primary' : 'bg-on-surface/20'"
            @click="dialog.note = !dialog.note"
          >
            <span
              class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
              :class="dialog.note ? 'translate-x-4' : 'translate-x-0.5'"
            />
          </button>
          <span class="text-sm text-on-surface">{{ $t('meal-plan.note-only') }}</span>
        </label>

        <!-- Recipe search -->
        <div v-if="!dialog.note" ref="recipeSearchRef" class="relative">
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('meal-plan.meal-recipe') }}</label>
          <input
            v-model="search.query.value"
            type="text"
            :placeholder="$t('meal-plan.meal-recipe')"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            @focus="recipeSearchOpen = true"
          />
          <div
            v-if="recipeSearchOpen && search.data.value.length"
            class="absolute left-0 top-full z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
          >
            <button
              v-for="item in search.data.value"
              :key="item.id"
              type="button"
              class="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-primary/10 transition-colors"
              @mousedown.prevent="selectRecipe(item)"
            >
              {{ item.name }}
            </button>
          </div>
          <!-- Selected recipe display -->
          <p v-if="selectedRecipeName" class="mt-1 text-xs text-primary">{{ selectedRecipeName }}</p>
        </div>

        <!-- Note fields -->
        <template v-else>
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('meal-plan.meal-title') }}</label>
            <input
              v-model="newMeal.title"
              type="text"
              required
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('meal-plan.meal-note') }}</label>
            <textarea
              v-model="newMeal.text"
              rows="2"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
            />
          </div>
        </template>
      </div>
    </BaseDialog>

    <!-- Day columns grid -->
    <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div
        v-for="(plan, index) in mealplans"
        :key="index"
        class="flex flex-col"
      >
        <!-- Day header -->
        <div class="mb-2 border-l-4 border-l-primary rounded-lg border border-border bg-surface px-3 py-2">
          <p class="text-sm font-medium">{{ $d(plan.date, "short") }}</p>
        </div>

        <!-- Draggable meals -->
        <VueDraggable
          v-model="mealplansByDate[plan.date.toString()]"
          tag="div"
          handle=".handle"
          :delay="250"
          :delay-on-touch-only="true"
          group="meals"
          :data-index="index"
          :data-box="plan.date"
          style="min-height: 150px"
          @end="onMoveCallback"
        >
          <div
            v-for="mealplan in mealplansByDate[plan.date.toString()]"
            :key="mealplan.id"
            class="my-1 rounded-lg border border-border bg-surface overflow-hidden"
            :class="{ handle: smAndUp }"
          >
            <!-- Meal info row -->
            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-primary/5 transition-colors"
              @click="editMeal(mealplan)"
            >
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-full overflow-hidden bg-on-surface/10 flex items-center justify-center shrink-0">
                <RecipeCardImage
                  v-if="mealplan.recipe"
                  :recipe-id="mealplan.recipe.id!"
                  tiny
                  icon-size="25"
                  :slug="mealplan.recipe ? mealplan.recipe.slug : ''"
                />
                <AppIcon v-else :path="$globals.icons.primary" size="sm" class="text-on-surface/40" />
              </div>
              <!-- Text -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-on-surface truncate">
                  {{ mealplan.recipe ? mealplan.recipe.name : mealplan.title }}
                </p>
                <p class="text-xs text-on-surface/60 truncate" style="min-height: 16px">
                  {{ mealplan.recipe ? mealplan.recipe.description : mealplan.text }}
                </p>
              </div>
            </button>

            <hr class="border-border mx-2" />

            <!-- Actions row -->
            <div class="flex items-center gap-2 px-2 py-1.5">
              <button
                type="button"
                class="p-1 rounded text-on-surface/40 hover:text-on-surface transition-colors"
                :class="{ handle: !smAndUp }"
              >
                <AppIcon :path="$globals.icons.arrowUpDown" size="sm" />
              </button>

              <!-- Entry type chip with menu -->
              <Menu as="div" class="relative">
                <MenuButton
                  class="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-on-surface hover:bg-primary/10 transition-colors"
                  @click.prevent
                >
                  <AppIcon :path="$globals.icons.tags" size="xs" />
                  {{ getEntryTypeText(mealplan.entryType!) }}
                </MenuButton>
                <Transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <MenuItems class="absolute left-0 z-50 mt-1 w-36 rounded-lg border border-border bg-surface shadow-lg focus:outline-none">
                    <div class="py-1">
                      <MenuItem v-for="mealType in planTypeOptions" :key="mealType.value" v-slot="{ active }">
                        <button
                          type="button"
                          class="w-full text-left px-3 py-2 text-sm transition-colors"
                          :class="active ? 'bg-primary/10 text-primary' : 'text-on-surface'"
                          @click="actions.setType(mealplan, mealType.value)"
                        >
                          {{ mealType.text }}
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>

              <button
                type="button"
                class="ml-auto p-1 rounded text-on-surface/40 hover:text-error transition-colors"
                @click="actions.deleteOne(mealplan.id)"
              >
                <AppIcon :path="$globals.icons.delete" size="sm" />
              </button>
            </div>
          </div>
        </VueDraggable>

        <!-- Day column actions -->
        <div class="flex justify-end mt-auto pt-2">
          <BaseButtonGroup
            :buttons="[
              {
                icon: $globals.icons.diceMultiple,
                text: $t('meal-plan.random-meal'),
                event: 'random',
                children: [
                  { icon: $globals.icons.diceMultiple, text: $t('meal-plan.breakfast'), event: 'randomBreakfast' },
                  { icon: $globals.icons.diceMultiple, text: $t('meal-plan.lunch'), event: 'randomLunch' },
                  { icon: $globals.icons.diceMultiple, text: $t('meal-plan.side'), event: 'randomSide' },
                  { icon: $globals.icons.diceMultiple, text: $t('meal-plan.snack'), event: 'randomSnack' },
                  { icon: $globals.icons.diceMultiple, text: $t('meal-plan.drink'), event: 'randomDrink' },
                  { icon: $globals.icons.diceMultiple, text: $t('meal-plan.dessert'), event: 'randomDessert' },
                ],
              },
              { icon: $globals.icons.potSteam, text: $t('meal-plan.random-dinner'), event: 'randomDinner' },
              { icon: $globals.icons.bowlMixOutline, text: $t('meal-plan.random-side'), event: 'randomSide' },
              { icon: $globals.icons.createAlt, text: $t('general.new'), event: 'create' },
            ]"
            @create="openDialog(plan.date)"
            @random-breakfast="randomMeal(plan.date, 'breakfast')"
            @random-lunch="randomMeal(plan.date, 'lunch')"
            @random-dinner="randomMeal(plan.date, 'dinner')"
            @random-side="randomMeal(plan.date, 'side')"
            @random-snack="randomMeal(plan.date, 'snack')"
            @random-drink="randomMeal(plan.date, 'drink')"
            @random-dessert="randomMeal(plan.date, 'dessert')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, parseISO } from "date-fns";
import { useBreakpoints, breakpointsTailwind, onClickOutside } from "@vueuse/core";
import type { SortableEvent } from "sortablejs";
import { VueDraggable } from "vue-draggable-plus";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import type { MealsByDate } from "./view.vue";
import type { useMealplans } from "~/composables/use-group-mealplan";
import { usePlanTypeOptions, getEntryTypeText } from "~/composables/use-group-mealplan";
import RecipeCardImage from "~/components/Domain/Recipe/RecipeCardImage.vue";
import type { PlanEntryType, UpdatePlanEntry } from "~/lib/api/types/meal-plan";
import { useUserApi } from "~/composables/api";
import { useHouseholdSelf } from "~/composables/use-households";
import { useRecipeSearch } from "~/composables/recipes/use-recipe-search";

const props = defineProps<{
  mealplans: MealsByDate[];
  actions: ReturnType<typeof useMealplans>["actions"];
}>();

const api = useUserApi();
const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const { household } = useHouseholdSelf();
const bp = useBreakpoints(breakpointsTailwind);
const smAndUp = bp.greaterOrEqual("sm");
const requiredRule = (value: any) => !!value || "Required.";

const state = ref({ dialog: false });

const firstDayOfWeek = computed(() => household.value?.preferences?.firstDayOfWeek || 0);

const mealplansByDate = reactive<{ [date: string]: UpdatePlanEntry[] }>({});
watch(
  () => props.mealplans,
  (plans) => {
    for (const plan of plans) {
      mealplansByDate[plan.date.toString()] = plan.meals ? [...plan.meals] : [];
    }
    Object.keys(mealplansByDate).forEach((date) => {
      if (!plans.find(p => p.date.toString() === date)) mealplansByDate[date] = [];
    });
  },
  { immediate: true, deep: true },
);

function onMoveCallback(evt: SortableEvent) {
  const supportedEvents = ["drop", "touchend"];
  const ogEvent: DragEvent = (evt as any).originalEvent;
  if (ogEvent && ogEvent.type in supportedEvents) {
    console.log("Cancel Move Event");
  }
  else {
    const fromMealsByIndex = parseInt(evt.from.getAttribute("data-index") ?? "");
    const toMealsByIndex = parseInt(evt.to.getAttribute("data-index") ?? "");
    if (!isNaN(fromMealsByIndex) && !isNaN(toMealsByIndex)) {
      const destDate = props.mealplans[toMealsByIndex].date;
      const mealData = mealplansByDate[destDate.toString()][evt.newIndex as number];
      mealData.date = format(destDate, "yyyy-MM-dd");
      props.actions.updateOne(mealData);
    }
  }
}

const dialog = reactive({ loading: false, error: false, note: false });

watch(dialog, () => {
  if (dialog.note) newMeal.recipeId = undefined;
});

const newMeal = reactive({
  date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000),
  title: "",
  text: "",
  recipeId: undefined as string | undefined,
  entryType: "dinner" as PlanEntryType,
  existing: false,
  id: 0,
  groupId: "",
  userId: auth.user.value?.id || "",
});

const newMealDateString = computed(() => format(newMeal.date, "yyyy-MM-dd"));

function setMealDate(value: string) {
  const d = parseISO(value);
  if (d) newMeal.date = d;
}

const isCreateDisabled = computed(() => {
  if (dialog.note) return !newMeal.title.trim();
  return !newMeal.recipeId;
});

function openDialog(date: Date) {
  newMeal.date = date;
  state.value.dialog = true;
}

function editMeal(mealplan: UpdatePlanEntry) {
  const { date, title, text, entryType, recipeId, id, groupId, userId } = mealplan;
  if (!entryType) return;
  const [year, month, day] = date.split("-").map(Number);
  newMeal.date = new Date(year, month - 1, day);
  newMeal.title = title || "";
  newMeal.text = text || "";
  newMeal.recipeId = recipeId || undefined;
  newMeal.entryType = entryType;
  newMeal.existing = true;
  newMeal.id = id;
  newMeal.groupId = groupId;
  newMeal.userId = userId || auth.user.value?.id || "";
  state.value.dialog = true;
  dialog.note = !recipeId;
  if (recipeId) {
    const found = search.data.value.find((r: any) => r.id === recipeId);
    if (found) selectedRecipeName.value = found.name;
  }
}

function resetDialog() {
  newMeal.date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  newMeal.title = "";
  newMeal.text = "";
  newMeal.entryType = "dinner";
  newMeal.recipeId = undefined;
  newMeal.existing = false;
  selectedRecipeName.value = "";
  search.query.value = "";
}

async function randomMeal(date: Date, type: PlanEntryType) {
  const { data } = await api.mealplans.setRandom({
    date: format(date, "yyyy-MM-dd"),
    entryType: type,
  });
  if (data) props.actions.refreshAll();
}

// Recipe search combobox
const search = useRecipeSearch(api);
const recipeSearchRef = ref(null);
const recipeSearchOpen = ref(false);
const selectedRecipeName = ref("");

onClickOutside(recipeSearchRef, () => { recipeSearchOpen.value = false; });

function selectRecipe(item: any) {
  newMeal.recipeId = item.id;
  selectedRecipeName.value = item.name;
  search.query.value = item.name;
  recipeSearchOpen.value = false;
}

const planTypeOptions = usePlanTypeOptions();

onMounted(async () => {
  await search.trigger();
});
</script>
