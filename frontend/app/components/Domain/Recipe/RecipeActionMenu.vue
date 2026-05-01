<template>
  <div class="sticky top-[4.5em] z-[2] flex justify-end items-center gap-1 py-1 px-2 pointer-events-none">
    <!-- Delete confirmation dialog -->
    <BaseDialog
      v-model="deleteDialog"
      :title="$t('recipe.delete-recipe')"
      color="error"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="emitDelete()"
    >
      <p class="text-sm text-on-surface">{{ $t("recipe.delete-confirmation") }}</p>
    </BaseDialog>

    <!-- View mode: favorite / timeline / edit / context menu -->
    <div v-if="!open" class="flex items-center gap-1 pointer-events-auto">
      <RecipeFavoriteBadge
        v-if="loggedIn"
        color="primary"
        button-style
        :recipe-id="recipe.id!"
        :slug="recipe.slug!"
        show-always
      />
      <RecipeTimelineBadge
        v-if="loggedIn && !liteMode"
        color="primary"
        button-style
        :slug="recipe.slug"
        :recipe-name="recipe.name!"
      />
      <button
        v-if="loggedIn && canEdit"
        type="button"
        :title="$t('general.edit')"
        class="bs-btn bs-btn-md bs-btn-primary rounded-full w-9 h-9 p-0 flex items-center justify-center"
        @click="$emit('edit', true)"
      >
        <AppIcon :path="$globals.icons.edit" size="md" />
      </button>
      <RecipeContextMenu
        show-print
        :menu-top="false"
        :name="recipe.name!"
        :slug="recipe.slug!"
        :menu-icon="$globals.icons.dotsVertical"
        fab
        color="primary"
        :card-menu="false"
        :recipe="recipe"
        :recipe-id="recipe.id!"
        :recipe-scale="recipeScale"
        :use-items="{
          edit: false,
          download: loggedIn,
          duplicate: loggedIn,
          mealplanner: loggedIn,
          shoppingList: loggedIn,
          print: true,
          printPreferences: true,
          share: loggedIn,
          recipeActions: true,
          delete: loggedIn,
        }"
        @print="$emit('print')"
      />
    </div>

    <!-- Edit mode: delete / json / close / save -->
    <div v-if="open" class="flex items-center gap-1 pointer-events-auto">
      <button
        v-for="(btn, index) in editorButtons"
        :key="index"
        type="button"
        :title="btn.text"
        class="bs-btn bs-btn-sm"
        :class="btnClass(btn.color)"
        @click="emitHandler(btn.event)"
      >
        <AppIcon :path="btn.icon" size="sm" />
        <span class="hidden sm:inline">{{ btn.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu.vue";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge.vue";
import RecipeTimelineBadge from "./RecipeTimelineBadge.vue";
import type { Recipe } from "~/lib/api/types/recipe";
import { useLiteMode } from "~/composables/use-lite-mode";

const SAVE_EVENT   = "save";
const DELETE_EVENT = "delete";
const CLOSE_EVENT  = "close";
const JSON_EVENT   = "json";

interface Props {
  recipe: Recipe;
  slug: string;
  recipeScale?: number;
  open: boolean;
  name: string;
  loggedIn?: boolean;
  recipeId: string;
  canEdit?: boolean;
}
withDefaults(defineProps<Props>(), {
  recipeScale: 1,
  loggedIn:    false,
  canEdit:     false,
});

const emit = defineEmits(["print", "input", "save", "delete", "close", "json", "edit"]);

const deleteDialog = ref(false);
const i18n         = useI18n();
const { $globals } = useNuxtApp();
const liteMode     = useLiteMode();

const editorButtons = computed(() => [
  {
    text:  i18n.t("general.delete"),
    icon:  $globals.icons.delete,
    event: DELETE_EVENT,
    color: "error",
  },
  ...(!liteMode ? [{
    text:  i18n.t("general.json"),
    icon:  $globals.icons.codeBraces,
    event: JSON_EVENT,
    color: "accent",
  }] : []),
  {
    text:  i18n.t("general.close"),
    icon:  $globals.icons.close,
    event: CLOSE_EVENT,
    color: "",
  },
  {
    text:  i18n.t("general.save"),
    icon:  $globals.icons.save,
    event: SAVE_EVENT,
    color: "success",
  },
]);

function btnClass(color: string) {
  switch (color) {
    case "error":   return "bs-btn-error";
    case "success": return "bs-btn-primary";
    case "accent":  return "bs-btn-outline";
    default:        return "bs-btn-ghost";
  }
}

function emitHandler(event: string) {
  switch (event) {
    case CLOSE_EVENT:
      emit("close");
      emit("input", false);
      break;
    case DELETE_EVENT:
      deleteDialog.value = true;
      break;
    default:
      emit(event as any);
      break;
  }
}

function emitDelete() {
  emit("delete");
  emit("input", false);
}
</script>
