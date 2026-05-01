<template>
  <div v-if="dialog">
    <!-- Step 1: Choose a shopping list -->
    <BaseDialog
      v-if="shoppingListDialog && ready"
      v-model="dialog"
      :title="$t('recipe.add-to-list')"
      :icon="$globals.icons.cartCheck"
    >
      <div class="px-4 py-3">
        <!-- Empty state -->
        <p v-if="!filteredShoppingLists.length" class="text-center text-sm text-on-surface/60 py-6">
          {{ $t('shopping-list.no-shopping-lists-found') }}
        </p>

        <!-- List choices -->
        <div class="space-y-2">
          <button
            v-for="list in filteredShoppingLists"
            :key="list.id"
            type="button"
            class="w-full text-left rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-on-surface hover:bg-primary/5 transition-colors border-l-4 border-l-primary"
            @click="openShoppingListIngredientDialog(list)"
          >
            {{ list.name }}
          </button>
        </div>
      </div>

      <!-- Footer: cancel + show-all toggle -->
      <template #card-actions>
        <button
          type="button"
          class="px-4 py-2 text-sm text-on-surface/60 hover:text-on-surface transition-colors"
          @click="dialog = false"
        >
          {{ $t("general.cancel") }}
        </button>
        <div class="flex-1 flex justify-end">
          <label class="flex items-center gap-2 mr-4 cursor-pointer">
            <input
              v-model="preferences.viewAllLists"
              type="checkbox"
              class="accent-primary"
              @change="setShowAllToggled()"
            />
            <span class="text-sm text-on-surface">{{ $t('general.show-all') }}</span>
          </label>
        </div>
      </template>
    </BaseDialog>

    <!-- Step 2: Choose ingredients to add -->
    <BaseDialog
      v-if="shoppingListIngredientDialog"
      v-model="dialog"
      :title="selectedShoppingList?.name || $t('recipe.add-to-list')"
      :icon="$globals.icons.cartCheck"
      width="70%"
      :submit-text="$t('recipe.add-to-list')"
      can-submit
      @submit="addRecipesToList()"
    >
      <div class="max-h-[70vh] overflow-y-auto px-4 py-3">
        <div
          v-for="(recipeSection, recipeSectionIndex) in recipeIngredientSections"
          :key="recipeSection.recipeId + recipeSectionIndex"
        >
          <!-- Divider between recipe sections -->
          <hr v-if="recipeSectionIndex > 0" class="border-border mt-4 mb-3" />

          <!-- Recipe section title (multi-recipe mode) -->
          <div v-if="recipeIngredientSections.length > 1" class="text-center mb-3">
            <h3 class="text-base font-semibold text-on-surface inline-flex items-center gap-1">
              {{ recipeSection.recipeName }}
              <span
                v-if="recipeSection.parentRecipe?.name"
                :title="$t('shopping-list.ingredient-of-recipe', { recipe: recipeSection.parentRecipe.name })"
                class="cursor-help"
              >
                <AppIcon :path="$globals.icons.potSteam" size="xs" class="text-on-surface/50" />
              </span>
            </h3>
            <p v-if="recipeSection.recipeScale > 1" class="text-xs text-on-surface/60">
              ({{ $t("recipe.quantity") }}: {{ recipeSection.recipeScale }})
            </p>
          </div>

          <!-- Ingredient sections -->
          <div
            v-for="(ingredientSection, ingredientSectionIndex) in recipeSection.ingredientSections"
            :key="recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex"
          >
            <!-- Section name -->
            <h4
              v-if="ingredientSection.sectionName"
              class="text-sm font-semibold text-on-surface mt-3 mb-1"
            >
              {{ ingredientSection.sectionName }}
            </h4>

            <!-- Ingredients grid -->
            <div
              :class="smAndDown ? 'flex flex-col' : 'ingredient-grid'"
              :style="smAndDown ? {} : { gridTemplateRows: `repeat(${Math.ceil(ingredientSection.ingredients.length / 2)}, min-content)` }"
            >
              <label
                v-for="(ingredientData, i) in ingredientSection.ingredients"
                :key="recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex + i"
                class="flex items-center gap-2 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="ingredientData.checked"
                  class="accent-primary shrink-0"
                  @change="recipeIngredientSections[recipeSectionIndex]
                    .ingredientSections[ingredientSectionIndex]
                    .ingredients[i].checked = !ingredientData.checked"
                />
                <RecipeIngredientListItem
                  :ingredient="ingredientData.ingredient"
                  :scale="recipeSection.recipeScale"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Check/Uncheck all -->
      <div class="flex justify-end px-4 pb-4 mt-2">
        <BaseButtonGroup
          :buttons="[
            { icon: $globals.icons.checkboxBlankOutline, text: $t('shopping-list.uncheck-all-items'), event: 'uncheck' },
            { icon: $globals.icons.checkboxOutline, text: $t('shopping-list.check-all-items'), event: 'check' },
          ]"
          @uncheck="bulkCheckIngredients(false)"
          @check="bulkCheckIngredients(true)"
        />
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { toRefs, useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import RecipeIngredientListItem from "./RecipeIngredientListItem.vue";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useShoppingListPreferences } from "~/composables/use-users/preferences";
import type { RecipeIngredient, ShoppingListAddRecipeParamsBulk, ShoppingListSummary } from "~/lib/api/types/household";
import type { Recipe } from "~/lib/api/types/recipe";

