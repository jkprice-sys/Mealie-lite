<template>
  <div class="px-4 py-4 max-w-4xl mx-auto">
    <BaseDialog
      v-model="state.storageDetails"
      :title="$t('admin.maintenance.storage-details')"
      :icon="$globals.icons.folderOutline"
    >
      <div class="px-4 py-2 divide-y divide-border">
        <div
          v-for="(value, key) in storageDetails"
          :key="key"
          class="flex items-center justify-between py-2"
        >
          <span class="text-sm text-on-surface">{{ storageDetailsText(key as string) }}</span>
          <span class="text-sm text-on-surface/60 text-right">{{ value }}</span>
        </div>
      </div>
    </BaseDialog>

    <BasePageTitle divider>
      <template #title>
        {{ $t("admin.maintenance.page-title") }}
      </template>
    </BasePageTitle>

    <!-- Summary section -->
    <section>
      <BaseCardSectionTitle class="pb-0" :icon="$globals.icons.wrench" :title="$t('admin.maintenance.summary-title')" />
      <div class="flex flex-wrap gap-2 mb-4">
        <BaseButton color="info" @click="getSummary">
          <template #icon>
            {{ $globals.icons.tools }}
          </template>
          {{ $t("admin.maintenance.button-label-get-summary") }}
        </BaseButton>
        <BaseButton color="info" @click="openDetails">
          <template #icon>
            {{ $globals.icons.folderOutline }}
          </template>
          {{ $t("admin.maintenance.button-label-open-details") }}
        </BaseButton>
      </div>

      <div class="rounded-xl border border-border bg-surface overflow-hidden relative">
        <div v-if="state.fetchingInfo" class="absolute top-0 left-0 right-0 h-1 bg-primary/20">
          <div class="h-full bg-primary animate-pulse w-full" />
        </div>
        <div class="divide-y divide-border">
          <div v-for="(item, idx) in info" :key="idx" class="flex items-center justify-between px-4 py-2">
            <span class="text-sm text-on-surface">{{ item.name }}</span>
            <span class="text-sm text-on-surface/60">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Actions section -->
    <section class="mt-8">
      <BaseCardSectionTitle
        class="pb-0"
        :icon="$globals.icons.wrench"
        :title="$t('admin.mainentance.actions-title')"
      >
        <i18n-t keypath="admin.maintenance.actions-description">
          <template #destructive_in_bold>
            <b>{{ $t("admin.maintenance.actions-description-destructive") }}</b>
          </template>
          <template #irreversible_in_bold>
            <b>{{ $t("admin.maintenance.actions-description-irreversible") }}</b>
          </template>
        </i18n-t>
      </BaseCardSectionTitle>

      <div class="rounded-xl border border-border bg-surface overflow-hidden relative">
        <div v-if="state.actionLoading" class="absolute top-0 left-0 right-0 h-1 bg-primary/20">
          <div class="h-full bg-primary animate-pulse w-full" />
        </div>
        <div class="divide-y divide-border">
          <div v-for="(action, idx) in actions" :key="idx" class="flex items-center justify-between px-4 py-3 gap-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-on-surface">{{ action.name }}</p>
              <p class="text-xs text-on-surface/60 mt-0.5 break-words">{{ action.subtitle }}</p>
            </div>
            <BaseButton color="info" @click="action.handler">
              <template #icon>
                {{ $globals.icons.robot }}
              </template>
              {{ $t("general.run") }}
            </BaseButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import type { MaintenanceStorageDetails, MaintenanceSummary } from "~/lib/api/types/admin";

definePageMeta({
  layout: "admin",
});

const state = reactive({
  storageDetails: false,
  storageDetailsLoading: false,
  fetchingInfo: false,
  actionLoading: false,
});

const adminApi = useAdminApi();
const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("admin.maintenance.page-title"),
});

const infoResults = ref<MaintenanceSummary>({
  dataDirSize: i18n.t("about.unknown-version"),
  cleanableDirs: 0,
  cleanableImages: 0,
});

async function getSummary() {
  state.fetchingInfo = true;
  const { data } = await adminApi.maintenance.getInfo();

  infoResults.value = data ?? {
    dataDirSize: i18n.t("about.unknown-version"),
    cleanableDirs: 0,
    cleanableImages: 0,
  };

  state.fetchingInfo = false;
}

const info = computed(() => {
  return [
    {
      name: i18n.t("admin.maintenance.info-description-data-dir-size"),
      value: infoResults.value.dataDirSize,
    },
    {
      name: i18n.t("admin.maintenance.info-description-cleanable-directories"),
      value: infoResults.value.cleanableDirs,
    },
    {
      name: i18n.t("admin.maintenance.info-description-cleanable-images"),
      value: infoResults.value.cleanableImages,
    },
  ];
});

const storageTitles: { [key: string]: string } = {
  tempDirSize: i18n.t("admin.maintenance.storage.title-temporary-directory") as string,
  backupsDirSize: i18n.t("admin.maintenance.storage.title-backups-directory") as string,
  groupsDirSize: i18n.t("admin.maintenance.storage.title-groups-directory") as string,
  recipesDirSize: i18n.t("admin.maintenance.storage.title-recipes-directory") as string,
  userDirSize: i18n.t("admin.maintenance.storage.title-user-directory") as string,
};

function storageDetailsText(key: string) {
  return storageTitles[key] ?? i18n.t("about.unknown-version");
}

const storageDetails = ref<MaintenanceStorageDetails | null>(null);

async function openDetails() {
  state.storageDetailsLoading = true;
  state.storageDetails = true;

  const { data } = await adminApi.maintenance.getStorageDetails();

  if (data) {
    storageDetails.value = data;
  }

  state.storageDetailsLoading = false;
}

async function handleCleanDirectories() {
  state.actionLoading = true;
  await adminApi.maintenance.cleanRecipeFolders();
  state.actionLoading = false;
}

async function handleCleanImages() {
  state.actionLoading = true;
  await adminApi.maintenance.cleanImages();
  state.actionLoading = false;
}

async function handleCleanTemp() {
  state.actionLoading = true;
  await adminApi.maintenance.cleanTemp();
  state.actionLoading = false;
}

const actions = [
  {
    name: i18n.t("admin.maintenance.action-clean-directories-name"),
    handler: handleCleanDirectories,
    subtitle: i18n.t("admin.maintenance.action-clean-directories-description"),
  },
  {
    name: i18n.t("admin.maintenance.action-clean-temporary-files-name"),
    handler: handleCleanTemp,
    subtitle: i18n.t("admin.maintenance.action-clean-temporary-files-description"),
  },
  {
    name: i18n.t("admin.maintenance.action-clean-images-name"),
    handler: handleCleanImages,
    subtitle: i18n.t("admin.maintenance.action-clean-images-description"),
  },
];
</script>
