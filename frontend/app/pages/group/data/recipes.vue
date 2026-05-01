<template>
  <div class="container mx-auto px-4 py-4">
    <!-- Export Purge Confirmation Dialog -->
    <BaseDialog
      v-model="purgeExportsDialog"
      :title="$t('data-pages.recipes.purge-exports')"
      color="error"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="purgeExports()"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t('data-pages.recipes.are-you-sure-you-want-to-delete-all-export-data') }}
      </div>
    </BaseDialog>

    <!-- Base Dialog (multi-mode) -->
    <BaseDialog
      ref="domDialog"
      v-model="dialog.state"
      width="650px"
      :icon="dialog.icon"
      :title="dialog.title"
      :submit-text="$t('general.submit')"
      can-submit
      @submit="dialog.callback"
    >
      <!-- Tag mode -->
      <div v-if="dialog.mode == MODES.tag" class="px-4 py-3">
        <RecipeOrganizerSelector v-model="toSetTags" selector-type="tags" />
      </div>

      <!-- Category mode -->
      <div v-else-if="dialog.mode == MODES.category" class="px-4 py-3">
        <RecipeOrganizerSelector v-model="toSetCategories" selector-type="categories" />
      </div>

      <!-- Delete mode -->
      <div v-else-if="dialog.mode == MODES.delete" class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <p class="font-medium">{{ $t('data-pages.recipes.confirm-delete-recipes') }}</p>
        <div class="rounded-lg border border-border overflow-y-auto max-h-[350px]">
          <ul class="divide-y divide-border">
            <li v-for="item in selected" :key="item.id" class="px-3 py-2 text-sm">{{ item.name }}</li>
          </ul>
        </div>
      </div>

      <!-- Export mode -->
      <div v-else-if="dialog.mode == MODES.export" class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <p class="font-medium">
          {{ $t('data-pages.recipes.the-following-recipes-selected-length-will-be-exported', [selected.length]) }}
        </p>
        <div class="rounded-lg border border-border overflow-y-auto max-h-[350px]">
          <ul class="divide-y divide-border">
            <li v-for="item in selected" :key="item.id" class="px-3 py-2 text-sm">{{ item.name }}</li>
          </ul>
        </div>
      </div>

      <!-- Update settings mode -->
      <div v-else-if="dialog.mode == MODES.updateSettings" class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <p>{{ $t('data-pages.recipes.settings-chosen-explanation') }}</p>
        <div class="mx-auto max-w-sm">
          <RecipeSettingsSwitches v-model="recipeSettings" />
        </div>
        <p class="text-center text-on-surface/60 italic">
          {{ $t('data-pages.recipes.selected-length-recipe-s-settings-will-be-updated', selected.length) }}
        </p>
      </div>

      <!-- Change owner mode -->
      <div v-else-if="dialog.mode == MODES.changeOwner" class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <div class="flex items-center gap-3">
          <UserAvatar :user-id="selectedOwner" :tooltip="false" />
          <div class="flex-1">
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.owner') }}</label>
            <select
              v-model="selectedOwner"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                     text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.fullName }}</option>
            </select>
          </div>
        </div>
        <div v-if="selectedOwnerHousehold" class="flex items-center gap-2 text-on-surface/70">
          <AppIcon :path="$globals.icons.household" size="sm" />
          <span>{{ selectedOwnerHousehold.name }}</span>
        </div>
      </div>
    </BaseDialog>

    <!-- ── Recipe Data Table Section ──────────────────────────────── -->
    <section>
      <BaseCardSectionTitle
        :icon="$globals.icons.primary"
        :title="$t('data-pages.recipes.recipe-data')"
      >
        {{ $t('data-pages.recipes.recipe-data-description') }}
      </BaseCardSectionTitle>

      <!-- Toolbar -->
      <div class="flex flex-wrap gap-2 items-center py-2 mb-1">
        <!-- Column toggle -->
        <Menu as="div" class="relative">
          <MenuButton class="bs-btn bs-btn-sm bs-btn-outline gap-1.5">
            <AppIcon :path="$globals.icons.cog" size="sm" />
            {{ $t('data-pages.columns') }}
          </MenuButton>
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <MenuItems class="absolute left-0 z-20 mt-1 w-52 origin-top-left bg-surface border border-border rounded-lg shadow-lg focus:outline-none py-2">
              <div class="px-3 space-y-1.5">
                <p class="text-xs font-semibold text-on-surface/60 uppercase tracking-wide pb-1 border-b border-border">
                  {{ $t('data-pages.recipes.recipe-columns') }}
                </p>
                <label
                  v-for="(_, key) in headers"
                  :key="key"
                  class="flex items-center gap-2 text-sm cursor-pointer text-on-surface"
                >
                  <input
                    v-model="headers[key]"
                    type="checkbox"
                    class="w-4 h-4 rounded border-border accent-primary"
                  />
                  {{ headerLabels[key] }}
                </label>
              </div>
            </MenuItems>
          </Transition>
        </Menu>

        <!-- Bulk actions -->
        <BaseOverflowButton
          :disabled="selected.length < 1"
          mode="event"
          :items="actions"
          @export-selected="openDialog(MODES.export)"
          @tag-selected="openDialog(MODES.tag)"
          @categorize-selected="openDialog(MODES.category)"
          @delete-selected="openDialog(MODES.delete)"
          @update-settings="openDialog(MODES.updateSettings)"
          @change-owner="openDialog(MODES.changeOwner)"
        />

        <p v-if="selected.length > 0" class="text-xs text-on-surface/60 my-auto ml-2">
          {{ $t('general.selected-count', selected.length) }}
        </p>

        <!-- Search -->
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

      <!-- Table -->
      <div class="bs-card-body p-0">
        <RecipeDataTable
          v-model="selected"
          :loading="loading"
          :recipes="allRecipes"
          :show-headers="headers"
          :search="search"
        />
      </div>

      <!-- Export all -->
      <div class="flex justify-end py-2 mt-1">
        <BaseButton
          @click="selectAll(); openDialog(MODES.export)"
        >
          <template #icon>{{ $globals.icons.database }}</template>
          {{ $t('general.export-all') }}
        </BaseButton>
      </div>
    </section>

    <!-- ── Data Exports Section ────────────────────────────────────── -->
    <section class="mt-10">
      <BaseCardSectionTitle
        :icon="$globals.icons.database"
        section
        :title="$t('data-pages.recipes.data-exports')"
      >
        {{ $t('data-pages.recipes.data-exports-description') }}
      </BaseCardSectionTitle>

      <div class="flex py-2 mb-1">
        <BaseButton delete @click="purgeExportsDialog = true" />
      </div>

      <div class="bs-card-body p-0">
        <GroupExportData :exports="groupExports" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import RecipeDataTable from "~/components/Domain/Recipe/RecipeDataTable.vue";
