<template>
  <section @keyup.ctrl.z="undoMerge">
    <!-- Ingredient Link Editor dialog -->
    <BaseDialog
      v-model="dialog"
      :title="$t('recipe.ingredient-linker')"
      :icon="$globals.icons.link"
      width="100%"
      max-width="600px"
      max-height="40%"
    >
      <div class="pt-4">
        <p class="text-on-surface">{{ activeText }}</p>
        <hr class="my-4 border-t border-border" />

        <!-- Unlinked ingredients -->
        <template v-if="Object.keys(groupedUnusedIngredients).length > 0">
          <h4 class="ml-1 font-medium text-on-surface">
            {{ $t("recipe.unlinked") }}
          </h4>
          <template v-for="(ingredients, title) in groupedUnusedIngredients" :key="title">
            <h4 v-if="title" class="py-3 ml-1 pl-4 font-medium text-on-surface/70">
              {{ title }}
            </h4>
            <label
              v-for="ing in ingredients"
              :key="ing.referenceId"
              class="flex items-center gap-2 ml-4 py-1 cursor-pointer"
            >
              <input
                v-model="activeRefs"
                type="checkbox"
                :value="ing.referenceId"
                class="w-4 h-4 rounded border-border accent-primary shrink-0"
              />
              <RecipeIngredientHtml :ingredient="ing" :scale="scale" />
            </label>
          </template>
        </template>

        <!-- Ingredients linked to other steps -->
        <template v-if="Object.keys(groupedUsedIngredients).length > 0">
          <h4 class="py-3 ml-1 font-medium text-on-surface">
            {{ $t("recipe.linked-to-other-step") }}
          </h4>
          <template v-for="(ingredients, title) in groupedUsedIngredients" :key="title">
            <h4 v-if="title" class="py-3 ml-1 pl-4 font-medium text-on-surface/70">
              {{ title }}
            </h4>
            <label
              v-for="ing in ingredients"
              :key="ing.referenceId"
              class="flex items-center gap-2 ml-4 py-1 cursor-pointer"
            >
              <input
                v-model="activeRefs"
                type="checkbox"
                :value="ing.referenceId"
                class="w-4 h-4 rounded border-border accent-primary shrink-0"
              />
              <RecipeIngredientHtml :ingredient="ing" :scale="scale" />
            </label>
          </template>
        </template>
      </div>

      <hr class="border-t border-border" />

      <template #card-actions>
        <BaseButton cancel @click="dialog = false" />
        <div class="flex-1" />
        <div class="flex flex-wrap justify-end">
          <BaseButton class="my-1" color="info" @click="autoSetReferences">
            <template #icon>{{ $globals.icons.robot }}</template>
            {{ $t("recipe.auto") }}
          </BaseButton>
          <BaseButton class="ml-2 my-1" save @click="setIngredientIds" />
          <BaseButton
            v-if="availableNextStep"
            class="ml-2 my-1"
            @click="saveAndOpenNextLinkIngredients"
          >
            <template #icon>{{ $globals.icons.forward }}</template>
            {{ $t("recipe.nextStep") }}
          </BaseButton>
        </div>
      </template>
    </BaseDialog>

    <!-- Section header: instructions title + cook mode button -->
    <div class="flex justify-between items-start">
      <h2
        v-if="!isCookMode"
        class="mt-1 text-xl font-medium opacity-80 text-on-surface"
      >
        {{ $t("recipe.instructions") }}
      </h2>
      <BaseButton
        v-if="!isEditForm && !isCookMode"
        minor
        cancel
        color="primary"
        @click="toggleCookMode()"
      >
        <template #icon>{{ $globals.icons.primary }}</template>
        {{ $t("recipe.cook-mode") }}
      </BaseButton>
    </div>

    <!-- Draggable instruction list -->
    <VueDraggable
      v-model="instructionList"
      :disabled="!isEditForm"
      handle=".handle"
      :delay="250"
      :delay-on-touch-only="true"
      v-bind="{
        animation: 200,
        group: 'recipe-instructions',
        ghostClass: 'ghost',
      }"
      @start="drag = true"
      @end="onDragEnd"
    >
      <TransitionGroup type="transition">
        <div
          v-for="(step, index) in instructionList"
          :key="step.id!"
          class="list-group-item"
        >
          <!-- Optional section title bar -->
          <div
            v-if="step.id && showTitleEditor[step.id]"
            class="mt-6 mb-2 flex items-center bg-primary text-white rounded-md cursor-pointer w-full"
            :class="isEditForm ? 'px-2 py-2' : 'px-3 py-3'"
            @click="toggleCollapseSection(index)"
          >
            <input
              v-if="isEditForm"
              v-model="step.title"
              :placeholder="$t('recipe.section-title')"
              class="bg-transparent text-white placeholder-white/60 text-base font-medium
                     w-full border-none outline-none focus:outline-none"
              @click.stop
            />
            <span v-else class="text-base font-medium">{{ step.title }}</span>
          </div>

          <!-- Step card -->
          <div
            class="bs-card my-3 transition-shadow duration-150 hover:shadow-md"
            :class="[
              isEditForm ? 'cursor-default' : 'cursor-pointer',
              isChecked(index) ? 'opacity-60' : '',
            ]"
            @click="toggleDisabled(index)"
          >
            <!-- Step title / summary row -->
            <div
              class="whitespace-normal leading-snug break-words pt-3 px-4"
              :class="!isChecked(index) ? 'pb-0' : 'pb-3'"
            >
              <div class="flex items-center w-full gap-2">
                <!-- Edit mode: drag handle + summary input -->
                <template v-if="isEditForm">
                  <AppIcon
                    :path="$globals.icons.arrowUpDown"
                    size="lg"
                    class="handle cursor-grab text-on-surface/40 shrink-0"
                  />
                  <input
                    v-model="step.summary"
                    :placeholder="$t('recipe.step-index', { step: index + 1 })"
                    class="flex-1 text-base bg-transparent border-none outline-none
                           focus:outline-none text-on-surface placeholder-gray-400"
                    @click.stop
                  />
                </template>

                <!-- View mode: step number or summary text -->
                <div v-else class="summary-wrapper">
                  <template v-if="step.summary">
                    <SafeMarkdown class="pr-2" :source="step.summary" />
                  </template>
                  <template v-else>
                    <span>{{ $t('recipe.step-index', { step: index + 1 }) }}</span>
                  </template>
                </div>

                <!-- Edit mode: action buttons -->
                <div v-if="isEditForm" class="ml-auto shrink-0">
                  <BaseButtonGroup
                    :large="false"
                    :buttons="[
                      { icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete' },
                      {
                        icon: $globals.icons.dotsVertical,
                        text: '',
                        event: 'open',
                        children: [
                          { text: $t('recipe.toggle-section'),  event: 'toggle-section' },
                          { text: $t('recipe.link-ingredients'), event: 'link-ingredients' },
                          { text: $t('recipe.upload-image'),    event: 'upload-image' },
                          {
                            icon: previewStates[index] ? $globals.icons.edit : $globals.icons.eye,
                            text: previewStates[index]
                              ? $t('recipe.edit-markdown')
                              : $t('markdown-editor.preview-markdown-button-label'),
                            event: 'preview-step',
                            divider: true,
                          },
                          { text: $t('recipe.merge-above'),    event: 'merge-above' },
                          { text: $t('recipe.move-to-top'),    event: 'move-to-top' },
                          { text: $t('recipe.move-to-bottom'), event: 'move-to-bottom' },
                          { text: $t('recipe.insert-above'),   event: 'insert-above' },
                          { text: $t('recipe.insert-below'),   event: 'insert-below' },
                        ],
                      },
                    ]"
                    @merge-above="mergeAbove(index - 1, index)"
                    @move-to-top="moveTo('top', index)"
                    @move-to-bottom="moveTo('bottom', index)"
                    @insert-above="insert(index)"
                    @insert-below="insert(index + 1)"
                    @toggle-section="toggleShowTitle(step.id!)"
                    @link-ingredients="openDialog(index, step.text, step.ingredientReferences)"
                    @preview-step="togglePreviewState(index)"
                    @upload-image="openImageUpload(index)"
                    @delete="instructionList.splice(index, 1)"
                  />
                </div>

                <!-- View mode: step-done checkmark -->
                <Transition
                  enter-active-class="transition-opacity duration-200"
                  enter-from-class="opacity-0"
                  leave-active-class="transition-opacity duration-150"
                  leave-to-class="opacity-0"
                >
                  <AppIcon
                    v-if="isChecked(index)"
                    :path="$globals.icons.checkboxMarkedCircle"
                    size="md"
                    class="ml-auto text-success shrink-0"
                  />
                </Transition>
              </div>
            </div>

            <!-- Upload progress bar -->
            <div
              v-if="isEditForm && loadingStates[index]"
              class="h-0.5 w-full overflow-hidden bg-primary/20"
            >
              <div class="h-full w-1/3 bg-primary animate-pulse" />
            </div>

            <!-- Edit mode: markdown editor -->
            <DropZone @drop="(f) => handleImageDrop(index, f)">
              <div
                v-if="isEditForm"
                class="px-4 py-3"
                @click="$emit('click-instruction-field', `${index}.text`)"
              >
                <MarkdownEditor
                  v-model="instructionList[index]['text']"
                  v-model:preview="previewStates[index]"
                  class="mb-2"
                  :display-preview="false"
                  :textarea="{
                    hint: $t('recipe.attach-images-hint'),
                    persistentHint: true,
                  }"
                />
                <div
                  v-if="step.ingredientReferences && step.ingredientReferences.length"
                  class="linked-ingredients-editor"
                >
                  <div
                    v-for="(linkRef, i) in step.ingredientReferences"
                    :key="linkRef.referenceId ?? i"
                    class="mb-1"
                  >
                    <RecipeIngredientHtml
                      v-if="linkRef.referenceId && ingredientLookup[linkRef.referenceId]"
                      :ingredient="ingredientLookup[linkRef.referenceId]"
                      :scale="scale"
                    />
                  </div>
                </div>
              </div>
            </DropZone>

            <!-- View mode: step text + optional side-by-side ingredients (cook mode) -->
            <Transition
              enter-active-class="transition-opacity duration-200"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-150"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="!isChecked(index) && !isEditForm"
                class="m-0 p-0"
              >
                <div class="px-4 py-3 markdown">
                  <div class="flex flex-wrap gap-0">
                    <!-- Cook mode: linked ingredients column -->
                    <div
                      v-if="isCookMode && step.ingredientReferences && step.ingredientReferences.length > 0"
                      class="w-full sm:w-5/12"
                    >
                      <div class="-ml-4">
                        <RecipeIngredients
                          :value="recipe.recipeIngredient.filter((ing) => {
                            if (!step.ingredientReferences) return false;
                            return step.ingredientReferences.map((ref) => ref.referenceId).includes(ing.referenceId || '');
                          })"
                          :scale="scale"
                          :is-cook-mode="isCookMode"
                        />
                      </div>
                    </div>

                    <!-- Vertical divider between ingredients and instructions in cook mode -->
                    <div
                      v-if="isCookMode && step.ingredientReferences && step.ingredientReferences.length > 0 && smAndUp"
                      class="hidden sm:block self-stretch border-l border-border mx-2"
                    />

                    <!-- Instructions text column -->
                    <div class="flex-1 min-w-0">
                      <SafeMarkdown class="markdown" :source="step.text" />
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </TransitionGroup>
    </VueDraggable>

    <!-- Mobile-only bottom divider (hidden on md+) -->
    <hr v-if="!isCookMode" class="mt-10 md:hidden border-t border-border" />
  </section>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { RecipeStep, IngredientReferences, RecipeIngredient, RecipeAsset, Recipe } from "~/lib/api/types/recipe";
