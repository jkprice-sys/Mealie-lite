<template>
  <div>
    <!-- ── Top toolbar ─────────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-2 items-center py-2">
      <!-- Column-visibility toggle -->
      <Menu v-if="tableConfig.hideColumns" as="div" class="relative">
        <MenuButton class="bs-btn bs-btn-sm bs-btn-outline">
          <AppIcon :path="$globals.icons.cog" size="sm" />
        </MenuButton>
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems class="absolute left-0 z-20 mt-1 w-48 origin-top-left bg-surface border border-border rounded-lg shadow-lg py-2 focus:outline-none">
            <div class="px-3 space-y-1.5">
              <label
                v-for="header in localHeaders.filter(h => h.value !== 'actions')"
                :key="header.value"
                class="flex items-center gap-2 text-sm cursor-pointer text-on-surface"
              >
                <input
                  v-model="header.show"
                  type="checkbox"
                  class="w-4 h-4 rounded border-border accent-primary"
                />
                {{ header.text }}
              </label>
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      <!-- Bulk-actions dropdown -->
      <BaseOverflowButton
        v-if="bulkActions.length > 0"
        :disabled="selected.length < 1"
        mode="event"
        :items="bulkActions"
        v-on="bulkActionListener"
      />

      <!-- Injected create button and other row-level buttons -->
      <slot name="button-row" />

      <!-- Search field (right-aligned) -->
      <div class="ml-auto w-full sm:w-auto sm:min-w-[200px] sm:max-w-[400px]">
        <input
          v-model="search"
          type="text"
          :placeholder="$t('search.search')"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                 text-on-surface placeholder:text-on-surface/40
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                 transition-colors"
        />
      </div>
    </div>

    <!-- ── Table ───────────────────────────────────────────────────── -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-on-surface">
        <thead>
          <tr class="border-b border-border">
            <!-- Select-all checkbox -->
            <th v-if="bulkActions.length > 0" class="py-3 px-2 w-10">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                class="w-4 h-4 rounded border-border accent-primary"
                @change="toggleAll"
              />
            </th>
            <!-- Data column headers -->
            <th
              v-for="header in visibleDataHeaders"
              :key="header.value"
              class="py-3 px-2 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide"
              :class="header.sortable ? 'cursor-pointer select-none hover:text-on-surface' : ''"
              @click="header.sortable ? toggleSort(header.value) : undefined"
            >
              {{ header.text }}
              <span v-if="sortKey === header.value" class="ml-0.5 font-normal">
                {{ sortDir === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <!-- Actions column -->
            <th class="py-3 px-2 text-right text-xs font-semibold text-on-surface/60 uppercase tracking-wide">
              {{ $t("general.actions") }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in paginatedData"
            :key="item.id ?? item.name ?? JSON.stringify(item)"
            class="border-b border-border hover:bg-primary/5 transition-colors"
          >
            <!-- Row checkbox -->
            <td v-if="bulkActions.length > 0" class="py-2 px-2">
              <input
                type="checkbox"
                :checked="isSelected(item)"
                class="w-4 h-4 rounded border-border accent-primary"
                @change="toggleSelect(item)"
              />
            </td>
            <!-- Data cells -->
            <td v-for="header in visibleDataHeaders" :key="header.value" class="py-2 px-2">
              <slot :name="'item.' + header.value" :item="item">
                {{ item[header.value] }}
              </slot>
            </td>
            <!-- Edit / Delete action buttons -->
            <td class="py-2 px-2 text-right">
              <BaseButtonGroup
                :buttons="[
                  { icon: $globals.icons.edit,   text: $t('general.edit'),   event: 'edit' },
                  { icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete' },
                ]"
                @edit="$emit('edit-one', item)"
                @delete="$emit('delete-one', item)"
              />
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="filteredData.length === 0">
            <td
              :colspan="visibleDataHeaders.length + (bulkActions.length > 0 ? 2 : 1)"
              class="py-10 text-center text-on-surface/40 text-sm"
            >
              {{ search ? $t("search.no-results") : $t("general.nothing-here") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination ──────────────────────────────────────────────── -->
    <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-2 px-2 py-3 border-t border-border">
      <p class="text-sm text-on-surface/60">
        {{ $t("general.page-x-of-y", [page, totalPages]) || `Page ${page} of ${totalPages}` }}
      </p>
      <div class="flex gap-1">
        <button
          :disabled="page <= 1"
          class="bs-btn bs-btn-sm bs-btn-ghost disabled:opacity-40"
          @click="page--"
        >‹</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="bs-btn bs-btn-sm"
          :class="p === page ? 'bs-btn-primary' : 'bs-btn-ghost'"
          @click="page = p"
        >
          {{ p }}
        </button>
        <button
          :disabled="page >= totalPages"
          class="bs-btn bs-btn-sm bs-btn-ghost disabled:opacity-40"
          @click="page++"
        >›</button>
      </div>
    </div>

    <!-- ── Bottom row ──────────────────────────────────────────────── -->
    <div class="flex justify-end gap-2 py-2">
      <slot name="button-bottom" />
      <BaseButton @click="downloadAsJson(data, 'export.json')">
        <template #icon>{{ $globals.icons.download }}</template>
        {{ $t("general.download") }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import { downloadAsJson } from "~/composables/use-utils";

export interface TableConfig {
  hideColumns: boolean;
  canExport: boolean;
}

export interface TableHeaders {
  text: string;
  value: string;
  show: boolean;
  align?: "start" | "center" | "end";
  sortable?: boolean;
  sort?: (a: any, b: any) => number;
}

export interface BulkAction {
  icon: string;
  text: string;
  event: string;
}

const props = defineProps({
  tableConfig: {
    type: Object as () => TableConfig,
    default: () => ({ hideColumns: false, canExport: false }),
  },
  headers: {
    type: Array as () => TableHeaders[],
    required: true,
  },
  data: {
    type: Array as () => any[],
    required: true,
  },
  bulkActions: {
    type: Array as () => BulkAction[],
    default: () => [],
  },
  initialSort: {
    type: String,
    default: "id",
  },
  initialSortDesc: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "delete-one" | "edit-one", item: any): void;
  (e: "bulk-action", event: string, items: any[]): void;
}>();

const { $globals } = useNuxtApp();
const i18n = useI18n();

// ── Column headers ──────────────────────────────────────────────
const localHeaders = ref<TableHeaders[]>([...props.headers]);

watch(() => props.headers, (newHeaders) => {
  localHeaders.value = [...newHeaders];
}, { deep: true });

const visibleDataHeaders = computed(() =>
  localHeaders.value.filter(h => h.show && h.value !== "actions"),
);

// ── Search ──────────────────────────────────────────────────────
const search = ref("");

// ── Sort ────────────────────────────────────────────────────────
const sortKey = ref<string>(props.initialSort);
const sortDir = ref<"asc" | "desc">(props.initialSortDesc ? "desc" : "asc");

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  }
  else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
  page.value = 1;
}

// ── Filtered + sorted data ──────────────────────────────────────
const filteredData = computed(() => {
  const q = search.value.trim().toLowerCase();
  let rows = props.data ?? [];

  if (q) {
    rows = rows.filter(row =>
      visibleDataHeaders.value.some(h => {
        const val = row[h.value];
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }

  // Sort
  const header = localHeaders.value.find(h => h.value === sortKey.value);
  if (header) {
    const customSort = header.sort;
    rows = [...rows].sort((a, b) => {
      if (customSort) return customSort(a, b) * (sortDir.value === "asc" ? 1 : -1);
      const av = a[sortKey.value] ?? "";
      const bv = b[sortKey.value] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir.value === "asc" ? cmp : -cmp;
    });
  }

  return rows;
});

// ── Pagination ──────────────────────────────────────────────────
const PAGE_SIZE = 15;
const page = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredData.value.length / PAGE_SIZE)));
const pageNumbers = computed(() => {
  const total = totalPages.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  // Show first, last, and pages around current
  const pages = new Set<number>([1, total, page.value]);
  if (page.value > 2) pages.add(page.value - 1);
  if (page.value < total - 1) pages.add(page.value + 1);
  return [...pages].sort((a, b) => a - b);
});
const paginatedData = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredData.value.slice(start, start + PAGE_SIZE);
});

// Reset to page 1 when search changes
watch(search, () => { page.value = 1; });

// ── Row selection ───────────────────────────────────────────────
const selected = ref<any[]>([]);

function isSelected(item: any) {
  return selected.value.some(s => s === item || (item.id && s.id === item.id));
}

function toggleSelect(item: any) {
  if (isSelected(item)) {
    selected.value = selected.value.filter(s => s !== item && !(item.id && s.id === item.id));
  }
  else {
    selected.value = [...selected.value, item];
  }
}

const allSelected = computed(
  () => filteredData.value.length > 0 && filteredData.value.every(isSelected),
);
const someSelected = computed(
  () => !allSelected.value && filteredData.value.some(isSelected),
);

function toggleAll() {
  if (allSelected.value) {
    selected.value = [];
  }
  else {
    selected.value = [...filteredData.value];
  }
}

// ── Bulk actions ────────────────────────────────────────────────
const bulkActionListener = computed(() => {
  const handlers: Record<string, () => void> = {};
  props.bulkActions.forEach((action) => {
    handlers[action.event] = () => {
      emit("bulk-action", action.event, selected.value);
      selected.value = [];
    };
  });
  return handlers;
});
</script>
