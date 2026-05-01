<template>
  <div>
    <div class="mb-4">
      <h2 class="mb-4 text-xl font-medium opacity-80">
        {{ $t("recipe.ingredients") }}
      </h2>
      <BannerWarning v-if="!hasFoodOrUnit && !liteMode">
        {{ $t("recipe.ingredients-not-parsed-description", { parse: $t('recipe.parse') }) }}
      </BannerWarning>
    </div>

    <VueDraggable
      v-if="recipe.recipeIngredient.length > 0"
      v-model="recipe.recipeIngredient"
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
        <RecipeIngredientEditor
          v-for="(ingredient, index) in recipe.recipeIngredient"
          :key="ingredient.referenceId"
          v-model="recipe.recipeIngredient[index]"
          :is-recipe="ingredientIsRecipe(ingredient)"
          enable-drag-handle
          enable-context-menu
          class="list-group-item"
          @delete="recipe.recipeIngredient.splice(index, 1)"
          @insert-above="insertNewIngredient(index)"
          @insert-below="insertNewIngredient(index + 1)"
        />
      </TransitionGroup>
    </VueDraggable>

    <!-- Empty state -->
    <div
      v-else
      class="rounded-lg border border-dashed border-border bg-surface/50 h-12"
    />

    <!-- Action buttons -->
    <div class="flex flex-wrap justify-center sm:justify-end gap-2 mt-3">
      <!-- Parse button (non-lite only) -->
      <button
        v-if="!liteMode"
        type="button"
        :title="parserToolTip"
        :disabled="hasFoodOrUnit"
        class="bs-btn bs-btn-sm bs-btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
        @click="toggleIsParsing(true)"
      >
        <AppIcon :path="$globals.icons.foods" size="sm" />
        {{ $t('recipe.parse') }}
      </button>

      <!-- Hidden bulk-add dialog trigger -->
      <RecipeDialogBulkAdd
        ref="domBulkAddDialog"
        style="display: none"
        @bulk-data="addIngredient"
      />

      <!-- Split "Add" button: main action + dropdown -->
      <div class="flex">
        <button
          type="button"
          class="bs-btn bs-btn-sm bs-btn-primary rounded-r-none"
          @click="addIngredient()"
        >
          <AppIcon :path="$globals.icons.createAlt" size="sm" />
          {{ $t('general.add') }}
        </button>
        <Menu as="div" class="relative">
          <MenuButton class="bs-btn bs-btn-sm bs-btn-primary rounded-l-none border-l border-white/30 px-2">
            <AppIcon :path="$globals.icons.chevronDown" size="sm" />
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
              class="absolute right-0 bottom-full mb-1 z-50 w-48 rounded-lg border border-border
                     bg-surface shadow-lg py-1 focus:outline-none"
            >
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface text-left"
                  :class="active ? 'bg-primary/10' : ''"
                  @click="addIngredient()"
                >
                  <AppIcon :path="$globals.icons.foods" size="sm" class="text-on-surface/60" />
                  {{ $t('new-recipe.add-food') }}
                </button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface text-left"
                  :class="active ? 'bg-primary/10' : ''"
                  @click="addRecipe()"
                >
                  <AppIcon :path="$globals.icons.silverwareForkKnife" size="sm" class="text-on-surface/60" />
                  {{ $t('new-recipe.add-recipe') }}
                </button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface text-left"
                  :class="active ? 'bg-primary/10' : ''"
                  @click="showBulkAdd()"
                >
                  <AppIcon :path="$globals.icons.create" size="sm" class="text-on-surface/60" />
                  {{ $t('new-recipe.bulk-add') }}
                </button>
              </MenuItem>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { VueDraggable } from "vue-draggable-plus";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe, RecipeIngredient } from "~/lib/api/types/recipe";
import RecipeIngredientEditor from "~/components/Domain/Recipe/RecipeIngredientEditor.vue";
import RecipeDialogBulkAdd from "~/components/Domain/Recipe/RecipeDialogBulkAdd.vue";
import { usePageState } from "~/composables/recipe-page/shared-state";
import { uuid4 } from "~/composables/use-utils";
import { useLiteMode } from "~/composables/use-lite-mode";

const { $globals } = useNuxtApp();
const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const ingredientsWithRecipe = new Map<string, boolean>();
const i18n = useI18n();

const drag = ref(false);
const domBulkAddDialog = ref<InstanceType<typeof RecipeDialogBulkAdd> | null>(null);
const { toggleIsParsing } = usePageState(recipe.value.slug);
const liteMode = useLiteMode();

const hasFoodOrUnit = computed(() => {
  if (!recipe.value) return false;
  if (recipe.value.recipeIngredient) {
    for (const ingredient of recipe.value.recipeIngredient) {
      if (ingredient.food || ingredient.unit) return true;
    }
  }
  return false;
});

const parserToolTip = computed(() => {
  if (hasFoodOrUnit.value) {
    return i18n.t("recipe.recipes-with-units-or-foods-defined-cannot-be-parsed");
  }
  return i18n.t("recipe.parse-ingredients");
});

function showBulkAdd() {
  domBulkAddDialog.value?.open();
}

function ingredientIsRecipe(ingredient: RecipeIngredient): boolean {
  if (ingredient.referencedRecipe) return true;
  if (ingredient.referenceId) return !!ingredientsWithRecipe.get(ingredient.referenceId);
  return false;
}

function addIngredient(ingredients: Array<string> | null = null) {
  if (ingredients?.length) {
    const newIngredients = ingredients.map(x => ({
      referenceId: uuid4(),
      title: "",
      note: x,
      unit: undefined,
      food: undefined,
      quantity: 0,
    }));
    if (newIngredients) {
      // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
      recipe.value.recipeIngredient.push(...newIngredients);
    }
  }
  else {
    recipe.value.recipeIngredient.push({
      referenceId: uuid4(),
      title: "",
      note: "",
      // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
      unit: undefined,
      // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
      food: undefined,
      quantity: 0,
    });
  }
}

function addRecipe(recipes: Array<string> | null = null) {
  const refId = uuid4();
  ingredientsWithRecipe.set(refId, true);

  if (recipes?.length) {
    const newRecipes = recipes.map(x => ({
      referenceId: refId,
      title: "",
      note: x,
      unit: undefined,
      referencedRecipe: undefined,
      quantity: 1,
    }));
    if (newRecipes) {
      // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
      recipe.value.recipeIngredient.push(...newRecipes);
    }
  }
  else {
    recipe.value.recipeIngredient.push({
      referenceId: refId,
      title: "",
      note: "",
      // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
      unit: undefined,
      // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
      referencedRecipe: undefined,
      quantity: 1,
    });
  }
}

function insertNewIngredient(dest: number) {
  recipe.value.recipeIngredient.splice(dest, 0, {
    referenceId: uuid4(),
    title: "",
    note: "",
    // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
    unit: undefined,
    // @ts-expect-error - prop can be null-type but NoUndefinedField forces it to be set
    food: undefined,
    quantity: 0,
  });
}
</script>
