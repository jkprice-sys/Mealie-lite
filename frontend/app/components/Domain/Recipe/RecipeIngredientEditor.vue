<template>
  <div>
    <!-- Section title (when active) -->
    <input
      v-if="model.title || showTitle"
      v-model="model.title"
      type="text"
      :placeholder="$t('recipe.section-title')"
      class="block mb-3 mt-2 max-w-[500px] rounded border-b border-border bg-transparent px-1 py-1 text-sm text-on-surface
             placeholder-on-surface/40 focus:outline-none focus:border-primary transition-colors"
      @click="$emit('clickIngredientField', 'title')"
    />

    <!-- Ingredient row -->
    <div class="flex flex-wrap gap-2 my-1 items-start">
      <!-- Quantity + drag handle -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="enableDragHandle"
          type="button"
          class="handle p-1 text-on-surface/30 hover:text-on-surface cursor-grab"
        >
          <AppIcon :path="$globals.icons.arrowUpDown" size="sm" />
        </button>
        <input
          v-model.number="model.quantity"
          type="number"
          min="0"
          step="any"
          :placeholder="$t('recipe.quantity')"
          class="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          @keypress="quantityFilter"
        />
      </div>

      <!-- Unit combobox -->
      <div ref="unitRef" class="relative w-32 shrink-0">
        <div class="relative">
          <input
            v-model="unitSearch"
            type="text"
            :placeholder="model.unit?.name || $t('recipe.choose-unit')"
            class="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            :class="unitError ? 'border-warning' : ''"
            :title="unitError && unitErrorTooltip ? unitErrorTooltip : undefined"
            @focus="unitOpen = true; unitSearch = ''"
            @keyup.enter="handleUnitEnter"
          />
          <button
            v-if="model.unit"
            type="button"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface/30 hover:text-on-surface"
            @click="model.unit = undefined; unitSearch = ''"
          >
            <AppIcon :path="$globals.icons.close" size="xs" />
          </button>
        </div>
        <div
          v-if="unitOpen && filteredUnits.length"
          class="absolute left-0 top-full z-50 mt-0.5 w-48 max-h-[250px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          <button
            v-for="u in filteredUnits"
            :key="u.id"
            type="button"
            class="w-full text-left px-3 py-1.5 text-sm text-on-surface hover:bg-primary/5 transition-colors"
            @mousedown.prevent="selectUnit(u)"
          >
            {{ u.name }}
          </button>
          <div v-if="unitSearch" class="px-3 py-1.5 text-xs text-on-surface/50 italic border-t border-border">
            {{ $t("recipe.press-enter-to-create") }}
          </div>
        </div>
      </div>

      <!-- Food combobox (when not isRecipe) -->
      <div v-if="!state.isRecipe" ref="foodRef" class="relative flex-1 min-w-[120px]">
        <div class="relative">
          <input
            v-model="foodSearch"
            type="text"
            :placeholder="model.food?.name || $t('recipe.choose-food')"
            class="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            :class="foodError ? 'border-warning' : ''"
            :title="foodError && foodErrorTooltip ? foodErrorTooltip : undefined"
            @focus="foodOpen = true; foodSearch = ''"
            @keyup.enter="handleFoodEnter"
          />
          <button
            v-if="model.food"
            type="button"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface/30 hover:text-on-surface"
            @click="model.food = undefined; foodSearch = ''"
          >
            <AppIcon :path="$globals.icons.close" size="xs" />
          </button>
        </div>
        <div
          v-if="foodOpen && filteredFoods.length"
          class="absolute left-0 top-full z-50 mt-0.5 w-56 max-h-[250px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          <button
            v-for="f in filteredFoods"
            :key="f.id"
            type="button"
            class="w-full text-left px-3 py-1.5 text-sm text-on-surface hover:bg-primary/5 transition-colors"
            @mousedown.prevent="selectFood(f)"
          >
            {{ f.name }}
          </button>
          <div v-if="foodSearch" class="px-3 py-1.5 text-xs text-on-surface/50 italic border-t border-border">
            {{ $t("recipe.press-enter-to-create") }}
          </div>
        </div>
      </div>

      <!-- Recipe reference combobox (when isRecipe) -->
      <div v-if="state.isRecipe" ref="recipeRef" class="relative flex-1 min-w-[120px]">
        <input
          v-model="search.query.value"
          type="text"
          :placeholder="model.referencedRecipe?.name || $t('recipe.choose-recipe')"
          class="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          @focus="recipeOpen = true; search.trigger()"
          @input="search.trigger()"
        />
        <div
          v-if="recipeOpen && search.data.value?.length"
          class="absolute left-0 top-full z-50 mt-0.5 w-64 max-h-[250px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          <button
            v-for="r in search.data.value"
            :key="r.id"
            type="button"
            class="w-full text-left px-3 py-1.5 text-sm text-on-surface hover:bg-primary/5 transition-colors"
            @mousedown.prevent="selectRecipe(r)"
          >
            {{ r.name }}
          </button>
        </div>
      </div>

      <!-- Note input + context menu -->
      <div class="flex items-center gap-1 flex-1 min-w-[120px]">
        <input
          v-model="model.note"
          type="text"
          :placeholder="$t('recipe.notes')"
          class="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          @click="$emit('clickIngredientField', 'note')"
        />
        <BaseButtonGroup
          v-if="enableContextMenu"
          :large="false"
          :buttons="btns"
          @toggle-section="toggleTitle"
          @toggle-subrecipe="toggleIsRecipe"
          @insert-above="$emit('insert-above')"
          @insert-below="$emit('insert-below')"
          @delete="$emit('delete')"
        />
      </div>
    </div>

    <slot name="before-divider" />
    <hr v-if="!mdAndUp" class="border-border my-3" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, toRefs, watch } from "vue";
