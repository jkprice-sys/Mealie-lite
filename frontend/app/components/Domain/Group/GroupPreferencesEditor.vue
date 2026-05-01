<template>
  <div v-if="preferences">
    <BaseCardSectionTitle :title="$t('group.group-preferences')" />
    <div class="mb-6">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="local.privateGroup"
          type="checkbox"
          class="w-4 h-4 accent-primary rounded"
        />
        <span class="text-sm font-medium text-on-surface">{{ $t('group.private-group') }}</span>
      </label>
      <div class="ml-6 mt-1">
        <p class="text-xs text-on-surface/60 my-0 py-0">
          {{ $t("group.private-group-description") }}
        </p>
        <DocLink
          class="mt-2"
          link="/documentation/getting-started/faq/#how-do-private-groups-and-recipes-work"
        />
      </div>
    </div>
    <div class="mb-6">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="local.showAnnouncements"
          type="checkbox"
          class="w-4 h-4 accent-primary rounded"
        />
        <span class="text-sm font-medium text-on-surface">{{ $t('announcements.show-announcements-from-mealie') }}</span>
      </label>
      <div class="ml-6 mt-1">
        <p class="text-xs text-on-surface/60 my-0 py-0">
          {{ $t("announcements.show-announcements-setting-description") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReadGroupPreferences } from "~/lib/api/types/user";

const preferences = defineModel<ReadGroupPreferences>({ required: true });
const local = reactive({ ...preferences.value });
watch(local, (newVal) => { preferences.value = { ...newVal }; });
</script>
