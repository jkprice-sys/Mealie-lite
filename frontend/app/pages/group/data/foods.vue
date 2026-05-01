<template>
  <div>
    <!-- Merge Dialog -->
    <BaseDialog
      v-model="mergeDialog"
      :icon="$globals.icons.foods"
      :title="$t('data-pages.foods.combine-food')"
      can-confirm
      @confirm="mergeFoods"
    >
      <div class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <p>{{ $t("data-pages.foods.merge-dialog-text") }}</p>
        <!-- Source food -->
        <div class="space-y-1">
          <label class="block text-xs text-on-surface/60">{{ $t('data-pages.foods.source-food') }}</label>
          <input
            v-model="fromFoodSearch"
            type="text"
            :placeholder="$t('search.search')"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                   text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
          <select
            :value="fromFood?.id ?? ''"
            size="4"
            class="w-full rounded-lg border border-border bg-surface px-2 py-1 text-sm text-on-surface focus:outline-none"
            @change="fromFood = foods.find(f => f.id === ($event.target as HTMLSelectElement).value) ?? null"
          >
            <option v-for="f in filteredFoodsFrom" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <!-- Target food -->
        <div class="space-y-1">
          <label class="block text-xs text-on-surface/60">{{ $t('data-pages.foods.target-food') }}</label>
          <input
            v-model="toFoodSearch"
            type="text"
            :placeholder="$t('search.search')"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                   text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
          <select
            :value="toFood?.id ?? ''"
            size="4"
            class="w-full rounded-lg border border-border bg-surface px-2 py-1 text-sm text-on-surface focus:outline-none"
            @change="toFood = foods.find(f => f.id === ($event.target as HTMLSelectElement).value) ?? null"
          >
            <option v-for="f in filteredFoodsTo" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <p v-if="canMerge && fromFood && toFood" class="text-center text-on-surface/70 italic">
          {{ $t("data-pages.foods.merge-food-example", { food1: fromFood.name, food2: toFood.name }) }}
        </p>
      </div>
    </BaseDialog>

    <!-- Seed Dialog -->
    <BaseDialog
      v-model="seedDialog"
      :icon="$globals.icons.foods"
      :title="$t('data-pages.seed-data')"
      can-confirm
      @confirm="seedDatabase"
    >
      <div class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <p>{{ $t("data-pages.foods.seed-dialog-text") }}</p>
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('data-pages.select-language') }}</label>
          <select
            v-model="locale"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                   text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <option v-for="loc in locales" :key="loc.value" :value="loc.value">
              {{ loc.name }} ({{ loc.progress }}% {{ $t("language-dialog.translated") }})
            </option>
          </select>
        </div>
        <div
          v-if="foods && foods.length > 0"
          class="flex items-start gap-2 rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-sm text-error"
        >
          <AppIcon :path="$globals.icons.alertCircle" size="sm" class="mt-0.5 shrink-0" />
          <span>{{ $t("data-pages.foods.seed-dialog-warning") }}</span>
        </div>
      </div>
    </BaseDialog>

    <!-- Alias Sub-Dialog -->
    <RecipeDataAliasManagerDialog
      v-if="editForm.data"
      v-model="aliasManagerDialog"
      :data="editForm.data"
      @submit="updateFoodAlias"
      @cancel="aliasManagerDialog = false"
    />

    <!-- Bulk Assign Labels Dialog -->
    <BaseDialog
      v-model="bulkAssignLabelDialog"
      :title="$t('data-pages.labels.assign-label')"
      :icon="$globals.icons.tags"
      can-confirm
      @confirm="assignSelected"
    >
      <div class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <div class="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
          <p class="font-semibold text-warning mb-0.5">{{ $t("general.caution") }}</p>
          <p class="text-on-surface/80">{{ $t("data-pages.foods.label-overwrite-warning") }}</p>
        </div>
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('data-pages.foods.food-label') }}</label>
          <select
            v-model="bulkAssignLabelId"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                   text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <option value="">— {{ $t('general.none') }} —</option>
            <option v-for="label in allLabels" :key="label.id" :value="label.id">{{ label.name }}</option>
          </select>
        </div>
        <div class="rounded-lg border border-border overflow-y-auto max-h-[300px]">
          <ul class="divide-y divide-border">
            <li
              v-for="item in bulkAssignTarget"
              :key="item.id"
              class="px-3 py-2 text-sm text-on-surface"
            >
              {{ item.name }}
            </li>
          </ul>
        </div>
      </div>
    </BaseDialog>

    <GroupDataPage
      :icon="$globals.icons.foods"
      :title="$t('data-pages.foods.food-data')"
      :create-title="$t('data-pages.foods.create-food')"
      :edit-title="$t('data-pages.foods.edit-food')"
      :table-headers="tableHeaders"
      :table-config="tableConfig"
      :data="foods || []"
      :bulk-actions="[
        { icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete-selected' },
        { icon: $globals.icons.tags, text: $t('data-pages.labels.assign-label'), event: 'assign-selected' },
      ]"
      :create-form="createForm"
      :edit-form="editForm"
      @create-one="handleCreate"
      @edit-one="handleEdit"
      @delete-one="foodStore.actions.deleteOne"
      @bulk-action="handleBulkAction"
    >
      <template #table-button-row>
        <BaseButton @click="mergeDialog = true">
          <template #icon>
            {{ $globals.icons.externalLink }}
          </template>
          {{ $t('data-pages.combine') }}
        </BaseButton>
      </template>

      <template #[`item.label`]="{ item }">
        <MultiPurposeLabel
          v-if="item.label"
          :label="item.label"
        >
          {{ item.label.name }}
        </MultiPurposeLabel>
      </template>

      <template #[`item.onHand`]="{ item }">
        <AppIcon
          :path="item.onHand ? $globals.icons.check : $globals.icons.close"
          size="sm"
          :class="item.onHand ? 'text-success' : 'text-on-surface/30'"
        />
      </template>

      <template #[`item.createdAt`]="{ item }">
        {{ item.createdAt ? $d(new Date(item.createdAt)) : '' }}
      </template>

      <template #table-button-bottom>
        <BaseButton @click="seedDialog = true">
          <template #icon>
            {{ $globals.icons.database }}
          </template>
          {{ $t('data-pages.seed') }}
        </BaseButton>
      </template>

      <template #edit-dialog-custom-action>
        <BaseButton
          edit
          @click="aliasManagerDialog = true"
        >
          {{ $t('data-pages.manage-aliases') }}
        </BaseButton>
      </template>
    </GroupDataPage>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["lite-mode"] });
