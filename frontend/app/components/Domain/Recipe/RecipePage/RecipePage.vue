<template>
  <div>
    <BaseDialog
      v-model="discardDialog"
      :title="$t('general.discard-changes')"
      color="warning"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="confirmDiscard"
      @cancel="cancelDiscard"
    >
      {{ $t("general.discard-changes-description") }}
    </BaseDialog>
    <RecipePageParseDialog
      :model-value="isParsing"
      :ingredients="recipe.recipeIngredient"
      :width="smAndDown ? '100%' : '80%'"
      @update:model-value="toggleIsParsing"
      @save="saveParsedIngredients"
    />

    <!-- Normal view mode -->
    <div v-show="!isCookMode" class="px-0">
      <div class="print:hidden">
        <RecipePageHeader
          :recipe="recipe"
          :recipe-scale="scale"
          :landscape="landscape"
          @save="saveRecipe"
          @delete="deleteRecipe"
          @close="closeEditor"
        />
        <RecipeJsonEditor
          v-if="isEditJSON"
          v-model="recipe"
          class="mt-10"
          mode="text"
          :main-menu-bar="false"
        />
        <div v-else class="px-4 py-4">
          <!--
            This is where most of the main content is rendered. Some components include state for both Edit and View modes
            which is why some have explicit v-if statements and others use the composition API to determine and manage
            the shared state internally.

            The global recipe object is shared down the tree of components and _is_ mutated by child components. This is
            some-what of a hack of the system and goes against the principles of Vue, but it _does_ seem to work and streamline
            a significant amount of prop management.
          -->
          <div>
            <RecipePageInfoEditor v-if="isEditMode" v-model="recipe" />
          </div>
          <div>
            <RecipePageEditorToolbar v-if="isEditForm" v-model="recipe" />
          </div>
          <div>
            <RecipePageIngredientEditor v-if="isEditForm" v-model="recipe" />
          </div>
          <div>
            <RecipePageScale v-model="scale" :recipe="recipe" />
          </div>

          <!--
            Two-column layout: ingredients on the left (sticky on desktop), instructions on the right.
          -->
          <div class="flex flex-wrap items-start">
            <!-- Left column: ingredients + organizers (hidden in cook mode unless editing) -->
            <div
              v-if="!isCookMode || isEditForm"
              class="w-full md:w-1/3"
              :class="mdAndUp ? 'md:border-r md:border-border' : ''"
            >
              <div
                :style="mdAndUp && !isEditForm
                  ? 'position: sticky; top: 48px; max-height: calc(100vh - 60px); overflow-y: auto;'
                  : ''"
              >
                <RecipePageIngredientToolsView v-if="!isEditForm" :recipe="recipe" :scale="scale" class="pr-2" />
                <RecipePageOrganizers v-if="mdAndUp" v-model="recipe" class="pr-2" @item-selected="chipClicked" />
              </div>
            </div>

            <!-- Right column: instructions (full-width in cook mode) -->
            <div :class="isCookMode ? 'w-full' : 'w-full md:w-2/3'">
              <RecipePageInstructions
                v-model="recipe.recipeInstructions"
                v-model:assets="recipe.assets"
                :recipe="recipe"
                :scale="scale"
              />
              <div v-if="isEditForm" class="flex">
                <RecipeDialogBulkAdd class="ml-auto my-2 mr-1" @bulk-data="addStep" />
                <BaseButton class="my-2" @click="addStep()">
                  {{ $t("general.add") }}
                </BaseButton>
              </div>
              <div v-if="!mdAndUp">
                <RecipePageOrganizers v-model="recipe" />
              </div>
              <RecipeNotes v-model="recipe.notes" :edit="isEditForm" />
            </div>
          </div>

          <RecipePageFooter v-model="recipe" />
        </div>
      </div>
      <WakelockSwitch />
      <RecipePageComments
        v-if="!recipe.settings?.disableComments && !isEditForm && !isCookMode"
        v-model="recipe"
        class="px-1 my-4 print:hidden"
      />
      <RecipePrintContainer :recipe="recipe" :scale="scale" />
    </div>

    <!-- Cook mode: side-by-side scrollable columns (no linked ingredients) -->
    <!-- Each column scrolls independently; height fills viewport minus navbar (48px) -->
    <div
      v-show="isCookMode && !hasLinkedIngredients"
      :style="smAndUp ? 'height: calc(100vh - 48px)' : ''"
      class="overflow-hidden"
    >
      <div class="flex overflow-hidden h-full">
        <!-- Ingredients column -->
        <div class="w-full sm:w-5/12 overflow-y-auto pl-4 pr-3 py-2 h-full">
          <div class="flex items-center">
            <RecipePageScale v-model="scale" :recipe="recipe" />
          </div>
          <RecipePageIngredientToolsView
            v-if="!isEditForm"
            :recipe="recipe"
            :scale="scale"
            :is-cook-mode="isCookMode"
          />
          <hr class="border-t border-border my-2" />
        </div>
        <!-- Instructions column -->
        <div
          class="overflow-y-auto w-full sm:w-7/12 h-full"
          :class="smAndDown ? 'py-2' : 'py-6'"
        >
          <h2 class="text-xl px-4 font-medium opacity-80">
            {{ $t('recipe.instructions') }}
          </h2>
          <RecipePageInstructions
            v-model="recipe.recipeInstructions"
            v-model:assets="recipe.assets"
            class="overflow-y-hidden px-4"
            :recipe="recipe"
            :scale="scale"
          />
        </div>
      </div>
    </div>

    <!-- Cook mode: linked ingredients mode (instructions with inline ingredient chips) -->
    <div v-show="isCookMode && hasLinkedIngredients">
      <div class="mt-2 px-2 md:px-4">
        <RecipePageScale v-model="scale" :recipe="recipe" />
      </div>
      <RecipePageInstructions
        v-model="recipe.recipeInstructions"
        v-model:assets="recipe.assets"
        class="overflow-y-hidden -mt-5 px-2 md:px-4"
        :recipe="recipe"
        :scale="scale"
      />

      <div v-if="notLinkedIngredients.length > 0" class="px-2 md:px-4 pb-4">
        <hr class="border-t border-border my-2" />
        <div>
          <h3 class="text-base font-semibold px-4 py-2">
            {{ $t("recipe.not-linked-ingredients") }}
          </h3>
          <RecipeIngredients
            :value="notLinkedIngredients"
            :scale="scale"
            :is-cook-mode="isCookMode"
          />
        </div>
      </div>
    </div>

    <!-- Cook mode exit button (fixed top-right) -->
    <button
      v-if="isCookMode"
      type="button"
      class="fixed right-3 top-[60px] bs-btn bs-btn-primary rounded-full p-2 z-50"
      @click="toggleCookMode()"
    >
      <AppIcon :path="$globals.icons.close" size="md" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { invoke, until } from "@vueuse/core";
