<template>
  <div>
    <!-- Seed Dialog -->
    <BaseDialog
      v-model="seedDialog"
      :icon="$globals.icons.foods"
      :title="$t('data-pages.seed-data')"
      can-confirm
      @confirm="seedDatabase"
    >
      <div class="px-4 py-3 space-y-3 text-sm text-on-surface">
        <p>{{ $t("data-pages.labels.seed-dialog-text") }}</p>
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
          v-if="labelStore.store.value && labelStore.store.value.length > 0"
          class="flex items-start gap-2 rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-sm text-error"
        >
          <AppIcon :path="$globals.icons.alertCircle" size="sm" class="mt-0.5 shrink-0" />
          <span>{{ $t("data-pages.foods.seed-dialog-warning") }}</span>
        </div>
      </div>
    </BaseDialog>

    <GroupDataPage
      :icon="$globals.icons.tags"
      :title="$t('data-pages.labels.labels')"
      :create-title="$t('data-pages.labels.new-label')"
      :edit-title="$t('data-pages.labels.edit-label')"
      :table-headers="tableHeaders"
      :table-config="tableConfig"
      :data="labelStore.store.value || []"
      :bulk-actions="[{ icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete-selected' }]"
      :create-form="createForm"
      :edit-form="editForm"
      @create-one="handleCreate"
      @edit-one="handleEdit"
      @delete-one="labelStore.actions.deleteOne"
      @bulk-action="handleBulkAction"
    >
      <template #[`item.name`]="{ item }">
        <MultiPurposeLabel
          v-if="item"
          :label="item"
        >
          {{ item.name }}
        </MultiPurposeLabel>
      </template>

      <template #create-dialog-top>
        <MultiPurposeLabel v-if="createForm.data.name" :label="createForm.data" class="my-2" />
      </template>

      <template #edit-dialog-top>
        <MultiPurposeLabel v-if="editForm.data.name" :label="editForm.data" class="my-2" />
      </template>

      <template #table-button-bottom>
        <BaseButton @click="seedDialog = true">
          <template #icon>
            {{ $globals.icons.database }}
          </template>
          {{ $t('data-pages.seed') }}
        </BaseButton>
      </template>
    </GroupDataPage>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["lite-mode"] });
import { validators } from "~/composables/use-validators";
import { useUserApi } from "~/composables/api";
import MultiPurposeLabel from "~/components/Domain/ShoppingList/MultiPurposeLabel.vue";
import { fieldTypes } from "~/composables/forms";
import type { MultiPurposeLabelSummary } from "~/lib/api/types/labels";
import type { AutoFormItems } from "~/types/auto-forms";
import { useLocales } from "~/composables/use-locales";
import { normalizeFilter } from "~/composables/use-utils";
import { useLabelStore } from "~/composables/store";
import type { TableHeaders, TableConfig } from "~/components/global/CrudTable.vue";

const userApi = useUserApi();
const i18n = useI18n();

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
];

const labelStore = useLabelStore();

// ============================================================
// Form items (shared)
const formItems: AutoFormItems = [
  {
    label: i18n.t("general.name"),
    varName: "name",
    type: fieldTypes.TEXT,
    rules: [validators.required],
  },
  {
    label: i18n.t("general.color"),
    varName: "color",
    type: fieldTypes.COLOR,
  },
];

// ============================================================
// Create
const createForm = reactive({
  items: formItems,
  data: {
    name: "",
    color: "",
  } as MultiPurposeLabelSummary,
});

async function handleCreate(createFormData: MultiPurposeLabelSummary) {
  await labelStore.actions.createOne(createFormData);
  createForm.data = { name: "", color: "#7417BE" } as MultiPurposeLabelSummary;
}

// ============================================================
// Edit
const editForm = reactive({
  items: formItems,
  data: {} as MultiPurposeLabelSummary,
});

async function handleEdit(editFormData: MultiPurposeLabelSummary) {
  await labelStore.actions.updateOne(editFormData);
  editForm.data = {} as MultiPurposeLabelSummary;
}

// ============================================================
// Bulk Actions
async function handleBulkAction(event: string, items: MultiPurposeLabelSummary[]) {
  if (event === "delete-selected") {
    const ids = items.filter(item => item.id != null).map(item => item.id!);
    await labelStore.actions.deleteMany(ids);
  }
}

// ============================================================
// Seed

const seedDialog = ref(false);
const locale = ref("");

const { locales: locales, locale: currentLocale } = useLocales();

onMounted(() => {
  locale.value = currentLocale.value;
});

async function seedDatabase() {
  const { data } = await userApi.seeders.labels({ locale: locale.value });

  if (data) {
    labelStore.actions.refresh();
  }
}
</script>