import { uuid4 } from "~/composables/use-utils";
import { useUserApi, useStaticRoutes } from "~/composables/api";
import { usePageState } from "~/composables/recipe-page/shared-state";
import { useExtractIngredientReferences } from "~/composables/recipe-page/use-extract-ingredient-references";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import DropZone from "~/components/global/DropZone.vue";
import RecipeIngredients from "~/components/Domain/Recipe/RecipeIngredients.vue";
import RecipeIngredientHtml from "~/components/Domain/Recipe/RecipeIngredientHtml.vue";

interface MergerHistory {
  target: number;
  source: number;
  targetText: string;
  sourceText: string;
}

const instructionList = defineModel<RecipeStep[]>("modelValue", { required: true, default: () => [] });
const assets = defineModel<RecipeAsset[]>("assets", { required: true, default: () => [] });

const props = defineProps({
  recipe: {
    type: Object as () => NoUndefinedField<Recipe>,
    required: true,
  },
  scale: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["click-instruction-field", "update:assets"]);

const { smAndUp } = useDisplay();
const { isCookMode, toggleCookMode, isEditForm } = usePageState(props.recipe.slug);
const { extractIngredientReferences } = useExtractIngredientReferences();

const dialog = ref(false);
const disabledSteps = ref<number[]>([]);
const unusedIngredients = ref<RecipeIngredient[]>([]);
const usedIngredients = ref<RecipeIngredient[]>([]);

const showTitleEditor = ref<{ [key: string]: boolean }>({});

// ===============================================================
// UI State Helpers

function hasSectionTitle(title: string | undefined) {
  return !(title === null || title === "" || title === undefined);
}

watch(instructionList, (v) => {
  disabledSteps.value = [];

  v.forEach((element: RecipeStep) => {
    if (element.id !== undefined) {
      showTitleEditor.value[element.id!] = hasSectionTitle(element.title!);
    }
  });
}, { deep: true });

const showCookMode = ref(false);

onMounted(() => {
  instructionList.value.forEach((element: RecipeStep) => {
    if (element.id !== undefined) {
      showTitleEditor.value[element.id!] = hasSectionTitle(element.title!);
    }

    if (showCookMode.value === false && element.ingredientReferences && element.ingredientReferences.length > 0) {
      showCookMode.value = true;
    }

    showTitleEditor.value = { ...showTitleEditor.value };
  });

  if (assets.value === undefined) {
    emit("update:assets", []);
  }
});

function toggleDisabled(stepIndex: number) {
  if (isEditForm.value) {
    return;
  }
  if (disabledSteps.value.includes(stepIndex)) {
    const index = disabledSteps.value.indexOf(stepIndex);
    if (index !== -1) {
      disabledSteps.value.splice(index, 1);
    }
  }
  else {
    disabledSteps.value.push(stepIndex);
  }
}

function isChecked(stepIndex: number) {
  if (disabledSteps.value.includes(stepIndex) && !isEditForm.value) {
    return "disabled-card";
  }
}

function toggleShowTitle(id?: string) {
  if (!id) {
    return;
  }

  showTitleEditor.value[id] = !showTitleEditor.value[id];

  const temp = { ...showTitleEditor.value };
  showTitleEditor.value = temp;
}

function onDragEnd() {
  drag.value = false;
}

// ===============================================================
// Ingredient Linker
const activeRefs = ref<string[]>([]);
const activeIndex = ref(0);
const activeText = ref("");

function openDialog(idx: number, text: string, refs?: IngredientReferences[]) {
  if (!refs) {
    instructionList.value[idx].ingredientReferences = [];
    refs = instructionList.value[idx].ingredientReferences as IngredientReferences[];
  }
  activeIndex.value = idx;
  activeText.value = text;
  setUsedIngredients();
  dialog.value = true;
  activeRefs.value = refs.map(ref => ref.referenceId ?? "");
}

const availableNextStep = computed(() => activeIndex.value < instructionList.value.length - 1);

function setIngredientIds() {
  const instruction = instructionList.value[activeIndex.value];
  instruction.ingredientReferences = activeRefs.value.map((ref) => {
    return {
      referenceId: ref,
    };
  });

  // Update the visibility of the cook mode button
  showCookMode.value = false;
  instructionList.value.forEach((element) => {
    if (showCookMode.value === false && element.ingredientReferences && element.ingredientReferences.length > 0) {
      showCookMode.value = true;
    }
  });
  dialog.value = false;
}

function saveAndOpenNextLinkIngredients() {
  const currentStepIndex = activeIndex.value;

  if (!availableNextStep.value) {
    return;
  }

  setIngredientIds();
  const nextStep = instructionList.value[currentStepIndex + 1];
  nextTick(() => openDialog(currentStepIndex + 1, nextStep.text, nextStep.ingredientReferences));
}

function setUsedIngredients() {
  const usedRefs: { [key: string]: boolean } = {};

  instructionList.value.forEach((element, idx) => {
    if (idx === activeIndex.value) return;
    element.ingredientReferences?.forEach((ref) => {
      if (ref.referenceId) usedRefs[ref.referenceId] = true;
    });
  });

  usedIngredients.value = props.recipe.recipeIngredient.filter(ing => !!ing.referenceId && ing.referenceId in usedRefs);
  unusedIngredients.value = props.recipe.recipeIngredient.filter(ing => !!ing.referenceId && !(ing.referenceId in usedRefs));
}

watch(activeRefs, () => setUsedIngredients());

function autoSetReferences() {
  extractIngredientReferences(
    props.recipe.recipeIngredient,
    activeRefs.value,
    activeText.value,
  ).forEach(ingredient => activeRefs.value.push(ingredient));
}

const ingredientLookup = computed(() => {
  const results: { [key: string]: RecipeIngredient } = {};
  return props.recipe.recipeIngredient.reduce((prev, ing) => {
    if (ing.referenceId === undefined) {
      return prev;
    }
    prev[ing.referenceId] = ing;
    return prev;
  }, results);
});

// Map each ingredient's referenceId to its section title
const ingredientSectionTitles = computed(() => {
  const titleMap: { [key: string]: string } = {};
  let currentTitle = "";

  props.recipe.recipeIngredient.forEach((ingredient) => {
    if (ingredient.referenceId === undefined) {
      return;
    }

    if (ingredient.title) {
      currentTitle = ingredient.title;
    }

    titleMap[ingredient.referenceId] = currentTitle;
  });

  return titleMap;
});

const groupedUnusedIngredients = computed((): Record<string, RecipeIngredient[]> => {
  const groups: Record<string, RecipeIngredient[]> = {};

  unusedIngredients.value.forEach((ingredient) => {
    if (ingredient.referenceId === undefined) {
      return;
    }

    const title = ingredientSectionTitles.value[ingredient.referenceId] || ingredient.title || "";
    (groups[title] ||= []).push(ingredient);
  });

  return groups;
});

const groupedUsedIngredients = computed((): Record<string, RecipeIngredient[]> => {
  const groups: Record<string, RecipeIngredient[]> = {};
  usedIngredients.value.forEach((ingredient) => {
    if (ingredient.referenceId === undefined) {
      return;
    }

    const title = ingredientSectionTitles.value[ingredient.referenceId] || ingredient.title || "";
    (groups[title] ||= []).push(ingredient);
  });

  return groups;
});

// ===============================================================
// Instruction Merger
const mergeHistory = ref<MergerHistory[]>([]);

function mergeAbove(target: number, source: number) {
  if (target < 0) {
    return;
  }

  mergeHistory.value.push({
    target,
    source,
    targetText: instructionList.value[target].text,
    sourceText: instructionList.value[source].text,
  });

  instructionList.value[target].text += " " + instructionList.value[source].text;
  instructionList.value.splice(source, 1);
}

function undoMerge(event: KeyboardEvent) {
  if (event.ctrlKey && event.code === "KeyZ") {
    if (!(mergeHistory.value?.length > 0)) {
      return;
    }

    const lastMerge = mergeHistory.value.pop();
    if (!lastMerge) {
      return;
    }

    instructionList.value[lastMerge.target].text = lastMerge.targetText;
    instructionList.value.splice(lastMerge.source, 0, {
      id: uuid4(),
      title: "",
      text: lastMerge.sourceText,
      ingredientReferences: [],
    });
  }
}

function moveTo(dest: string, source: number) {
  if (dest === "top") {
    instructionList.value.unshift(instructionList.value.splice(source, 1)[0]);
  }
  else {
    instructionList.value.push(instructionList.value.splice(source, 1)[0]);
  }
}

function insert(dest: number) {
  instructionList.value.splice(dest, 0, { id: uuid4(), text: "", title: "", ingredientReferences: [] });
}

const previewStates = ref<boolean[]>([]);

function togglePreviewState(index: number) {
  const temp = [...previewStates.value];
  temp[index] = !temp[index];
  previewStates.value = temp;
}

function toggleCollapseSection(index: number) {
  const sectionSteps: number[] = [];

  for (let i = index; i < instructionList.value.length; i++) {
    if (!(i === index) && hasSectionTitle(instructionList.value[i].title!)) {
      break;
    }
    else {
      sectionSteps.push(i);
    }
  }

  const allCollapsed = sectionSteps.every(idx => disabledSteps.value.includes(idx));

  if (allCollapsed) {
    disabledSteps.value = disabledSteps.value.filter(idx => !sectionSteps.includes(idx));
  }
  else {
    disabledSteps.value = [...disabledSteps.value, ...sectionSteps];
  }
}

const drag = ref(false);

// ===============================================================
// Image Uploader
const api = useUserApi();
const { recipeAssetPath } = useStaticRoutes();

const loadingStates = ref<{ [key: number]: boolean }>({});

async function handleImageDrop(index: number, files: File[]) {
  if (!files) {
    return;
  }

  const file = files[0];
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  loadingStates.value[index] = true;

  const { data } = await api.recipes.createAsset(props.recipe.slug, {
    name: file.name,
    icon: "mdi-file-image",
    file,
    extension: file.name.split(".").pop() || "",
  });

  loadingStates.value[index] = false;

  if (!data) {
    return;
  }

  emit("update:assets", [...assets.value, data]);
  const assetUrl = recipeAssetPath(props.recipe.id, data.fileName as string);
  const text = `<img src="${assetUrl}" height="100%" width="100%"/>`;
  instructionList.value[index].text += text;
}

function openImageUpload(index: number) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    if (input.files) {
      await handleImageDrop(index, Array.from(input.files));
      input.remove();
    }
  };
  input.click();
}
</script>

<style lang="css" scoped>
/** Select all li under .markdown class */
.markdown :deep(ul > li) {
  display: list-item;
  list-style-type: disc !important;
}

.markdown :deep(ol > li) {
  display: list-item;
}

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

.blur {
  filter: blur(2px);
}

.upload-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.summary-wrapper {
  flex: 1 1 auto;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}
</style>