import type { RouteLocationNormalized } from "vue-router";
import RecipeIngredients from "../RecipeIngredients.vue";
import RecipePageEditorToolbar from "./RecipePageParts/RecipePageEditorToolbar.vue";
import RecipePageFooter from "./RecipePageParts/RecipePageFooter.vue";
import RecipePageHeader from "./RecipePageParts/RecipePageHeader.vue";
import RecipePageIngredientEditor from "./RecipePageParts/RecipePageIngredientEditor.vue";
import RecipePageIngredientToolsView from "./RecipePageParts/RecipePageIngredientToolsView.vue";
import RecipePageInstructions from "./RecipePageParts/RecipePageInstructions.vue";
import RecipePageOrganizers from "./RecipePageParts/RecipePageOrganizers.vue";
import RecipePageParseDialog from "./RecipePageParts/RecipePageParseDialog.vue";
import RecipePageScale from "./RecipePageParts/RecipePageScale.vue";
import RecipePageInfoEditor from "./RecipePageParts/RecipePageInfoEditor.vue";
import RecipePageComments from "./RecipePageParts/RecipePageComments.vue";
import RecipePrintContainer from "~/components/Domain/Recipe/RecipePrintContainer.vue";
import {
  clearPageState,
  PageMode,
  usePageState,
} from "~/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeTag, RecipeTool } from "~/lib/api/types/recipe";
import { useRouteQuery } from "~/composables/use-router";
import { useUserApi } from "~/composables/api";
import { uuid4, deepCopy } from "~/composables/use-utils";
import RecipeDialogBulkAdd from "~/components/Domain/Recipe/RecipeDialogBulkAdd.vue";
import RecipeNotes from "~/components/Domain/Recipe/RecipeNotes.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useNavigationWarning } from "~/composables/use-navigation-warning";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

const { mdAndUp, smAndDown, smAndUp } = useDisplay();
const auth = useMealieAuth();
const route = useRoute();
const { isOwnGroup } = useLoggedInState();

const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user?.value?.groupSlug || "");

const router = useRouter();
const api = useUserApi();
const { setMode, isEditForm, isEditJSON, isCookMode, isEditMode, isParsing, toggleCookMode, toggleIsParsing }
  = usePageState(recipe.value.slug);
const { deactivateNavigationWarning } = useNavigationWarning();

const notLinkedIngredients = computed(() => {
  return recipe.value.recipeIngredient.filter((ingredient) => {
    return !recipe.value.recipeInstructions.some(step =>
      step.ingredientReferences?.map(ref => ref.referenceId).includes(ingredient.referenceId),
    );
  });
});

/** =============================================================
 * Recipe Snapshot on Mount
 * Used to detect unsaved changes and prompt the user before leaving.
 */
