<template>
  <div class="overflow-x-auto">
    <!-- Loading skeleton -->
    <div v-if="loading" class="py-10 text-center text-on-surface/40 text-sm">
      {{ $t("general.loading") || "Loading…" }}
    </div>

    <table v-else class="w-full text-sm text-on-surface">
      <thead>
        <tr class="border-b border-border">
          <!-- Select-all checkbox -->
          <th class="py-3 px-2 w-10">
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate="someSelected"
              class="w-4 h-4 rounded border-border accent-primary"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="h in activeHeaders"
            :key="h.value"
            class="py-3 px-3 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide"
            :class="h.sortable ? 'cursor-pointer select-none hover:text-on-surface' : ''"
            @click="h.sortable ? toggleSort(h.value) : undefined"
          >
            {{ h.title }}
            <span v-if="sortKey === h.value" class="ml-0.5 font-normal">
              {{ sortDir === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in paginatedRecipes"
          :key="item.id"
          class="border-b border-border hover:bg-primary/5 transition-colors"
        >
          <!-- Row checkbox -->
          <td class="py-2 px-2">
            <input
              type="checkbox"
              :checked="isSelected(item)"
              class="w-4 h-4 rounded border-border accent-primary"
              @change="toggleSelect(item)"
            />
          </td>

          <!-- id -->
          <td v-if="showHeaders.id" class="py-2 px-3 font-mono text-xs text-on-surface/60">
            {{ item.id }}
          </td>

          <!-- owner -->
          <td v-if="showHeaders.owner" class="py-2 px-3">
            <div class="flex items-center gap-2">
              <UserAvatar :user-id="item.userId!" :tooltip="false" size="32" />
              <span>{{ getMember(item.userId!) }}</span>
            </div>
          </td>

          <!-- name (always visible) -->
          <td class="py-2 px-3">
            <a
              :href="`/g/${groupSlug}/r/${item.slug}`"
              class="hover:underline text-on-surface"
            >{{ item.name }}</a>
          </td>

          <!-- categories -->
          <td v-if="showHeaders.categories" class="py-2 px-3">
            <RecipeChip small :items="item.recipeCategory!" @item-selected="filterItems" />
          </td>

          <!-- tags -->
          <td v-if="showHeaders.tags" class="py-2 px-3">
            <RecipeChip small :items="item.tags!" :is-category="false" url-prefix="tags" @item-selected="filterItems" />
          </td>

          <!-- tools -->
          <td v-if="showHeaders.tools" class="py-2 px-3">
            <RecipeChip small :items="item.tools" url-prefix="tools" @item-selected="filterItems" />
          </td>

          <!-- recipeServings -->
          <td v-if="showHeaders.recipeServings" class="py-2 px-3">{{ item.recipeServings }}</td>

          <!-- recipeYieldQuantity -->
          <td v-if="showHeaders.recipeYieldQuantity" class="py-2 px-3">{{ item.recipeYieldQuantity }}</td>

          <!-- recipeYield -->
          <td v-if="showHeaders.recipeYield" class="py-2 px-3">{{ item.recipeYield }}</td>

          <!-- dateAdded -->
          <td v-if="showHeaders.dateAdded" class="py-2 px-3">
            {{ item.dateAdded ? $d(new Date(item.dateAdded)) : '' }}
          </td>
        </tr>

        <tr v-if="filteredRecipes.length === 0">
          <td :colspan="activeHeaders.length + 1" class="py-10 text-center text-on-surface/40">
            {{ $t("general.nothing-here") }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-2 px-2 py-3 border-t border-border">
      <p class="text-sm text-on-surface/60">
        {{ $t("general.page-x-of-y", [page, totalPages]) || `Page ${page} of ${totalPages}` }}
      </p>
      <div class="flex gap-1">
        <button :disabled="page <= 1" class="bs-btn bs-btn-sm bs-btn-ghost disabled:opacity-40" @click="page--">‹</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="bs-btn bs-btn-sm"
          :class="p === page ? 'bs-btn-primary' : 'bs-btn-ghost'"
          @click="page = p"
        >{{ p }}</button>
        <button :disabled="page >= totalPages" class="bs-btn bs-btn-sm bs-btn-ghost disabled:opacity-40" @click="page++">›</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from "../User/UserAvatar.vue";
import RecipeChip from "./RecipeChips.vue";
import type { Recipe, RecipeCategory, RecipeTool } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";
import type { UserSummary } from "~/lib/api/types/user";
import type { RecipeTag } from "~/lib/api/types/household";

interface ShowHeaders {
  id: boolean;
  owner: boolean;
  tags: boolean;
  categories: boolean;
  tools: boolean;
  recipeServings: boolean;
  recipeYieldQuantity: boolean;
  recipeYield: boolean;
  dateAdded: boolean;
}

interface Props {
  loading?: boolean;
  recipes?: Recipe[];
  showHeaders?: ShowHeaders;
  search?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  recipes: () => [],
  showHeaders: () => ({
    id: true,
    owner: false,
    tags: true,
    categories: true,
    tools: true,
    recipeServings: true,
    recipeYieldQuantity: true,
    recipeYield: true,
    dateAdded: true,
  }),
});

defineEmits<{ click: [] }>();

const selected = defineModel<Recipe[]>({ default: () => [] });

const i18n = useI18n();
const auth = useMealieAuth();
const groupSlug = auth.user.value?.groupSlug;
const router = useRouter();

// ── Dynamic column headers ──────────────────────────────────────
const activeHeaders = computed(() => {
  const hdrs: Array<{ title: string; value: string; sortable?: boolean }> = [];
  const sh = props.showHeaders;
  if (sh.id)                  hdrs.push({ title: i18n.t("general.id"),          value: "id" });
  if (sh.owner)               hdrs.push({ title: i18n.t("general.owner"),       value: "userId",             sortable: true });
  hdrs.push(                               { title: i18n.t("general.name"),        value: "name",               sortable: true });
  if (sh.categories)          hdrs.push({ title: i18n.t("recipe.categories"),   value: "recipeCategory",     sortable: false });
  if (sh.tags)                hdrs.push({ title: i18n.t("tag.tags"),            value: "tags",               sortable: false });
  if (sh.tools)               hdrs.push({ title: i18n.t("tool.tools"),          value: "tools",              sortable: false });
  if (sh.recipeServings)      hdrs.push({ title: i18n.t("recipe.servings"),     value: "recipeServings",     sortable: true });
  if (sh.recipeYieldQuantity) hdrs.push({ title: i18n.t("recipe.yield"),        value: "recipeYieldQuantity", sortable: true });
  if (sh.recipeYield)         hdrs.push({ title: i18n.t("recipe.yield-text"),   value: "recipeYield",        sortable: true });
  if (sh.dateAdded)           hdrs.push({ title: i18n.t("general.date-added"),  value: "dateAdded",          sortable: true });
  return hdrs;
});

// ── Sort ────────────────────────────────────────────────────────
const sortKey = ref("dateAdded");
const sortDir = ref<"asc" | "desc">("desc");

function toggleSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  else { sortKey.value = key; sortDir.value = "asc"; }
  page.value = 1;
}

// ── Filtered + sorted data ──────────────────────────────────────
const filteredRecipes = computed(() => {
  const q = (props.search ?? "").trim().toLowerCase();
  let rows = props.recipes ?? [];
  if (q) rows = rows.filter(r => r.name?.toLowerCase().includes(q));
  const key = sortKey.value as keyof Recipe;
  return [...rows].sort((a, b) => {
    const av = String(a[key] ?? "");
    const bv = String(b[key] ?? "");
    const cmp = av.localeCompare(bv);
    return sortDir.value === "asc" ? cmp : -cmp;
  });
});

// ── Pagination ──────────────────────────────────────────────────
const PAGE_SIZE = 15;
const page = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecipes.value.length / PAGE_SIZE)));
const pageNumbers = computed(() => {
  const t = totalPages.value;
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
  const pages = new Set([1, t, page.value]);
  if (page.value > 2) pages.add(page.value - 1);
  if (page.value < t - 1) pages.add(page.value + 1);
  return [...pages].sort((a, b) => a - b);
});
const paginatedRecipes = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredRecipes.value.slice(start, start + PAGE_SIZE);
});

