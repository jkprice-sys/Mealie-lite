<template>
  <!-- Create Dialog -->
  <BaseDialog
    v-model="createDialog"
    :title="createTitle || $t('general.create')"
    :icon="icon"
    color="primary"
    max-width="600px"
    width="100%"
    :submit-disabled="!createFormValid"
    can-confirm
    @confirm="emit('create-one', createForm.data)"
  >
    <div class="mx-2 mt-2">
      <slot name="create-dialog-top" />
      <AutoForm
        v-model="createForm.data"
        v-model:is-valid="createFormValid"
        :items="createForm.items"
        class="py-2"
      />
    </div>
  </BaseDialog>

  <!-- Edit Dialog -->
  <BaseDialog
    v-model="editDialog"
    :title="editTitle || $t('general.edit')"
    :icon="icon"
    color="primary"
    max-width="600px"
    width="100%"
    :submit-disabled="!editFormValid"
    can-confirm
    @confirm="emit('edit-one', editForm.data)"
  >
    <div class="mx-2 mt-2">
      <slot name="edit-dialog-top" />
      <AutoForm
        v-model="editForm.data"
        v-model:is-valid="editFormValid"
        :items="editForm.items"
        class="py-2"
      />
    </div>
    <template #custom-card-action>
      <slot name="edit-dialog-custom-action" />
    </template>
  </BaseDialog>

  <!-- Delete Dialog -->
  <BaseDialog
    v-model="deleteDialog"
    :title="$t('general.confirm')"
    :icon="$globals.icons.alertCircle"
    color="error"
    can-confirm
    @confirm="$emit('deleteOne', deleteTarget.id)"
  >
    <div class="px-4 py-3 text-sm text-on-surface">
      {{ $t("general.confirm-delete-generic") }}
      <p v-if="deleteTarget" class="mt-3 ml-4 font-medium">
        {{ deleteTarget.name || deleteTarget.title || deleteTarget.id }}
      </p>
    </div>
  </BaseDialog>

  <!-- Bulk Delete Dialog -->
  <BaseDialog
    v-model="bulkDeleteDialog"
    width="650px"
    :title="$t('general.confirm')"
    :icon="$globals.icons.alertCircle"
    color="error"
    can-confirm
    @confirm="$emit('bulk-action', 'delete-selected', bulkDeleteTarget)"
  >
    <div class="px-4 py-3 text-sm text-on-surface space-y-3">
      <p class="font-medium">{{ $t('general.confirm-delete-generic-items') }}</p>
      <div class="rounded-lg border border-border overflow-y-auto max-h-[400px]">
        <ul class="divide-y divide-border">
          <li
            v-for="item in bulkDeleteTarget"
            :key="item.id ?? item.name"
            class="px-3 py-2 text-sm text-on-surface"
          >
            {{ item.name || item.title || item.id }}
          </li>
        </ul>
      </div>
    </div>
  </BaseDialog>

  <BaseCardSectionTitle
    :icon="icon"
    section
    :title="title"
  />

  <CrudTable
    :headers="tableHeaders"
    :table-config="tableConfig"
    :data="data || []"
    :bulk-actions="bulkActions"
    :initial-sort="initialSort"
    @edit-one="editEventHandler"
    @delete-one="deleteEventHandler"
    @bulk-action="handleBulkAction"
  >
    <template
      v-for="slotName in itemSlotNames"
      #[slotName]="slotProps"
    >
      <slot
        :name="slotName"
        v-bind="slotProps"
      />
    </template>
    <template #button-row>
      <BaseButton
        create
        @click="createDialog = true"
      >
        {{ $t("general.create") }}
      </BaseButton>
      <slot name="table-button-row" />
    </template>
    <template #button-bottom>
      <slot name="table-button-bottom" />
    </template>
  </CrudTable>
</template>

<script setup lang="ts">
import type { TableHeaders, TableConfig, BulkAction } from "~/components/global/CrudTable.vue";
import type { AutoFormItems } from "~/types/auto-forms";

const slots = useSlots();

const emit = defineEmits<{
  (e: "deleteOne", id: string): void;
  (e: "deleteMany", ids: string[]): void;
  (e: "create-one" | "edit-one", data: any): void;
  (e: "bulk-action", event: string, items: any[]): void;
}>();

const tableHeaders = defineModel<TableHeaders[]>("tableHeaders", { required: true });
const createForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("createForm", { required: true });
const createDialog = defineModel("createDialog", { type: Boolean, default: false });

const editForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("editForm", { required: true });
const editDialog = defineModel("editDialog", { type: Boolean, default: false });

defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  createTitle: {
    type: String,
  },
  editTitle: {
    type: String,
  },
  tableConfig: {
    type: Object as PropType<TableConfig>,
    default: () => ({
      hideColumns: false,
      canExport: true,
    }),
  },
  data: {
    type: Array as PropType<Array<any>>,
    required: true,
  },
  bulkActions: {
    type: Array as PropType<BulkAction[]>,
    required: true,
  },
  initialSort: {
    type: String,
    default: "name",
  },
});

// ============================================================
// Bulk Action Handler
function handleBulkAction(event: string, items: any[]) {
  if (event === "delete-selected") {
    bulkDeleteEventHandler(items);
    return;
  }
  emit("bulk-action", event, items);
}

// ============================================================
// Create & Edit
const createFormValid = ref(false);
const editFormValid = ref(false);
const itemSlotNames = computed(() => Object.keys(slots).filter(slotName => slotName.startsWith("item.")));
const editEventHandler = (item: any) => {
  editForm.value.data = { ...item };
  editDialog.value = true;
};

// ============================================================
// Delete Logic
const deleteTarget = ref<any>(null);
const deleteDialog = ref(false);

function deleteEventHandler(item: any) {
  deleteTarget.value = item;
  deleteDialog.value = true;
}

// ============================================================
// Bulk Delete Logic
const bulkDeleteTarget = ref<Array<any>>([]);
const bulkDeleteDialog = ref(false);

function bulkDeleteEventHandler(items: Array<any>) {
  bulkDeleteTarget.value = items;
  bulkDeleteDialog.value = true;
  console.log("Bulk Delete Event Handler", items);
}
</script>