export interface RecipeWithScale extends Recipe {
  scale: number;
}

export interface ShoppingListIngredient {
  checked: boolean;
  ingredient: RecipeIngredient;
}

export interface ShoppingListIngredientSection {
  sectionName: string;
  ingredients: ShoppingListIngredient[];
}

export interface ShoppingListRecipeIngredientSection {
  recipeId: string;
  recipeName: string;
  recipeScale: number;
  ingredientSections: ShoppingListIngredientSection[];
  parentRecipe?: Recipe;
}

interface Props {
  recipes?: RecipeWithScale[];
  shoppingLists?: ShoppingListSummary[];
}
const props = withDefaults(defineProps<Props>(), {
  recipes: undefined,
  shoppingLists: () => [],
});

const dialog = defineModel<boolean>({ default: false });

const i18n = useI18n();
const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const api = useUserApi();
const preferences = useShoppingListPreferences();
const bp = useBreakpoints(breakpointsTailwind);
const smAndDown = bp.smallerOrEqual("sm");
const ready = ref(false);

// Capture values at initialization to avoid reactive updates
const currentHouseholdSlug = ref("");
const filteredShoppingLists = ref<ShoppingListSummary[]>([]);

const state = reactive({
  shoppingListDialog: false,
  shoppingListIngredientDialog: false,
  shoppingListShowAllToggled: false,
});

const { shoppingListDialog, shoppingListIngredientDialog, shoppingListShowAllToggled: _shoppingListShowAllToggled } = toRefs(state);

const recipeIngredientSections = ref<ShoppingListRecipeIngredientSection[]>([]);
const selectedShoppingList = ref<ShoppingListSummary | null>(null);

watch([dialog, () => preferences.value.viewAllLists], () => {
  if (dialog.value) {
    currentHouseholdSlug.value = auth.user.value?.householdSlug || "";
    filteredShoppingLists.value = props.shoppingLists.filter(
      list => preferences.value.viewAllLists || list.userId === auth.user.value?.id,
    );

    if (filteredShoppingLists.value.length === 1 && !state.shoppingListShowAllToggled) {
      selectedShoppingList.value = filteredShoppingLists.value[0];
      openShoppingListIngredientDialog(selectedShoppingList.value);
    }
    else {
      state.shoppingListDialog = true;
      ready.value = true;
    }
  }
  else if (!dialog.value) {
    initState();
  }
});

function buildIngredientSections(ingredients: ShoppingListIngredient[]): ShoppingListIngredientSection[] {
  let currentTitle = "";
  const onHandIngs: ShoppingListIngredient[] = [];
  const sections = ingredients.reduce((acc, ing) => {
    if (ing.ingredient.title) {
      currentTitle = ing.ingredient.title;
    }

    if (!acc.length || currentTitle !== acc[acc.length - 1].sectionName) {
      if (acc.length) {
        acc[acc.length - 1].ingredients.push(...onHandIngs);
        onHandIngs.length = 0;
      }
      acc.push({ sectionName: currentTitle, ingredients: [] });
    }

    const householdsWithFood = ing.ingredient?.food?.householdsWithIngredientFood || [];
    if (householdsWithFood.includes(currentHouseholdSlug.value)) {
      onHandIngs.push(ing);
      return acc;
    }

    acc[acc.length - 1].ingredients.push(ing);
    return acc;
  }, [] as ShoppingListIngredientSection[]);

  if (sections.length) {
    sections[sections.length - 1].ingredients.push(...onHandIngs);
  }
  return sections;
}

