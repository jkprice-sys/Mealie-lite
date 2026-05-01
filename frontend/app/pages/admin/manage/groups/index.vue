<template>
  <div class="px-4 py-4">
    <BaseDialog
      v-model="state.createDialog"
      :title="$t('group.create-group')"
      :icon="$globals.icons.group"
      can-submit
      @submit="createGroup(state.createGroupForm.data)"
    >
      <template #activator />
      <div class="px-4 py-3">
        <AutoForm
          v-model="state.createGroupForm.data"
          :update-mode="state.updateMode"
          :items="state.createGroupForm.items"
        />
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="state.confirmDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteGroup(state.deleteTarget)"
    >
      <template #activator />
      <div class="px-4 py-3">
        <p class="text-sm text-on-surface">{{ $t("general.confirm-delete-generic") }}</p>
      </div>
    </BaseDialog>

    <BaseCardSectionTitle :title="$t('group.group-management')" />

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
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('group.group') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('general.name') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('group.total-households') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.total-users') }}</th>
              <th class="px-3 py-2 text-center font-medium text-on-surface/60">{{ $t('general.delete') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="g in groups || []"
              :key="g.id"
              class="border-b border-border hover:bg-primary/5 cursor-pointer transition-colors"
              @click="handleRowClick(g)"
            >
              <td class="px-3 py-2 text-xs text-on-surface/60">{{ g.id }}</td>
              <td class="px-3 py-2">{{ g.name }}</td>
              <td class="px-3 py-2">{{ g.households!.length }}</td>
              <td class="px-3 py-2">{{ g.users!.length }}</td>
              <td class="px-3 py-2 text-center">
                <button
                  type="button"
                  :disabled="g.households!.length > 0 || g.users!.length > 0"
                  :title="(g.households!.length > 0 || g.users!.length > 0) ? $t('admin.group-delete-note') : undefined"
                  class="p-1 rounded text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  @click.stop="state.confirmDialog = true; state.deleteTarget = g.id"
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
import { validators } from "~/composables/use-validators";
import type { GroupInDB } from "~/lib/api/types/user";

definePageMeta({
  layout: "admin",
});

const i18n = useI18n();
const { $globals } = useNuxtApp();

useHead({
  title: i18n.t("group.manage-groups"),
});

useSeoMeta({
  title: i18n.t("group.manage-groups"),
});

const { groups, deleteGroup, createGroup } = useGroups();

const state = reactive({
  createDialog: false,
  confirmDialog: false,
  deleteTarget: "",
  search: "",
  updateMode: false,
  createGroupForm: {
    items: [
      {
        label: i18n.t("group.group-name"),
        varName: "name",
        type: fieldTypes.TEXT,
        rules: [validators.required],
      },
    ],
    data: {
      name: "",
    },
  },
});

function openDialog() {
  state.createDialog = true;
  state.createGroupForm.data.name = "";
}

function handleRowClick(item: GroupInDB) {
  navigateTo(`/admin/manage/groups/${item.id}`);
}
</script>