import RecipeOrganizerSelector from "~/components/Domain/Recipe/RecipeOrganizerSelector.vue";
import { useUserApi } from "~/composables/api";
import { useRecipes, allRecipes } from "~/composables/recipes";
import type { Recipe, RecipeSettings } from "~/lib/api/types/recipe";
import GroupExportData from "~/components/Domain/Group/GroupExportData.vue";
import type { GroupDataExport } from "~/lib/api/types/group";
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";
import RecipeSettingsSwitches from "~/components/Domain/Recipe/RecipeSettingsSwitches.vue";
import { useUserStore } from "~/composables/store/use-user-store";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import { useHouseholdStore } from "~/composables/store/use-household-store";

enum MODES {
  tag = "tag",
  category = "category",
  export = "export",
  delete = "delete",
  updateSettings = "updateSettings",
  changeOwner = "changeOwner",
}

definePageMeta({ scrollToTop: true });

const i18n = useI18n();
const auth = useMealieAuth();
const { $globals } = useNuxtApp();

useSeoMeta({ title: i18n.t("data-pages.recipes.recipe-data") });

const { refreshRecipes } = useRecipes(true, true, false, `householdId=${auth.user.value?.householdId || ""}`);
const selected = ref<Recipe[]>([]);
const search = ref("");

function resetAll() {
  selected.value = [];
  toSetTags.value = [];
  toSetCategories.value = [];
  loading.value = false;
}

const headers = reactive({
  id: false,
  owner: false,
  tags: true,
  tools: true,
  categories: true,
  recipeServings: false,
  recipeYieldQuantity: false,
  recipeYield: false,
  dateAdded: false,
});

const headerLabels: Record<keyof typeof headers, string> = {
  id:                   i18n.t("general.id"),
  owner:                i18n.t("general.owner"),
  tags:                 i18n.t("tag.tags"),
  categories:           i18n.t("recipe.categories"),
  tools:                i18n.t("tool.tools"),
  recipeServings:       i18n.t("recipe.recipe-servings"),
  recipeYieldQuantity:  i18n.t("recipe.recipe-yield"),
  recipeYield:          i18n.t("recipe.recipe-yield-text"),
  dateAdded:            i18n.t("general.date-added"),
};

const actions: MenuItem[] = [
  { icon: $globals.icons.database,   text: i18n.t("export.export"),                     event: "export-selected" },
  { icon: $globals.icons.tags,       text: i18n.t("data-pages.recipes.tag"),             event: "tag-selected" },
  { icon: $globals.icons.categories, text: i18n.t("data-pages.recipes.categorize"),      event: "categorize-selected" },
  { icon: $globals.icons.cog,        text: i18n.t("data-pages.recipes.update-settings"), event: "update-settings" },
  { icon: $globals.icons.user,       text: i18n.t("general.change-owner"),               event: "change-owner" },
  { icon: $globals.icons.delete,     text: i18n.t("general.delete"),                     event: "delete-selected" },
];

