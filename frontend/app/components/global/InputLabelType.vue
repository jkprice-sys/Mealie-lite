<template>
  <!--
    InputLabelType — single-select combobox with optional "Create" action.
    Replaces Vuetify v-autocomplete. Prop / v-model API identical to original.
  -->
  <div ref="containerRef" class="relative flex items-center gap-2">
    <!-- Prepend icon -->
    <AppIcon
      v-if="icon || $globals.icons.tags"
      :path="icon || $globals.icons.tags"
      size="sm"
      class="shrink-0 text-on-surface/40"
    />

    <!-- Input area -->
    <div class="flex-1 relative">
      <div class="flex items-center rounded-lg border border-border bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-colors">
        <input
          ref="inputRef"
          v-model="searchInput"
          type="text"
          :placeholder="$attrs.label as string || ''"
          :autofocus="autofocus"
          class="flex-1 min-w-0 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface/40"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown.escape="closeDropdown"
          @keydown.enter.prevent="handleEnterKey"
        />
        <!-- Clear button -->
        <button
          v-if="itemVal"
          type="button"
          class="ml-1 shrink-0 text-on-surface/30 hover:text-on-surface/70 transition-colors"
          @mousedown.prevent="clearItem"
        >
          <AppIcon :path="$globals.icons.close" size="sm" class="w-3.5 h-3.5" />
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
          v-if="isOpen && (filteredItems.length > 0 || (create && canCreate))"
          class="absolute left-0 z-50 mt-1 w-full max-h-52 overflow-y-auto origin-top-left
                 rounded-lg border border-border bg-surface shadow-lg py-1 focus:outline-none"
        >
          <button
            v-for="item in filteredItems"
            :key="(item as any).id ?? (item as any).name"
            type="button"
            class="flex w-full items-center px-3 py-2 text-sm text-on-surface hover:bg-primary/10 transition-colors text-left"
            @mousedown.prevent="selectItem(item)"
          >
            {{ (item as any).name }}
          </button>

          <!-- Create button when no exact match -->
          <div v-if="create && canCreate" class="px-2 py-1 border-t border-border">
            <button
              type="button"
              class="w-full text-left px-2 py-1.5 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
              @mousedown.prevent="emitCreate"
            >
              + {{ $t("general.create") }} "{{ searchInput }}"
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import type { MultiPurposeLabelSummary } from "~/lib/api/types/labels";
import type { IngredientFood, IngredientUnit } from "~/lib/api/types/recipe";
import { useSearch } from "~/composables/use-search";

type ItemType = MultiPurposeLabelSummary | IngredientFood | IngredientUnit;

const modelValue = defineModel<ItemType | null>({ default: () => null });
const itemId = defineModel<string | undefined>("item-id", { default: undefined });

const props = defineProps({
  items: {
    type: Array as () => ItemType[],
    required: true,
  },
  icon: {
    type: String,
    required: false,
    default: undefined,
  },
  create: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "create", val: string): void;
}>();

const { $globals } = useNuxtApp();
const i18n = useI18n();

// ── Internal state ──────────────────────────────────────────────
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// searchInput tracks what the user types; when an item is selected, shows its name
const searchInput = ref<string>((modelValue.value as any)?.name ?? "");

// When modelValue changes externally, sync searchInput
watch(modelValue, (val) => {
  if (!isOpen.value) {
    searchInput.value = (val as any)?.name ?? "";
  }
}, { deep: true });

// ── Filtered items ──────────────────────────────────────────────
const { search: _search, filtered: filteredItems } = useSearch(computed(() => props.items));

// Sync search input into the useSearch composable
watch(searchInput, (val) => {
  _search.value = val;
});

// ── Selected item ───────────────────────────────────────────────
const itemVal = computed(() => {
  if (!modelValue.value || Object.keys(modelValue.value).length === 0) return null;
  return modelValue.value;
});

function selectItem(item: ItemType) {
  modelValue.value = item;
  itemId.value = (item as any).id ?? "";
  searchInput.value = (item as any).name ?? "";
  isOpen.value = false;
}

function clearItem() {
  modelValue.value = null;
  itemId.value = undefined;
  searchInput.value = "";
  nextTick(() => inputRef.value?.focus());
}

// ── Create ──────────────────────────────────────────────────────
const canCreate = computed(
  () => searchInput.value.trim().length > 0
    && !props.items.some(item => (item as any).name?.toLowerCase() === searchInput.value.trim().toLowerCase()),
);

function emitCreate() {
  if (!canCreate.value) return;
  emit("create", searchInput.value.trim());
  isOpen.value = false;
}

// ── Keyboard ────────────────────────────────────────────────────
function handleEnterKey() {
  if (filteredItems.value.length === 1) {
    selectItem(filteredItems.value[0]);
  }
  else if (props.create && canCreate.value) {
    emitCreate();
  }
}

// ── Open / close ────────────────────────────────────────────────
function handleFocus() {
  // Clear display text when focused so user can type to filter
  if (itemVal.value) {
    searchInput.value = "";
    _search.value = "";
  }
  isOpen.value = true;
}

function handleBlur() {
  // Restore item name if nothing new was typed
  setTimeout(() => {
    if (!isOpen.value) return;
    if (!modelValue.value) {
      // Keep whatever the user typed (for create flow)
    }
    else {
      searchInput.value = (modelValue.value as any)?.name ?? "";
    }
  }, 150);
}

function closeDropdown() {
  isOpen.value = false;
  if (modelValue.value) searchInput.value = (modelValue.value as any)?.name ?? "";
}

onClickOutside(containerRef, () => {
  isOpen.value = false;
  if (modelValue.value) searchInput.value = (modelValue.value as any)?.name ?? "";
});
</script>