import { useBreakpoints, breakpointsTailwind, onClickOutside } from "@vueuse/core";
import { useFoodStore, useFoodData, useUnitStore, useUnitData } from "~/composables/store";
import { useSearch } from "~/composables/use-search";
import type { RecipeIngredient } from "~/lib/api/types/recipe";
import { usePublicExploreApi, useUserApi } from "~/composables/api";
import { useRecipeSearch } from "~/composables/recipes/use-recipe-search";

const model = defineModel<RecipeIngredient>({ required: true });

const props = defineProps({
  menuAttachTarget: { type: String, default: "body" },
  isRecipe: { type: Boolean, default: false },
  unitError: { type: Boolean, default: false },
  unitErrorTooltip: { type: String, default: "" },
  foodError: { type: Boolean, default: false },
  foodErrorTooltip: { type: String, default: "" },
  enableContextMenu: { type: Boolean, default: false },
  enableDragHandle: { type: Boolean, default: false },
  deleteDisabled: { type: Boolean, default: false },
});

defineEmits(["clickIngredientField", "insert-above", "insert-below", "delete"]);

const bp = useBreakpoints(breakpointsTailwind);
const mdAndUp = bp.greaterOrEqual("md");

const i18n = useI18n();
const { $globals } = useNuxtApp();

const state = reactive({
  showTitle: false,
  isRecipe: props.isRecipe,
});
const { showTitle } = toRefs(state);

// Context menu buttons
const contextMenuOptions = computed(() => [
  { text: i18n.t("recipe.toggle-section"), event: "toggle-section" },
  { text: i18n.t("recipe.toggle-recipe"), event: "toggle-subrecipe" },
  { text: i18n.t("recipe.insert-above"), event: "insert-above" },
  { text: i18n.t("recipe.insert-below"), event: "insert-below" },
]);

const btns = computed(() => [
  { icon: $globals.icons.delete, text: i18n.t("general.delete"), event: "delete", children: undefined, disabled: props.deleteDisabled },
  { icon: $globals.icons.dotsVertical, text: i18n.t("general.menu"), event: "open", children: contextMenuOptions.value },
]);

// ── Unit ──────────────────────────────────────────────────────
const unitStore = useUnitStore();
const unitsData = useUnitData();
const unitRef = ref<HTMLElement | null>(null);
const unitSearch = ref(model.value.unit?.name || "");
const unitOpen = ref(false);
const { search: _unitSearch, filtered: filteredUnits } = useSearch(unitStore.store);
onClickOutside(unitRef, () => { unitOpen.value = false; });

// Keep search in sync with input
watch(unitSearch, (val) => { _unitSearch.value = val; });

function selectUnit(u: any) {
  model.value.unit = u;
  unitSearch.value = u.name;
  unitOpen.value = false;
}

async function createAssignUnit() {
  unitsData.data.name = unitSearch.value;
  const newUnit = await unitStore.actions.createOne(unitsData.data);
  if (newUnit) {
    model.value.unit = newUnit;
    unitSearch.value = newUnit.name;
  }
  unitsData.reset();
  unitOpen.value = false;
}

function handleUnitEnter() {
  const match = filteredUnits.value.find((u: any) => u.name.toLowerCase() === unitSearch.value.toLowerCase());
  if (match) selectUnit(match);
  else if (unitSearch.value) createAssignUnit();
}

// ── Food ──────────────────────────────────────────────────────
const foodStore = useFoodStore();
const foodData = useFoodData();
const foodRef = ref<HTMLElement | null>(null);
const foodSearch = ref(model.value.food?.name || "");
const foodOpen = ref(false);
const { search: _foodSearch, filtered: filteredFoods } = useSearch(foodStore.store);
onClickOutside(foodRef, () => { foodOpen.value = false; });

watch(foodSearch, (val) => { _foodSearch.value = val; });

function selectFood(f: any) {
  model.value.food = f;
  foodSearch.value = f.name;
  foodOpen.value = false;
}

async function createAssignFood() {
  foodData.data.name = foodSearch.value;
  const newFood = await foodStore.actions.createOne(foodData.data);
  if (newFood) {
    model.value.food = newFood;
    foodSearch.value = newFood.name;
  }
  foodData.reset();
  foodOpen.value = false;
}

function handleFoodEnter() {
  const match = filteredFoods.value.find((f: any) => f.name.toLowerCase() === foodSearch.value.toLowerCase());
  if (match) selectFood(match);
  else if (foodSearch.value) createAssignFood();
}

// ── Recipe reference ──────────────────────────────────────────
const route = useRoute();
const auth = useMealieAuth();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const { isOwnGroup } = useLoggedInState();
const api = isOwnGroup.value ? useUserApi() : usePublicExploreApi(groupSlug.value).explore;
const search = useRecipeSearch(api);
const recipeRef = ref<HTMLElement | null>(null);
const recipeOpen = ref(false);
onClickOutside(recipeRef, () => { recipeOpen.value = false; });

function selectRecipe(r: any) {
  model.value.referencedRecipe = r;
  search.query.value = r.name;
  recipeOpen.value = false;
}

// ── Toggle functions ──────────────────────────────────────────
function toggleTitle() {
  if (state.showTitle) model.value.title = "";
  state.showTitle = !state.showTitle;
}

function toggleIsRecipe() {
  if (state.isRecipe) {
    model.value.referencedRecipe = undefined;
  }
  else {
    model.value.unit = undefined;
    model.value.food = undefined;
  }
  state.isRecipe = !state.isRecipe;
}

function quantityFilter(e: KeyboardEvent) {
  if (e.key === "-" || e.key === "+" || e.key === "e") e.preventDefault();
}
</script>
