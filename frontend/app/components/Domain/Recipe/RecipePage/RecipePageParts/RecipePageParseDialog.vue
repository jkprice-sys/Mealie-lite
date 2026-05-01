<template>
  <BaseDialog
    :model-value="modelValue"
    :title="$t('recipe.parse-ingredients')"
    :icon="$globals.icons.fileSign"
    disable-submit-on-enter
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="p-2">
      <!-- Loading -->
      <div v-if="state.loading.parser" class="my-6">
        <AppLoader waiting-text="" class="my-6" />
      </div>

      <div v-else>
        <!-- Header: title + parser selector -->
        <BaseCardSectionTitle :title="$t('recipe.parser.ingredient-parser')">
          <div v-if="!state.allReviewed" class="mb-4 space-y-1">
            <p class="text-sm text-on-surface/80">{{ $t("recipe.parser.ingredient-parser-description") }}</p>
            <p class="text-sm text-on-surface/80">{{ $t("recipe.parser.ingredient-parser-final-review-description") }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-on-surface/70">{{ $t("recipe.parser.select-parser") }}</span>
            <div class="flex items-center gap-2">
              <select
                v-model="parser"
                :disabled="state.loading.parser"
                class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-on-surface
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option
                  v-for="p in availableParsers.filter(x => !x.hide)"
                  :key="p.value"
                  :value="p.value"
                >
                  {{ p.text }}
                </option>
              </select>
              <button
                type="button"
                :disabled="state.loading.parser"
                :title="$t('general.refresh')"
                class="bs-btn bs-btn-sm bs-btn-outline disabled:opacity-50"
                @click="parseIngredients"
              >
                <AppIcon :path="$globals.icons.refresh" size="sm" />
              </button>
            </div>
          </div>
        </BaseCardSectionTitle>

        <!-- Review one ingredient at a time -->
        <div v-if="!state.allReviewed && currentIng" class="bs-card">
          <div class="p-4">
            <!-- Input text display -->
            <div class="text-center px-8 py-4 mb-4">
              <p class="text-xl italic text-on-surface">{{ currentIng.input }}</p>
            </div>

            <!-- Confidence indicator -->
            <div class="flex items-center gap-2 mb-2">
              <AppIcon
                :path="(currentIng.confidence?.average || 0) < confidenceThreshold ? $globals.icons.alert : $globals.icons.check"
                size="sm"
                :class="(currentIng.confidence?.average || 0) < confidenceThreshold ? 'text-error' : 'text-success'"
              />
              <span
                class="text-sm"
                :class="currentIngHasError ? 'text-error' : 'text-success'"
              >
                {{ $t("recipe.parser.confidence-score") }}:
                {{ currentIng.confidence ? asPercentage(currentIng.confidence?.average!) : "" }}
              </span>
            </div>

            <RecipeIngredientEditor
              v-model="currentIng.ingredient"
              :unit-error="!!currentMissingUnit"
              :unit-error-tooltip="$t('recipe.parser.this-unit-could-not-be-parsed-automatically')"
              :food-error="!!currentMissingFood"
              :food-error-tooltip="$t('recipe.parser.this-food-could-not-be-parsed-automatically')"
            />

            <!-- Missing unit/food fix buttons -->
            <div class="flex flex-wrap items-center justify-end gap-2 mt-3">
              <BaseButton
                v-if="currentMissingUnit && !currentIng.ingredient.unit?.id"
                color="warning"
                size="small"
                @click="createMissingUnit"
              >
                {{ i18n.t("recipe.parser.missing-unit", { unit: currentMissingUnit }) }}
              </BaseButton>
              <BaseButton
                v-if="currentMissingUnit && currentIng.ingredient.unit?.id
                  && currentMissingUnit.toLowerCase() != currentIng.ingredient.unit?.name.toLowerCase()"
                color="warning"
                size="small"
                @click="addMissingUnitAsAlias"
              >
                {{ i18n.t("recipe.parser.add-text-as-alias-for-item", { text: currentMissingUnit, item: currentIng.ingredient.unit.name }) }}
              </BaseButton>
              <BaseButton
                v-if="currentMissingFood && !currentIng.ingredient.food?.id"
                color="warning"
                size="small"
                @click="createMissingFood"
              >
                {{ i18n.t("recipe.parser.missing-food", { food: currentMissingFood }) }}
              </BaseButton>
              <BaseButton
                v-if="currentMissingFood && currentIng.ingredient.food?.id
                  && currentMissingFood.toLowerCase() != currentIng.ingredient.food?.name.toLowerCase()"
                color="warning"
                size="small"
                @click="addMissingFoodAsAlias"
              >
                {{ i18n.t("recipe.parser.add-text-as-alias-for-item", { text: currentMissingFood, item: currentIng.ingredient.food.name }) }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Final review: all parsed ingredients -->
        <div v-else>
          <p class="text-center font-semibold text-on-surface pt-0 pb-6">
            {{ $t("recipe.parser.review-parsed-ingredients") }}
          </p>
          <div class="max-h-[60vh] overflow-y-auto px-6">
            <VueDraggable
              v-model="parsedIngs"
              handle=".handle"
              :delay="250"
              :delay-on-touch-only="true"
              v-bind="{
                animation: 200,
                group: 'recipe-ingredients',
                disabled: false,
                ghostClass: 'ghost',
              }"
              @start="drag = true"
              @end="drag = false"
            >
              <TransitionGroup type="transition">
                <div v-for="(ingredient, index) in parsedIngs" :key="index">
                  <RecipeIngredientEditor
                    v-model="ingredient.ingredient"
                    enable-drag-handle
                    enable-context-menu
                    class="list-group-item pb-8"
                    :delete-disabled="parsedIngs.length <= 1"
                    @delete="parsedIngs.splice(index, 1)"
                    @insert-above="insertNewIngredient(index)"
                    @insert-below="insertNewIngredient(index + 1)"
                  >
                    <template #before-divider>
                      <p v-if="ingredient.input" class="py-0 my-0 text-xs text-on-surface/60">
                        {{ $t("recipe.original-text-with-value", { originalText: ingredient.input }) }}
                      </p>
                    </template>
                  </RecipeIngredientEditor>
                </div>
              </TransitionGroup>
            </VueDraggable>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom card actions slot -->
    <template v-if="!state.loading.parser" #custom-card-action>
      <!-- Step-through review actions -->
      <div v-if="!state.allReviewed" class="flex items-center justify-between gap-2">
        <label class="flex items-center gap-2 text-sm text-error cursor-pointer">
          <input
            v-model="currentIngShouldDelete"
            type="checkbox"
            class="w-4 h-4 rounded border-border accent-error"
          />
          {{ i18n.t('recipe.parser.delete-item') }}
        </label>
        <BaseButton
          :color="currentIngShouldDelete ? 'error' : 'info'"
          :icon="currentIngShouldDelete ? $globals.icons.delete : $globals.icons.arrowRightBold"
          :icon-right="!currentIngShouldDelete"
          :text="$t(currentIngShouldDelete ? 'recipe.parser.delete-item' : 'general.next')"
          @click="nextIngredient"
        />
      </div>
      <!-- Final save action -->
      <div v-else>
        <BaseButton
          create
          :text="$t('general.save')"
          :icon="$globals.icons.save"
          :loading="state.loading.save"
          @click="saveIngs"
        />
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import type { IngredientFood, IngredientUnit, ParsedIngredient, RecipeIngredient } from "~/lib/api/types/recipe";
import type { Parser } from "~/lib/api/user/recipes/recipe";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import { useUserApi } from "~/composables/api";
import { useIngredientTextParser } from "~/composables/recipes";
import { useFoodData, useFoodStore, useUnitData, useUnitStore } from "~/composables/store";
import { useGlobalI18n } from "~/composables/use-global-i18n";
import { alert } from "~/composables/use-toast";
import { useParsingPreferences } from "~/composables/use-users/preferences";

const props = defineProps<{
  modelValue: boolean;
  ingredients: NoUndefinedField<RecipeIngredient[]>;
}>();

const { ingredientToParserString } = useIngredientTextParser();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", value: NoUndefinedField<RecipeIngredient[]>): void;
}>();

