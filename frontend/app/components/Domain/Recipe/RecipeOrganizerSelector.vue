<template>
  <!--
    RecipeOrganizerSelector — multi-select tag input with search.
    Replaces the Vuetify v-autocomplete chips pattern.
    Prop / v-model API is identical to the original.
  -->
  <div ref="containerRef" class="relative">
    <!-- Label -->
    <p v-if="showLabel && label" class="text-xs text-on-surface/60 mb-1">{{ label }}</p>

    <!-- Input box: selected chips + search input -->
    <div
      class="flex flex-wrap gap-1.5 items-center min-h-[42px] w-full rounded-lg border border-border
             bg-surface px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-primary
             focus-within:border-primary transition-colors"
      @click="openDropdown"
    >
      <!-- Leading icon -->
      <AppIcon v-if="showIcon && icon" :path="icon" size="sm" class="text-on-surface/40 shrink-0" />

      <!-- Selected chips -->
      <span
        v-for="(item, idx) in selected ?? []"
        :key="getItemKey(item)"
        class="inline-flex items-center gap-1 rounded-md bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium"
      >
        {{ getItemName(item) }}
        <button
          type="button"
          class="ml-0.5 hover:text-error focus:outline-none"
          @click.stop="removeByIndex(idx)"
        >
          <AppIcon :path="$globals.icons.close" size="sm" class="w-3 h-3" />
        </button>
      </span>

      <!-- Search input -->
      <input
        ref="inputRef"
        v-model="searchInput"
        type="text"
        class="flex-1 min-w-[80px] bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface/40"
        :placeholder="(selected?.length ?? 0) === 0 ? label : ''"
        @focus="isOpen = true"
        @keydown.escape="isOpen = false"
        @keydown.backspace="handleBackspace"
      />

      <!-- Add button -->
      <button
        v-if="showAdd"
        type="button"
        class="ml-auto shrink-0 p-0.5 rounded hover:bg-primary/10 text-on-surface/40 hover:text-primary transition-colors"
        @click.stop="dialog = true"
      >
        <AppIcon :path="$globals.icons.create" size="sm" />
      </button>
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen && filteredItems.length > 0"
        class="absolute left-0 z-50 mt-1 w-full max-h-60 overflow-y-auto origin-top-left
               rounded-lg border border-border bg-surface shadow-lg py-1 focus:outline-none"
      >
        <button
          v-for="item in filteredItems"
          :key="getItemKey(item)"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-primary/10 transition-colors"
          :class="isItemSelected(item) ? 'opacity-40' : ''"
          @mousedown.prevent="toggleItem(item)"
        >
          <AppIcon
            v-if="isItemSelected(item)"
            :path="$globals.icons.check"
            size="sm"
            class="text-primary shrink-0"
          />
          <span v-else class="w-4 shrink-0" />
          {{ getItemName(item) }}
        </button>
      </div>
    </Transition>

    <!-- RecipeOrganizerDialog (create new item) -->
    <RecipeOrganizerDialog
      v-if="showAdd"
      v-model="dialog"
      :item-type="selectorType"
      @created-item="appendCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import type { IngredientFood, RecipeCategory, RecipeTag, RecipeTool } from "~/lib/api/types/recipe";
import { Organizer, type RecipeOrganizer } from "~/lib/api/types/non-generated";
import type { HouseholdSummary } from "~/lib/api/types/household";
import { useCategoryStore, useFoodStore, useHouseholdStore, useTagStore, useToolStore } from "~/composables/store";
import { useUserStore } from "~/composables/store/use-user-store";
import type { UserSummary } from "~/lib/api/types/user";

type OrganizerItem =
  | HouseholdSummary
  | RecipeTag
  | RecipeCategory
  | RecipeTool
  | IngredientFood
  | UserSummary;

interface Props {
  selectorType: RecipeOrganizer;
  inputAttrs?: Record<string, any>;
  showAdd?: boolean;
  showLabel?: boolean;
  showIcon?: boolean;
  variant?: string;
}

