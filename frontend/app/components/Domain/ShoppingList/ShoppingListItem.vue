<template>
  <!-- View mode -->
  <div v-if="!edit">
    <div class="flex items-center gap-2 flex-nowrap">
      <!-- Checkbox -->
      <div class="flex items-center flex-1 min-w-0 gap-2">
        <input
          type="checkbox"
          :checked="listItem.checked"
          class="w-5 h-5 shrink-0 rounded border-border accent-primary cursor-pointer"
          @change="toggleChecked"
        />
        <!-- Ingredient display -->
        <div
          class="text-sm text-on-surface truncate"
          :class="listItem.checked ? 'line-through text-on-surface/40' : ''"
          style="min-width: 0;"
        >
          <RecipeIngredientListItem :ingredient="listItem" />
        </div>
      </div>

      <!-- Right actions (only when unchecked) -->
      <div v-if="!listItem.checked" class="flex items-center gap-1 shrink-0">
        <!-- Recipe ref toggle -->
        <button
          v-if="recipeList && recipeList.length"
          type="button"
          class="p-1 rounded hover:bg-primary/10 text-on-surface/40 hover:text-primary transition-colors"
          :title="'Toggle Recipes'"
          @click="displayRecipeRefs = !displayRecipeRefs"
        >
          <AppIcon :path="$globals.icons.potSteam" size="sm" />
        </button>

        <!-- Edit -->
        <button
          type="button"
          class="p-1 rounded hover:bg-primary/10 text-on-surface/40 hover:text-primary transition-colors"
          @click="toggleEdit(true)"
        >
          <AppIcon :path="$globals.icons.edit" size="sm" />
        </button>

        <!-- Drag handle + context menu trigger -->
        <div ref="menuRef" class="relative">
          <button
            type="button"
            class="handle p-1 rounded hover:bg-primary/10 text-on-surface/40 hover:text-primary transition-colors cursor-grab"
            @click="contextOpen = !contextOpen"
          >
            <AppIcon :path="$globals.icons.arrowUpDown" size="sm" />
          </button>

          <!-- Context dropdown -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="contextOpen"
              class="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-lg border border-border bg-surface shadow-lg py-1 focus:outline-none"
            >
              <button
                v-for="action in contextMenu"
                :key="action.event"
                type="button"
                class="flex w-full items-center px-3 py-2 text-sm text-on-surface hover:bg-primary/10 transition-colors"
                @click="contextHandler(action.event); contextOpen = false"
              >
                {{ action.text }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Recipe refs (expanded) -->
    <div v-if="!listItem.checked && recipeList && recipeList.length && displayRecipeRefs" class="mt-2 ml-7">
      <RecipeList
        :recipes="recipeList"
        :list-item="listItem"
        :disabled="isOffline"
        size="small"
        tile
      />
    </div>

    <!-- Checked-on date -->
    <div v-if="listItem.checked" class="ml-7 text-xs text-on-surface/40 italic mb-1">
      {{ $t("shopping-list.completed-on", {
        date: listItem.updatedAt ? $d(new Date(listItem.updatedAt)) : '',
      }) }}
    </div>
  </div>

  <!-- Edit mode -->
  <div v-else class="mt-2 mb-1">
    <ShoppingListItemEditor
      v-model="localListItem"
      :labels="labels"
      :units="units"
      :foods="foods"
      @save="save"
      @cancel="toggleEdit(false)"
      @delete="$emit('delete')"
    />
  </div>
</template>

<script setup lang="ts">
import { useOnline, onClickOutside } from "@vueuse/core";
import RecipeIngredientListItem from "../Recipe/RecipeIngredientListItem.vue";
import ShoppingListItemEditor from "./ShoppingListItemEditor.vue";
import RecipeList from "~/components/Domain/Recipe/RecipeList.vue";
import type { ShoppingListItemOut } from "~/lib/api/types/household";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import type { IngredientFood, IngredientUnit, RecipeSummary } from "~/lib/api/types/recipe";

const model = defineModel<ShoppingListItemOut>({ type: Object as () => ShoppingListItemOut, required: true });

const props = defineProps({
  labels:  { type: Array as () => MultiPurposeLabelOut[], required: true },
  units:   { type: Array as () => IngredientUnit[], required: true },
  foods:   { type: Array as () => IngredientFood[], required: true },
  recipes: { type: Map as unknown as () => Map<string, RecipeSummary>, default: undefined },
});

const emit = defineEmits<{
  (e: "checked" | "save", item: ShoppingListItemOut): void;
  (e: "delete"): void;
}>();

const i18n = useI18n();
const { $globals } = useNuxtApp();
const online = useOnline();
const isOffline = computed(() => online.value === false);

const displayRecipeRefs = ref(false);

// ── Context menu ─────────────────────────────────────────────────
const contextOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
onClickOutside(menuRef, () => { contextOpen.value = false; });

type ActionItem = { text: string; event: string };
const contextMenu = ref<ActionItem[]>([
  { text: i18n.t("general.edit") as string,   event: "edit" },
  { text: i18n.t("general.delete") as string, event: "delete" },
]);

function contextHandler(event: string) {
  if (event === "edit") toggleEdit(true);
  else emit(event as any);
}

// ── Edit mode ────────────────────────────────────────────────────
const localListItem = ref(Object.assign({}, model.value));

const listItem = computed<ShoppingListItemOut>({
  get: () => model.value,
  set: (val: ShoppingListItemOut) => {
    localListItem.value = val;
    model.value = val;
  },
});

const edit = ref(false);
function toggleEdit(val = !edit.value) {
  if (edit.value === val) return;
  if (val) localListItem.value = model.value;
  edit.value = val;
}

function toggleChecked() {
  const updated = { ...model.value, checked: !model.value.checked } as ShoppingListItemOut;
  model.value = updated;
  emit("checked", updated);
}

function save() {
  emit("save", localListItem.value);
  edit.value = false;
}

// ── Recipe references ────────────────────────────────────────────
const recipeList = computed<RecipeSummary[]>(() => {
  const ret: RecipeSummary[] = [];
  if (!listItem.value.recipeReferences) return ret;
  listItem.value.recipeReferences.forEach((ref) => {
    const recipe = props.recipes?.get(ref.recipeId);
    if (recipe) ret.push(recipe);
  });
  return ret;
});
</script>

<style lang="css">
.line-through {
  text-decoration: line-through !important;
}
</style>