const { $appInfo, $globals } = useNuxtApp();
const i18n = useGlobalI18n();
const api = useUserApi();
const drag = ref(false);

const unitStore = useUnitStore();
const unitData = useUnitData();
const foodStore = useFoodStore();
const foodData = useFoodData();

const parserPreferences = useParsingPreferences();
const parser = ref<Parser>(parserPreferences.value.parser || "nlp");
const availableParsers = computed(() => [
  { text: i18n.t("recipe.parser.natural-language-processor"), value: "nlp", hide: false },
  { text: i18n.t("recipe.parser.brute-parser"),               value: "brute", hide: false },
  { text: i18n.t("recipe.parser.openai-parser"),              value: "openai", hide: !$appInfo.enableOpenai },
]);

const confidenceThreshold = 0.85;
const parsedIngs = ref<ParsedIngredient[]>([]);

const currentIng = ref<ParsedIngredient | null>(null);
const currentMissingUnit = ref("");
const currentMissingFood = ref("");
const currentIngHasError = computed(() => currentMissingUnit.value || currentMissingFood.value);
const currentIngShouldDelete = ref(false);

const state = reactive({
  currentParsedIndex: -1,
  allReviewed: false,
  loading: {
    parser: false,
    save: false,
  },
});

function shouldReview(ing: ParsedIngredient): boolean {
  if (ing.ingredient.referencedRecipe) return false;
  if ((ing.confidence?.average || 0) < confidenceThreshold) return true;
  if (ing.ingredient.food && !ing.ingredient.food.id) return true;
  if (ing.ingredient.unit && !ing.ingredient.unit.id) return true;
  return false;
}