import type { LocaleObject } from "@nuxtjs/i18n";
import RecipeDataAliasManagerDialog from "~/components/Domain/Recipe/RecipeDataAliasManagerDialog.vue";
import { validators } from "~/composables/use-validators";
import { useUserApi } from "~/composables/api";
import type { CreateIngredientFood, IngredientFood, IngredientFoodAlias } from "~/lib/api/types/recipe";
import MultiPurposeLabel from "~/components/Domain/ShoppingList/MultiPurposeLabel.vue";
import { useLocales } from "~/composables/use-locales";
import { normalizeFilter } from "~/composables/use-utils";
import { useFoodStore, useLabelStore } from "~/composables/store";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import type { AutoFormItems } from "~/types/auto-forms";
import type { TableHeaders, TableConfig } from "~/components/global/CrudTable.vue";
import { fieldTypes } from "~/composables/forms";

interface CreateIngredientFoodWithOnHand extends CreateIngredientFood {
  onHand: boolean;
  householdsWithIngredientFood: string[];
}

interface IngredientFoodWithOnHand extends IngredientFood {
  onHand: boolean;
}
const userApi = useUserApi();
const i18n = useI18n();
const auth = useMealieAuth();
const tableConfig: TableConfig = {
  hideColumns: true,
  canExport: true,
};
const tableHeaders: TableHeaders[] = [
  {
    text: i18n.t("general.id"),
    value: "id",
    show: false,
  },
  {
    text: i18n.t("general.name"),
    value: "name",
    show: true,
    sortable: true,
  },
  {
    text: i18n.t("general.plural-name"),
    value: "pluralName",
    show: true,
    sortable: true,
  },
  {
    text: i18n.t("recipe.description"),
    value: "description",
    show: true,
  },
  {
    text: i18n.t("shopping-list.label"),
    value: "label",
    show: true,
    sortable: true,
    sort: (label1: MultiPurposeLabelOut | null, label2: MultiPurposeLabelOut | null) => {
      const label1Name = label1?.name || "";
      const label2Name = label2?.name || "";
      return label1Name.localeCompare(label2Name);
    },
  },
  {
    text: i18n.t("tool.on-hand"),
    value: "onHand",
    show: true,
    sortable: true,
  },
  {
    text: i18n.t("general.date-added"),
    value: "createdAt",
    show: false,
    sortable: true,
  },
];

const userHousehold = computed(() => auth.user.value?.householdSlug || "");
const foodStore = useFoodStore();
const foods = computed(() => foodStore.store.value.map((food) => {
  const onHand = food.householdsWithIngredientFood?.includes(userHousehold.value) || false;
  return { ...food, onHand } as IngredientFoodWithOnHand;
}));

// ============================================================
// Labels
const { store: allLabels } = useLabelStore();
const labelOptions = computed(() => allLabels.value.map(label => ({ text: label.name, value: label.id })) || []);

// ============================================================
// Form items (shared)
const formItems = computed<AutoFormItems>(() => [
  {
    label: i18n.t("general.name"),
    varName: "name",
    type: fieldTypes.TEXT,
    rules: [validators.required],
  },
  {
    label: i18n.t("general.plural-name"),
    varName: "pluralName",
    type: fieldTypes.TEXT,
  },
  {
    label: i18n.t("recipe.description"),
    varName: "description",
    type: fieldTypes.TEXT,
  },
  {
    label: i18n.t("data-pages.foods.food-label"),
    varName: "labelId",
    type: fieldTypes.SELECT,
    options: labelOptions.value,
    selectReturnValue: "value",
  },
  {
    label: i18n.t("tool.on-hand"),
    varName: "onHand",
    type: fieldTypes.BOOLEAN,
    hint: i18n.t("data-pages.foods.on-hand-checkbox-label"),
  },
]);