const api = useUserApi();
const loading = ref(false);

// ── Group Exports ─────────────────────────────────────────────
const purgeExportsDialog = ref(false);

async function purgeExports() {
  await api.bulk.purgeExports();
  refreshExports();
}

const groupExports = ref<GroupDataExport[]>([]);

async function refreshExports() {
  const { data } = await api.bulk.fetchExports();
  if (data) groupExports.value = data;
}

onMounted(async () => { await refreshExports(); });

// ── All Recipes ────────────────────────────────────────────────
function selectAll() { selected.value = allRecipes.value; }

async function exportSelected() {
  loading.value = true;
  const { data } = await api.bulk.bulkExport({
    recipes: selected.value.map((x: Recipe) => x.slug ?? ""),
    exportType: "json",
  });
  if (data) console.log(data);
  resetAll();
  refreshExports();
}

const toSetTags = ref([]);

async function tagSelected() {
  loading.value = true;
  const recipes = selected.value.map((x: Recipe) => x.slug ?? "");
  await api.bulk.bulkTag({ recipes, tags: toSetTags.value });
  await refreshRecipes();
  resetAll();
}

const toSetCategories = ref([]);

async function categorizeSelected() {
  loading.value = true;
  const recipes = selected.value.map((x: Recipe) => x.slug ?? "");
  await api.bulk.bulkCategorize({ recipes, categories: toSetCategories.value });
  await refreshRecipes();
  resetAll();
}

async function deleteSelected() {
  loading.value = true;
  const recipes = selected.value.map((x: Recipe) => x.slug ?? "");
  await api.bulk.bulkDelete({ recipes });
  await refreshRecipes();
  resetAll();
}

const recipeSettings = reactive<RecipeSettings>({
  public: false,
  showNutrition: false,
  showAssets: false,
  landscapeView: false,
  disableComments: false,
  locked: false,
});

async function updateSettings() {
  loading.value = true;
  const recipes = selected.value.map((x: Recipe) => x.slug ?? "");
  await api.bulk.bulkSetSettings({ recipes, settings: recipeSettings });
  await refreshRecipes();
  resetAll();
}

async function changeOwner() {
  if (!selected.value.length || !selectedOwner.value) return;
  selected.value.forEach(r => { r.userId = selectedOwner.value; });
  loading.value = true;
  await api.recipes.patchMany(selected.value);
  await refreshRecipes();
  resetAll();
}

// ── Dialog management ─────────────────────────────────────────
const domDialog = ref(null);

const dialog = reactive({
  state:    false,
  title:    i18n.t("data-pages.recipes.tag-recipes"),
  mode:     MODES.tag,
  callback: () => Promise.resolve() as Promise<void>,
  icon:     $globals.icons.tags,
});

function openDialog(mode: MODES) {
  const titles: Record<MODES, string> = {
    [MODES.tag]:            i18n.t("data-pages.recipes.tag-recipes"),
    [MODES.category]:       i18n.t("data-pages.recipes.categorize-recipes"),
    [MODES.export]:         i18n.t("data-pages.recipes.export-recipes"),
    [MODES.delete]:         i18n.t("data-pages.recipes.delete-recipes"),
    [MODES.updateSettings]: i18n.t("data-pages.recipes.update-settings"),
    [MODES.changeOwner]:    i18n.t("general.change-owner"),
  };
  const callbacks: Record<MODES, () => Promise<void>> = {
    [MODES.tag]:            tagSelected,
    [MODES.category]:       categorizeSelected,
    [MODES.export]:         exportSelected,
    [MODES.delete]:         deleteSelected,
    [MODES.updateSettings]: updateSettings,
    [MODES.changeOwner]:    changeOwner,
  };
  const icons: Record<MODES, string> = {
    [MODES.tag]:            $globals.icons.tags,
    [MODES.category]:       $globals.icons.categories,
    [MODES.export]:         $globals.icons.database,
    [MODES.delete]:         $globals.icons.delete,
    [MODES.updateSettings]: $globals.icons.cog,
    [MODES.changeOwner]:    $globals.icons.user,
  };
  dialog.mode     = mode;
  dialog.title    = titles[mode];
  dialog.callback = callbacks[mode];
  dialog.icon     = icons[mode];
  dialog.state    = true;
}

const { store: allUsers }   = useUserStore();
const { store: households } = useHouseholdStore();
const selectedOwner         = ref("");
const selectedOwnerHousehold = computed(() => {
  if (!selectedOwner.value) return null;
  const owner = allUsers.value.find(u => u.id === selectedOwner.value);
  if (!owner) return null;
  return households.value.find(h => h.id === owner.householdId);
});
</script>