async function consolidateRecipesIntoSections(recipes: RecipeWithScale[]) {
  const recipeSectionMap = new Map<string, ShoppingListRecipeIngredientSection>();

  function addSubRecipeToMap(ing: RecipeIngredient, parentQuantity: number, parentScale: number, parentRecipe: Recipe) {
    const ref = ing.referencedRecipe!;
    const key = ref.id || ref.slug || "";
    const ownIngs: ShoppingListIngredient[] = [];
    const subRefIngs: RecipeIngredient[] = [];

    for (const subIng of ref.recipeIngredient ?? []) {
      if (subIng.referencedRecipe) {
        subRefIngs.push(subIng);
      }
      else {
        const householdsWithFood = subIng.food?.householdsWithIngredientFood || [];
        ownIngs.push({
          checked: !householdsWithFood.includes(currentHouseholdSlug.value),
          ingredient: { ...subIng, quantity: (ing.quantity || 1) * (subIng.quantity || 1) },
        });
      }
    }

    recipeSectionMap.set(key, {
      recipeId: ref.id || "",
      recipeName: ref.name || "",
      recipeScale: parentQuantity * parentScale,
      ingredientSections: buildIngredientSections(ownIngs),
      parentRecipe,
    });

    subRefIngs.forEach(subIng => addSubRecipeToMap(subIng, (ing.quantity || 1) * (subIng.quantity || 1), parentScale, ref));
  }

  for (const recipe of recipes) {
    if (!recipe.slug) {
      continue;
    }

    if (recipeSectionMap.has(recipe.slug)) {
      const existingSection = recipeSectionMap.get(recipe.slug);
      if (existingSection) {
        existingSection.recipeScale += recipe.scale;
      }
      continue;
    }

    // Create a local copy to avoid mutating props
    let recipeData = { ...recipe };
    if (!(recipeData.id && recipeData.name && recipeData.recipeIngredient)) {
      const { data } = await api.recipes.getOne(recipeData.slug);
      if (!data?.recipeIngredient?.length) {
        continue;
      }
      recipeData = {
        ...recipeData,
        id: data.id || "",
        name: data.name || "",
        recipeIngredient: data.recipeIngredient,
      };
    }
    else if (!recipeData.recipeIngredient.length) {
      continue;
    }

    const ownIngs: ShoppingListIngredient[] = [];
    const subRefIngs: RecipeIngredient[] = [];
    recipeData.recipeIngredient.forEach((ing) => {
      if (ing.referencedRecipe) {
        subRefIngs.push(ing);
      }
      else {
        const householdsWithFood = ing.food?.householdsWithIngredientFood || [];
        ownIngs.push({
          checked: !householdsWithFood.includes(currentHouseholdSlug.value),
          ingredient: ing,
        });
      }
    });

    recipeSectionMap.set(recipe.slug, {
      recipeId: recipeData.id,
      recipeName: recipeData.name,
      recipeScale: recipeData.scale,
      ingredientSections: buildIngredientSections(ownIngs),
    });

    subRefIngs.forEach(ing => addSubRecipeToMap(ing, ing.quantity || 1, recipeData.scale, recipeData));
  }

  recipeIngredientSections.value = Array.from(recipeSectionMap.values());
}

function initState() {
  state.shoppingListDialog = false;
  state.shoppingListIngredientDialog = false;
  state.shoppingListShowAllToggled = false;
  recipeIngredientSections.value = [];
  selectedShoppingList.value = null;
}

initState();

async function openShoppingListIngredientDialog(list: ShoppingListSummary) {
  if (!props.recipes?.length) {
    return;
  }

  selectedShoppingList.value = list;
  await consolidateRecipesIntoSections(props.recipes);
  state.shoppingListDialog = false;
  state.shoppingListIngredientDialog = true;
}

function setShowAllToggled() {
  state.shoppingListShowAllToggled = true;
}

function bulkCheckIngredients(value = true) {
  recipeIngredientSections.value.forEach((recipeSection) => {
    recipeSection.ingredientSections.forEach((ingSection) => {
      ingSection.ingredients.forEach((ing) => {
        ing.checked = value;
      });
    });
  });
}

async function addRecipesToList() {
  if (!selectedShoppingList.value) {
    return;
  }

  const recipeData: ShoppingListAddRecipeParamsBulk[] = [];
  recipeIngredientSections.value.forEach((section) => {
    const ingredients: RecipeIngredient[] = [];
    section.ingredientSections.forEach((ingSection) => {
      ingSection.ingredients.forEach((ing) => {
        if (ing.checked) {
          ingredients.push(ing.ingredient);
        }
      });
    });

    if (!ingredients.length) {
      return;
    }

    recipeData.push(
      {
        recipeId: section.recipeId,
        recipeIncrementQuantity: section.recipeScale,
        recipeIngredients: ingredients,
      },
    );
  });

  const { error } = await api.shopping.lists.addRecipes(selectedShoppingList.value.id, recipeData);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  error ? alert.error(i18n.t("recipe.failed-to-add-recipes-to-list")) : alert.success(i18n.t("recipe.successfully-added-to-list"));

  state.shoppingListDialog = false;
  state.shoppingListIngredientDialog = false;
  dialog.value = false;
}
</script>

<style scoped lang="css">
.ingredient-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0.5rem;
}
</style>
