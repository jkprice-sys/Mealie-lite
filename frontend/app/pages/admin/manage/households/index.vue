<template>
  <div class="px-4 py-4">
    <BaseDialog
      v-model="createDialog"
      :title="$t('household.create-household')"
      :icon="$globals.icons.household"
    >
      <template #activator />
      <div class="px-4 py-3 space-y-3">
        <div v-if="groups">
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('household.household-group') }}</label>
          <select
            v-model="createHouseholdForm.data.groupId"
            required
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>{{ $t('household.household-group') }}</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>
        <AutoForm
          v-model="createHouseholdForm.data"
          :update-mode="updateMode"
          :items="createHouseholdForm.items"
        />
      </div>
      <template #custom-card-action>
        <BaseButton type="button" @click="handleCreateSubmit">
          {{ $t("general.create") }}
        </BaseButton>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="confirmDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteHousehold(deleteTarget)"
    >
      <template #activator />
      <div class="px-4 py-3">
        <p class="text-sm text-on-surface">{{ $t("general.confirm-delete-generic") }}</p>
      </div>
    </BaseDialog>

    <BaseCardSectionTitle :title="$t('household.household-management')" />

    <section>
      <div class="flex items-center gap-2 mb-4">
        <BaseButton @click="openDialog">
          {{ $t("general.create") }}
        </BaseButton>
      </div>

      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full text-sm text-on-surface">
          <thead>
            <tr class="border-b border-border bg-surface">
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('household.household') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('general.name') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('group.group') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.total-users') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.webhooks-enabled') }}</th>
              <th class="px-3 py-2 text-center font-medium text-on-surface/60">{{ $t('general.delete') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in households || []"
              :key="h.id"
              class="border-b border-border hover:bg-primary/5 cursor-pointer transition-colors"
              @click="handleRowClick(h)"
            >
              <td class="px-3 py-2 text-xs text-on-surface/60">{{ h.id }}</td>
              <td class="px-3 py-2">{{ h.name }}</td>
              <td class="px-3 py-2">{{ h.group }}</td>
              <td class="px-3 py-2">{{ h.users?.length }}</td>
              <td class="px-3 py-2">{{ h.webhooks!.length > 0 ? $t("general.yes") : $t("general.no") }}</td>
              <td class="px-3 py-2 text-center">
                <button
                  type="button"
                  :disabled="h.users!.length > 0"
                  :title="h.users!.length > 0 ? $t('admin.household-delete-note') : undefined"
                  class="p-1 rounded text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  @click.stop="confirmDialog = true; deleteTarget = h.id"
                >
                  <AppIcon :path="$globals.icons.delete" size="sm" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <hr class="border-border mt-2" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { fieldTypes } from "~/composables/forms";
import { useGroups } from "~/composables/use-groups";
import { useAdminHouseholds } from "~/composables/use-households";
import { validators } from "~/composables/use-validators";
import type { HouseholdInDB } from "~/lib/api/types/household";

definePageMeta({
  layout: "admin",
});

const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("household.manage-households"),
});

const { groups } = useGroups();
const { households, deleteHousehold, createHousehold } = useAdminHouseholds();

const createDialog = ref(false);
const confirmDialog = ref(false);
const deleteTarget = ref<string>("");
const search = ref("");
const updateMode = ref(false);

const createHouseholdForm = reactive({
  items: [
    {
      label: i18n.t("household.household-name"),
      varName: "name",
      type: fieldTypes.TEXT,
      rules: [validators.required],
    },
  ],
  data: {
    groupId: "",
    name: "",
  },
});

function openDialog() {
  createDialog.value = true;
  createHouseholdForm.data.name = "";
  createHouseholdForm.data.groupId = "";
}

const router = useRouter();

function handleRowClick(item: HouseholdInDB) {
  router.push(`/admin/manage/households/${item.id}`);
}

async function handleCreateSubmit() {
  if (!createHouseholdForm.data.groupId || !createHouseholdForm.data.name) {
    return;
  }
  createDialog.value = false;
  await createHousehold(createHouseholdForm.data);
}

// suppress unused
void search;
</script>