function checkUnit(ing: ParsedIngredient) {
  const unit = ing.ingredient.unit?.name;
  if (!unit || ing.ingredient.unit?.id) { currentMissingUnit.value = ""; return; }
  const potentialMatch = createdUnits.get(unit.toLowerCase());
  if (potentialMatch) { ing.ingredient.unit = potentialMatch; currentMissingUnit.value = ""; return; }
  currentMissingUnit.value = unit;
  ing.ingredient.unit = undefined;
}

function checkFood(ing: ParsedIngredient) {
  const food = ing.ingredient.food?.name;
  if (!food || ing.ingredient.food?.id) { currentMissingFood.value = ""; return; }
  const potentialMatch = createdFoods.get(food.toLowerCase());
  if (potentialMatch) { ing.ingredient.food = potentialMatch; currentMissingFood.value = ""; return; }
  currentMissingFood.value = food;
  ing.ingredient.food = undefined;
}

function nextIngredient() {
  let nextIndex = state.currentParsedIndex;
  if (currentIngShouldDelete.value) {
    parsedIngs.value.splice(state.currentParsedIndex, 1);
    currentIngShouldDelete.value = false;
  }
  else {
    nextIndex += 1;
  }

  while (nextIndex < parsedIngs.value.length) {
    const current = parsedIngs.value[nextIndex];
    if (shouldReview(current)) {
      state.currentParsedIndex = nextIndex;
      currentIng.value = current;
      currentIngShouldDelete.value = false;
      checkUnit(current);
      checkFood(current);
      return;
    }
    nextIndex += 1;
  }

  state.allReviewed = true;
}

async function parseIngredients() {
  if (state.loading.parser || !props.ingredients?.length) { state.loading.parser = false; return; }
  state.loading.parser = true;
  try {
    const filteredIngredients = props.ingredients.filter(ing => !ing.referencedRecipe);
    const ingsAsString = filteredIngredients.map(ing => ingredientToParserString(ing));
    const { data, error } = await api.recipes.parseIngredients(parser.value, ingsAsString);
    if (error || !data) throw new Error("Failed to parse ingredients");

    data.forEach((parsed, index) => {
      parsed.ingredient.title = filteredIngredients[index]?.title || "";
    });

    const recipeRefs = props.ingredients.filter(ing => ing.referencedRecipe).map(ing => ({
      input: ing.note || "",
      confidence: {},
      ingredient: ing,
    }));
    parsedIngs.value = [...data, ...recipeRefs];
    state.currentParsedIndex = -1;
    state.allReviewed = false;
    createdUnits.clear();
    createdFoods.clear();
    currentIngShouldDelete.value = false;
    nextIngredient();
  }
  catch (error) {
    console.error("Error parsing ingredients:", error);
    alert.error(i18n.t("events.something-went-wrong"));
  }
  finally {
    state.loading.parser = false;
  }
}

