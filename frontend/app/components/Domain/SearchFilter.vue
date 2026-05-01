<template>
  <div ref="containerRef" class="relative inline-block">
    <!-- Trigger button with badge -->
    <button
      type="button"
      class="relative inline-flex items-center gap-1 rounded-lg bg-surface border border-border px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-primary/5 transition-colors focus:outline-none"
      @click="isOpen = !isOpen"
    >
      <slot />
      <!-- Selection count badge -->
      <span
        v-if="selectedCount > 0"
        class="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center"
      >
        {{ selectedCount }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 top-full z-50 mt-1 w-96 rounded-lg border border-border bg-surface shadow-lg"
      >
        <div class="p-3 space-y-3">
          <!-- Search input -->
          <input
            v-model="searchInput"
            type="text"
            :placeholder="$t('search.search')"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />

          <!-- Controls row: combinator toggle + clear button -->
          <div class="flex items-center flex-wrap gap-2">
            <!-- Has-all / Has-any toggle (checkbox mode only) -->
            <div v-if="requireAll !== undefined" class="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                class="px-3 py-1 text-xs font-medium transition-colors"
                :class="combinator === 'hasAll' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-primary/5'"
                @click="combinator = 'hasAll'"
              >
                {{ $t('search.has-all') }}
              </button>
              <button
                type="button"
                class="px-3 py-1 text-xs font-medium transition-colors border-l border-border"
                :class="combinator === 'hasAny' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-primary/5'"
                @click="combinator = 'hasAny'"
              >
                {{ $t('search.has-any') }}
              </button>
            </div>

            <button
              type="button"
              class="ml-auto text-xs text-on-surface/60 hover:text-on-surface underline transition-colors"
              @click="clearSelection"
            >
              {{ $t("search.clear-selection") }}
            </button>
          </div>

          <!-- Item list -->
          <div v-if="filtered.length > 0" class="max-h-[300px] overflow-y-auto divide-y divide-border/50 rounded-lg border border-border">
            <!-- Radio list -->
            <template v-if="radio">
              <label
                v-for="item in filtered"
                :key="`radio-${item.id}`"
                class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <input
                  type="radio"
                  :value="item"
                  :checked="selectedRadio?.id === item.id"
                  class="accent-primary"
                  @change="handleRadioChange(item)"
                />
                <span class="text-sm text-on-surface">{{ item.name }}</span>
              </label>
            </template>

            <!-- Checkbox list -->
            <template v-else>
              <label
                v-for="item in filtered"
                :key="`checkbox-${item.id}`"
                class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <input
                  type="checkbox"
                  :value="item"
                  :checked="selectedIds.has(item.id)"
                  class="accent-primary"
                  @change="handleCheckboxChange(item)"
                />
                <span class="text-sm text-on-surface">{{ item.name }}</span>
              </label>
            </template>
          </div>

          <!-- No results -->
          <div
            v-else
            class="flex items-center gap-2 rounded-lg bg-info/10 border border-info/30 px-3 py-2 text-sm text-on-surface"
          >
            <AppIcon :path="$globals.icons.informationVariant" size="sm" class="text-info shrink-0" />
            {{ $t('search.no-results') }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import type { ISearchableItem } from "~/composables/use-search";
import { useSearch } from "~/composables/use-search";

const props = defineProps({
  items: {
    type: Array as () => ISearchableItem[],
    required: true,
  },
  requireAll: {
    type: Boolean,
    default: undefined,
  },
  radio: {
    type: Boolean,
    default: false,
  },
});

const modelValue = defineModel<ISearchableItem[]>();

const emit = defineEmits<{
  (e: "update:requireAll", value: boolean | undefined): void;
}>();

const { $globals } = useNuxtApp();
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
onClickOutside(containerRef, () => { isOpen.value = false; });

const { search: searchInput, filtered } = useSearch(computed(() => props.items));

const combinator = computed({
  get: () => (props.requireAll ? "hasAll" : "hasAny"),
  set: (value: string) => {
    emit("update:requireAll", value === "hasAll");
  },
});

const selected = computed<ISearchableItem[]>({
  get: () => modelValue.value ?? [],
  set: (value: ISearchableItem[]) => {
    modelValue.value = value;
  },
});

const selectedRadio = computed<null | ISearchableItem>({
  get: () => (selected.value.length > 0 ? selected.value[0] : null),
  set: (value: ISearchableItem | null) => {
    selected.value = value ? [value] : [];
  },
});

const selectedCount = computed(() => selected.value.length);
const selectedIds = computed(() => new Set(selected.value.map(item => item.id)));

function handleRadioChange(item: ISearchableItem) {
  if (selectedRadio.value?.id === item.id) {
    selectedRadio.value = null;
  }
  else {
    selectedRadio.value = item;
  }
}

function handleCheckboxChange(item: ISearchableItem) {
  if (selectedIds.value.has(item.id)) {
    selected.value = selected.value.filter(s => s.id !== item.id);
  }
  else {
    selected.value = [...selected.value, item];
  }
}

function clearSelection() {
  selected.value = [];
  selectedRadio.value = null;
  searchInput.value = "";
}
</script>