// ===============================================================
// Create

const createForm = reactive({
  get items() {
    return formItems.value;
  },
  data: { name: "", onHand: false, householdsWithIngredientFood: [] } as CreateIngredientFoodWithOnHand,
});

async function handleCreate() {
  if (!createForm.data || !createForm.data.name) {
    return;
  }

  if (createForm.data.onHand) {
    createForm.data.householdsWithIngredientFood = [userHousehold.value];
  }

  // @ts-expect-error the createOne function erroneously expects an id because it uses the IngredientFood type
  await foodStore.actions.createOne(createForm.data);
  createForm.data = {
    name: "",
    onHand: false,
    householdsWithIngredientFood: [],
  };
}

// ===============================================================
// Edit

const editForm = reactive({
  get items() {
    return formItems.value;
  },
  data: {} as IngredientFoodWithOnHand,
});

async function handleEdit() {
  if (!editForm.data) {
    return;
  }
  if (!editForm.data.householdsWithIngredientFood) {
    editForm.data.householdsWithIngredientFood = [];
  }

  if (editForm.data.onHand && !editForm.data.householdsWithIngredientFood.includes(userHousehold.value)) {
    editForm.data.householdsWithIngredientFood.push(userHousehold.value);
  }
  else if (!editForm.data.onHand && editForm.data.householdsWithIngredientFood.includes(userHousehold.value)) {
    const idx = editForm.data.householdsWithIngredientFood.indexOf(userHousehold.value);
    if (idx !== -1) editForm.data.householdsWithIngredientFood.splice(idx, 1);
  }

  await foodStore.actions.updateOne(editForm.data);
  editForm.data = {} as IngredientFoodWithOnHand;
}

// ============================================================
// Bulk Actions
async function handleBulkAction(event: string, items: IngredientFoodWithOnHand[]) {
  if (event === "delete-selected") {
    const ids = items.map(item => item.id);
    await foodStore.actions.deleteMany(ids);
  }
  else if (event === "assign-selected") {
    bulkAssignEventHandler(items);
  }
}

// ============================================================
// Alias Manager

const aliasManagerDialog = ref(false);
function updateFoodAlias(newAliases: IngredientFoodAlias[]) {
  if (!editForm.data) {
    return;
  }
  editForm.data.aliases = newAliases;
  aliasManagerDialog.value = false;
}

// ============================================================
// Merge Foods

const mergeDialog = ref(false);
const fromFood = ref<IngredientFoodWithOnHand | null>(null);
const toFood = ref<IngredientFoodWithOnHand | null>(null);
const fromFoodSearch = ref("");
const toFoodSearch = ref("");
const filteredFoodsFrom = computed(() =>
  foods.value.filter(f => f.name.toLowerCase().includes(fromFoodSearch.value.toLowerCase())),
);
const filteredFoodsTo = computed(() =>
  foods.value.filter(f => f.name.toLowerCase().includes(toFoodSearch.value.toLowerCase())),
);

const canMerge = computed(() => {
  return fromFood.value && toFood.value && fromFood.value.id !== toFood.value.id;
});

async function mergeFoods() {
  if (!canMerge.value || !fromFood.value || !toFood.value) {
    return;
  }

  const { data } = await userApi.foods.merge(fromFood.value.id, toFood.value.id);

  if (data) {
    foodStore.actions.refresh();
  }
}

// ============================================================
// Seed

const seedDialog = ref(false);
const locale = ref("");

const { locales: LOCALES, locale: currentLocale } = useLocales();

onMounted(() => {
  locale.value = currentLocale.value;
});

const locales = LOCALES.filter(locale =>
  (i18n.locales.value as LocaleObject[]).map(i18nLocale => i18nLocale.code).includes(locale.value as any),
);

async function seedDatabase() {
  const { data } = await userApi.seeders.foods({ locale: locale.value });

  if (data) {
    foodStore.actions.refresh();
  }
}

// ============================================================
// Bulk Assign Labels
const bulkAssignLabelDialog = ref(false);
const bulkAssignTarget = ref<IngredientFoodWithOnHand[]>([]);
const bulkAssignLabelId = ref<string | undefined>();

function bulkAssignEventHandler(selection: IngredientFoodWithOnHand[]) {
  bulkAssignTarget.value = selection;
  bulkAssignLabelDialog.value = true;
}

async function assignSelected() {
  if (!bulkAssignLabelId.value) {
    return;
  }
  for (const item of bulkAssignTarget.value) {
    item.labelId = bulkAssignLabelId.value;
    await foodStore.actions.updateOne(item);
  }
  bulkAssignTarget.value = [];
  bulkAssignLabelId.value = undefined;
  foodStore.actions.refresh();
}
</script>