watch(() => props.search, () => { page.value = 1; });

// ── Row selection ───────────────────────────────────────────────
function isSelected(item: Recipe) {
  return selected.value.some(s => s.id === item.id);
}
function toggleSelect(item: Recipe) {
  if (isSelected(item)) selected.value = selected.value.filter(s => s.id !== item.id);
  else selected.value = [...selected.value, item];
}
const allSelected = computed(
  () => filteredRecipes.value.length > 0 && filteredRecipes.value.every(isSelected),
);
const someSelected = computed(
  () => !allSelected.value && filteredRecipes.value.some(isSelected),
);
function toggleAll() {
  if (allSelected.value) selected.value = [];
  else selected.value = [...filteredRecipes.value];
}

// ── Group members ───────────────────────────────────────────────
const api = useUserApi();
const members = ref<UserSummary[]>([]);

async function refreshMembers() {
  const { data } = await api.groups.fetchMembers();
  if (data) members.value = data.items;
}

function getMember(id: string) {
  return members.value.find(m => m.id === id)?.fullName ?? i18n.t("general.none");
}

function filterItems(item: RecipeTag | RecipeCategory | RecipeTool, itemType: string) {
  if (!groupSlug || !item.id) return;
  router.push(`/g/${groupSlug}?${itemType}=${item.id}`);
}

onMounted(() => { refreshMembers(); });
</script>