const originalRecipe = ref<Recipe | null>(null);
const discardDialog = ref(false);
const pendingRoute = ref<RouteLocationNormalized | null>(null);

invoke(async () => {
  await until(recipe.value).not.toBeNull();
  originalRecipe.value = deepCopy(recipe.value);
});

function hasUnsavedChanges(): boolean {
  if (originalRecipe.value === null) {
    return false;
  }
  return JSON.stringify(recipe.value) !== JSON.stringify(originalRecipe.value);
}

function restoreOriginalRecipe() {
  if (originalRecipe.value) {
    recipe.value = deepCopy(originalRecipe.value) as NoUndefinedField<Recipe>;
  }
}

function closeEditor() {
  if (hasUnsavedChanges()) {
    pendingRoute.value = null;
    discardDialog.value = true;
  }
  else {
    setMode(PageMode.VIEW);
  }
}

function confirmDiscard() {
  restoreOriginalRecipe();
  discardDialog.value = false;

  if (pendingRoute.value) {
    const destination = pendingRoute.value;
    pendingRoute.value = null;
    router.push(destination);
  }
  else {
    setMode(PageMode.VIEW);
  }
}

function cancelDiscard() {
  discardDialog.value = false;
  pendingRoute.value = null;
}

onBeforeRouteLeave((to) => {
  if (isEditMode.value && hasUnsavedChanges()) {
    pendingRoute.value = to;
    discardDialog.value = true;
    return false;
  }
});

onUnmounted(() => {
  deactivateNavigationWarning();
  toggleCookMode();
  clearPageState(recipe.value.slug || "");
});

const hasLinkedIngredients = computed(() => {
  return recipe.value.recipeInstructions.some(
    step => step.ingredientReferences && step.ingredientReferences.length > 0,
  );
});

/** =============================================================
 * Set State onMounted
 */

type BooleanString = "true" | "false" | "";

const paramsEdit = useRouteQuery<BooleanString>("edit", "");
const paramsParse = useRouteQuery<BooleanString>("parse", "");

onMounted(() => {
  if (paramsEdit.value === "true" && isOwnGroup.value) {
    setMode(PageMode.EDIT);
  }

  if (paramsParse.value === "true" && isOwnGroup.value) {
    toggleIsParsing(true);
  }
});

watch(isEditMode, (newVal) => {
  if (!newVal) {
    paramsEdit.value = undefined;
  }
});

watch(isParsing, () => {
  if (!isParsing.value) {
    paramsParse.value = undefined;
  }
});

/** =============================================================
 * Recipe Save / Delete
 */

async function saveRecipe() {
  const { data, error } = await api.recipes.updateOne(recipe.value.slug, recipe.value);
  if (!error) {
    setMode(PageMode.VIEW);
  }
  if (data?.slug) {
    router.push(`/g/${groupSlug.value}/r/` + data.slug);
    recipe.value = data as NoUndefinedField<Recipe>;
    originalRecipe.value = deepCopy(recipe.value);
  }
}

async function saveParsedIngredients(ingredients: NoUndefinedField<RecipeIngredient[]>) {
  recipe.value.recipeIngredient = ingredients;
  await saveRecipe();
  toggleIsParsing(false);
}

async function deleteRecipe() {
  const { data } = await api.recipes.deleteOne(recipe.value.slug);
  if (data?.slug) {
    router.push(`/g/${groupSlug.value}`);
  }
}

/** =============================================================
 * View Preferences
 */
const landscape = computed(() => {
  const preferLandscape = recipe.value.settings?.landscapeView;
  const smallScreen = !smAndUp.value;

  if (preferLandscape) {
    return true;
  }
  else if (smallScreen) {
    return true;
  }

  return false;
});

/** =============================================================
 * Bulk Step Editor
 */

function addStep(steps: Array<string> | null = null) {
  if (!recipe.value.recipeInstructions) {
    return;
  }

  if (steps) {
    const cleanedSteps = steps.map((step) => {
      return { id: uuid4(), text: step, title: "", summary: "", ingredientReferences: [] };
    });

    recipe.value.recipeInstructions.push(...cleanedSteps);
  }
  else {
    recipe.value.recipeInstructions.push({
      id: uuid4(),
      text: "",
      title: "",
      summary: "",
      ingredientReferences: [],
    });
  }
}

/** =============================================================
 * RecipeChip Clicked
 */

function chipClicked(item: RecipeTag | RecipeCategory | RecipeTool, itemType: string) {
  if (!item.id) {
    return;
  }
  router.push(`/g/${groupSlug.value}?${itemType}=${item.id}`);
}

const scale = ref(1);
</script>

<style lang="css">
/* Drag-and-drop transition classes used by recipe step sortable lists */
.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  opacity: 0.5;
}

.list-group {
  min-height: 38px;
}

.list-group-item i {
  cursor: pointer;
}
</style>
