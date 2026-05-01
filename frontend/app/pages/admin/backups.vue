<template>
  <div class="px-4 py-4">
    <section>
      <!-- Delete Dialog -->
      <BaseDialog
        v-model="state.deleteDialog"
        :title="$t('settings.backup.delete-backup')"
        color="error"
        :icon="$globals.icons.alertCircle"
        can-confirm
        @confirm="deleteBackup()"
      >
        <div class="px-4 py-3">
          <p class="text-sm text-on-surface">{{ $t("general.confirm-delete-generic") }}</p>
        </div>
      </BaseDialog>

      <!-- Import Dialog -->
      <BaseDialog
        v-model="state.importDialog"
        color="error"
        :title="$t('settings.backup.backup-restore')"
        :icon="$globals.icons.database"
      >
        <div class="px-4 py-3 space-y-3">
          <hr class="border-border" />
          <p class="text-sm text-on-surface">
            <i18n-t keypath="settings.backup.back-restore-description">
              <template #cannot-be-undone>
                <b>{{ $t('settings.backup.cannot-be-undone') }}</b>
              </template>
            </i18n-t>
          </p>
          <p class="text-sm text-on-surface mt-2">
            <i18n-t keypath="settings.backup.postgresql-note">
              <template #backup-restore-process>
                <a class="text-primary" href="https://nightly.mealie.io/documentation/getting-started/usage/backups-and-restoring/">
                  {{ $t('settings.backup.backup-restore-process-in-the-documentation') }}
                </a>
              </template>
            </i18n-t>
          </p>
          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="state.confirmImport" type="checkbox" class="mt-0.5 accent-error" />
            <span class="text-sm text-on-surface">{{ $t('settings.backup.irreversible-acknowledgment') }}</span>
          </label>
          <div class="flex justify-center">
            <BaseButton
              delete
              :disabled="!state.confirmImport || state.runningRestore"
              @click="restoreBackup(selected)"
            >
              <template #icon>
                {{ $globals.icons.database }}
              </template>
              {{ $t('settings.backup.restore-backup') }}
            </BaseButton>
          </div>
          <p class="text-xs text-on-surface/60 text-center pb-1">{{ selected }}</p>
          <div v-if="state.runningRestore" class="h-1 bg-primary/20 rounded-full overflow-hidden">
            <div class="h-full bg-primary animate-pulse w-full" />
          </div>
        </div>
      </BaseDialog>

      <section>
        <BaseCardSectionTitle :title="$t('settings.backup-and-exports')">
          <p class="text-sm text-on-surface/70 py-0 px-0">
            <i18n-t keypath="settings.backup.experimental-description" />
          </p>
        </BaseCardSectionTitle>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          <BaseButton
            :loading="state.runningBackup"
            @click="createBackup"
          >
            {{ $t("settings.backup.create-heading") }}
          </BaseButton>
          <AppButtonUpload
            :text-btn="false"
            url="/api/admin/backups/upload"
            accept=".zip"
            color="info"
            @uploaded="refreshBackups()"
          />
        </div>

        <div class="overflow-x-auto rounded-xl border border-border">
          <table class="w-full text-sm text-on-surface">
            <thead>
              <tr class="border-b border-border bg-surface">
                <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('general.name') }}</th>
                <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('general.created') }}</th>
                <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('export.size') }}</th>
                <th class="px-3 py-2 text-right font-medium text-on-surface/60" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in backups.imports || []"
                :key="item.name"
                class="border-b border-border hover:bg-primary/5 cursor-pointer transition-colors"
                @click="setSelected(item)"
              >
                <td class="px-3 py-2">{{ item.name }}</td>
                <td class="px-3 py-2">{{ $d(Date.parse(item.date)) }}</td>
                <td class="px-3 py-2">{{ item.size }}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      class="p-1 rounded text-error hover:bg-error/10 transition-colors"
                      @click.stop="state.deleteDialog = true; deleteTarget = item.name"
                    >
                      <AppIcon :path="$globals.icons.delete" size="sm" />
                    </button>
                    <BaseButton
                      small
                      download
                      :download-url="backupsFileNameDownload(item.name)"
                      @click.stop="() => {}"
                    />
                    <BaseButton
                      small
                      @click.stop="setSelected(item); state.importDialog = true"
                    >
                      <template #icon>
                        {{ $globals.icons.backupRestore }}
                      </template>
                      {{ $t("settings.backup.backup-restore") }}
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <hr class="border-border mt-2" />
      </section>
    </section>

    <div class="mt-4 flex justify-center text-center">
      <NuxtLink class="text-primary text-sm" :to="`/group/migrations`">
        {{ $t('recipe.looking-for-migrations') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import type { AllBackups } from "~/lib/api/types/admin";
import { alert } from "~/composables/use-toast";

definePageMeta({
  layout: "admin",
});

const i18n = useI18n();
const { $globals } = useNuxtApp();

const adminApi = useAdminApi();
const selected = ref("");

const backups = ref<AllBackups>({
  imports: [],
  templates: [],
});

async function refreshBackups() {
  const { data } = await adminApi.backups.getAll();
  if (data) {
    backups.value = data;
  }
}

async function createBackup() {
  state.runningBackup = true;
  const { data } = await adminApi.backups.create();

  if (data?.error === false) {
    refreshBackups();
    alert.success(i18n.t("settings.backup.backup-created"));
  }
  else {
    alert.error(i18n.t("settings.backup.error-creating-backup-see-log-file"));
  }
  state.runningBackup = false;
}

async function restoreBackup(fileName: string) {
  state.runningRestore = true;
  const { error } = await adminApi.backups.restore(fileName);

  if (error) {
    console.log(error);
    state.importDialog = false;
    state.runningRestore = false;
    alert.error(i18n.t("settings.backup.restore-fail"));
  }
  else {
    alert.success(i18n.t("settings.backup.restore-success"));
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

const deleteTarget = ref("");

async function deleteBackup() {
  const { data } = await adminApi.backups.delete(deleteTarget.value);

  if (!data?.error) {
    alert.success(i18n.t("settings.backup.backup-deleted"));
    refreshBackups();
  }
}

const state = reactive({
  confirmImport: false,
  deleteDialog: false,
  createDialog: false,
  importDialog: false,
  runningBackup: false,
  runningRestore: false,
  search: "",
});

function setSelected(data: { name: string; date: string }) {
  if (!data.name) {
    return;
  }
  selected.value = data.name;
}

const backupsFileNameDownload = (fileName: string) => `api/admin/backups/${fileName}`;

useSeoMeta({
  title: i18n.t("sidebar.backups"),
});

onMounted(refreshBackups);

useHead({
  title: i18n.t("sidebar.backups"),
});
</script>