const createdUnits = new Map<string, IngredientUnit>();
const createdFoods = new Map<string, IngredientFood>();

async function createMissingUnit() {
  if (!currentMissingUnit.value) return;
  unitData.reset();
  unitData.data.name = currentMissingUnit.value;
  let newUnit: IngredientUnit | null = createdUnits.get(unitData.data.name) || null;
  if (!newUnit) newUnit = await unitStore.actions.createOne(unitData.data);
  if (!newUnit) { alert.error(i18n.t("events.something-went-wrong")); return; }
  currentIng.value!.ingredient.unit = newUnit;
  createdUnits.set(newUnit.name.toLowerCase(), newUnit);
  currentMissingUnit.value = "";
}

async function createMissingFood() {
  if (!currentMissingFood.value) return;
  foodData.reset();
  foodData.data.name = currentMissingFood.value;
  let newFood: IngredientFood | null = createdFoods.get(foodData.data.name) || null;
  if (!newFood) newFood = await foodStore.actions.createOne(foodData.data);
  if (!newFood) { alert.error(i18n.t("events.something-went-wrong")); return; }
  currentIng.value!.ingredient.food = newFood;
  createdFoods.set(newFood.name.toLowerCase(), newFood);
  currentMissingFood.value = "";
}

async function addMissingUnitAsAlias() {
  const unit = currentIng.value?.ingredient.unit as IngredientUnit | undefined;
  if (!currentMissingUnit.value || !unit?.id) return;
  unit.aliases = unit.aliases || [];
  if (unit.aliases.map(a => a.name).includes(currentMissingUnit.value)) return;
  unit.aliases.push({ name: currentMissingUnit.value });
  const updated = await unitStore.actions.updateOne(unit);
  if (!updated) { alert.error(i18n.t("events.something-went-wrong")); return; }
  currentIng.value!.ingredient.unit = updated;
  currentMissingUnit.value = "";
}

async function addMissingFoodAsAlias() {
  const food = currentIng.value?.ingredient.food as IngredientFood | undefined;
  if (!currentMissingFood.value || !food?.id) return;
  food.aliases = food.aliases || [];
  if (food.aliases.map(a => a.name).includes(currentMissingFood.value)) return;
  food.aliases.push({ name: currentMissingFood.value });
  const updated = await foodStore.actions.updateOne(food);
  if (!updated) { alert.error(i18n.t("events.something-went-wrong")); return; }
  currentIng.value!.ingredient.food = updated;
  currentMissingFood.value = "";
}

watch(() => props.modelValue, () => {
  if (props.modelValue) parseIngredients();
});

watch(parser, () => {
  parserPreferences.value.parser = parser.value;
  parseIngredients();
});

watch([parsedIngs, () => state.allReviewed], () => {
  if (!state.allReviewed) return;
  if (!parsedIngs.value.length) insertNewIngredient(0);
}, { immediate: true, deep: true });

function asPercentage(num: number | undefined): string {
  if (!num) return "0%";
  return Math.round(num * 100).toFixed(2) + "%";
}

function insertNewIngredient(index: number) {
  const ing = {
    input: "",
    confidence: {},
    ingredient: { quantity: 0, referenceId: uuid4() },
  } as ParsedIngredient;
  parsedIngs.value.splice(index, 0, ing);
}

function saveIngs() {
  emit("save", parsedIngs.value.map(x => x.ingredient as NoUndefinedField<RecipeIngredient>));
  state.loading.save = true;
}
</script>