const props = withDefaults(defineProps<Props>(), {
  inputAttrs: () => ({}),
  showAdd: true,
  showLabel: true,
  showIcon: true,
  variant: "outlined",
});

const selected = defineModel<OrganizerItem[] | undefined>({ required: true });

onMounted(() => {
  if (selected.value === undefined) selected.value = [];
});

const i18n = useI18n();
const { $globals } = useNuxtApp();

// ── Label and icon ──────────────────────────────────────────────
const label = computed(() => {
  if (!props.showLabel) return "";
  switch (props.selectorType) {
    case Organizer.Tag:       return i18n.t("tag.tags");
    case Organizer.Category:  return i18n.t("category.categories");
    case Organizer.Tool:      return i18n.t("tool.tools");
    case Organizer.Food:      return i18n.t("general.foods");
    case Organizer.Household: return i18n.t("household.households");
    case Organizer.User:      return i18n.t("user.users");
    default:                  return i18n.t("general.organizer");
  }
});

const icon = computed(() => {
  if (!props.showIcon) return "";
  switch (props.selectorType) {
    case Organizer.Tag:       return $globals.icons.tags;
    case Organizer.Category:  return $globals.icons.categories;
    case Organizer.Tool:      return $globals.icons.tools;
    case Organizer.Food:      return $globals.icons.foods;
    case Organizer.Household: return $globals.icons.household;
    case Organizer.User:      return $globals.icons.user;
    default:                  return $globals.icons.tags;
  }
});

// ── Store ───────────────────────────────────────────────────────
const storeMap = {
  [Organizer.Category]: useCategoryStore(),
  [Organizer.Tag]:      useTagStore(),
  [Organizer.Tool]:     useToolStore(),
  [Organizer.Food]:     useFoodStore(),
  [Organizer.Household]: useHouseholdStore(),
  [Organizer.User]:     useUserStore(),
};

const activeStore = computed(() => storeMap[props.selectorType].store.value as OrganizerItem[]);

// ── Item helpers ────────────────────────────────────────────────
function getItemName(item: OrganizerItem): string {
  if (props.selectorType === Organizer.User) {
    return (item as UserSummary).fullName ?? (item as any).name ?? "";
  }
  return (item as any).name ?? "";
}

function getItemKey(item: OrganizerItem): string {
  return (item as any).id ?? (item as any).name ?? "";
}

function isItemSelected(item: OrganizerItem): boolean {
  return (selected.value ?? []).some(s => getItemKey(s) === getItemKey(item));
}

// ── Search + filtering ──────────────────────────────────────────
const searchInput = ref("");

const filteredItems = computed(() => {
  const q = searchInput.value.trim().toLowerCase();
  return (activeStore.value ?? []).filter(item => {
    if (!q) return true;
    return getItemName(item).toLowerCase().includes(q);
  });
});

// ── Dropdown open/close ─────────────────────────────────────────
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

function openDropdown() {
  isOpen.value = true;
  nextTick(() => inputRef.value?.focus());
}

onClickOutside(containerRef, () => { isOpen.value = false; });

// ── Selection ───────────────────────────────────────────────────
function toggleItem(item: OrganizerItem) {
  if (selected.value === undefined) selected.value = [];
  if (isItemSelected(item)) {
    selected.value = selected.value.filter(s => getItemKey(s) !== getItemKey(item));
  }
  else {
    selected.value = [...selected.value, item];
    searchInput.value = "";
  }
}

function removeByIndex(index: number) {
  if (selected.value === undefined) return;
  selected.value = selected.value.filter((_, i) => i !== index);
}

function appendCreated(item: OrganizerItem) {
  if (selected.value === undefined) selected.value = [];
  selected.value = [...selected.value, item];
}

function handleBackspace() {
  if (searchInput.value === "" && (selected.value?.length ?? 0) > 0) {
    selected.value = selected.value!.slice(0, -1);
  }
}

// ── Create dialog ───────────────────────────────────────────────
const dialog = ref(false);
</script>
