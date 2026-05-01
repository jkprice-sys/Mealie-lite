<template>
  <div v-if="preferences">
    <BaseCardSectionTitle :title="$t('household.household-preferences')" />

    <!-- Simple boolean preferences -->
    <div class="space-y-4 mb-6">
      <div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="local.privateHousehold" type="checkbox" class="accent-primary" />
          <span class="text-sm font-medium text-on-surface">{{ $t('household.private-household') }}</span>
        </label>
        <div class="ml-6 mt-1">
          <p class="text-xs text-on-surface/60">{{ $t("household.private-household-description") }}</p>
          <DocLink class="mt-2" link="/documentation/getting-started/faq/#how-do-private-groups-and-recipes-work" />
        </div>
      </div>

      <div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="local.lockRecipeEditsFromOtherHouseholds" type="checkbox" class="accent-primary" />
          <span class="text-sm font-medium text-on-surface">{{ $t('household.lock-recipe-edits-from-other-households') }}</span>
        </label>
        <p class="ml-6 mt-1 text-xs text-on-surface/60">{{ $t("household.lock-recipe-edits-from-other-households-description") }}</p>
      </div>

      <div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="local.showAnnouncements" type="checkbox" class="accent-primary" />
          <span class="text-sm font-medium text-on-surface">{{ $t('announcements.show-announcements-from-mealie') }}</span>
        </label>
        <p class="ml-6 mt-1 text-xs text-on-surface/60">{{ $t("announcements.show-announcements-setting-description") }}</p>
      </div>
    </div>

    <!-- First day of week select -->
    <div class="mb-6 max-w-[300px]">
      <label class="block text-xs text-on-surface/60 mb-1">{{ $t('settings.first-day-of-week') }}</label>
      <div class="flex items-center gap-2">
        <AppIcon :path="$globals.icons.calendarWeekBegin" size="sm" class="text-on-surface/40 shrink-0" />
        <select
          v-model.number="local.firstDayOfWeek"
          class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        >
          <option v-for="day in allDays" :key="day.value" :value="day.value">{{ day.name }}</option>
        </select>
      </div>
    </div>

    <BaseCardSectionTitle class="mt-5" :title="$t('household.household-recipe-preferences')">
      {{ $t("household.default-recipe-preferences-description") }}
    </BaseCardSectionTitle>
    <div class="flex flex-col gap-3 max-w-[600px]">
      <div v-for="p in recipePreferences" :key="p.key">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="local[p.key]" type="checkbox" class="accent-primary" />
          <span class="text-sm font-medium text-on-surface">{{ p.label }}</span>
        </label>
        <p class="ml-6 mt-0.5 text-xs text-on-surface/60">{{ p.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReadHouseholdPreferences } from "~/lib/api/types/household";

const preferences = defineModel<ReadHouseholdPreferences>({ required: true });
const local = reactive({ ...preferences.value });
watch(local, (newVal) => { preferences.value = { ...newVal }; });

const i18n = useI18n();

type Preference = {
  key: keyof ReadHouseholdPreferences;
  label: string;
  description: string;
};

const recipePreferences: Preference[] = [
  {
    key: "recipePublic",
    label: i18n.t("group.allow-users-outside-of-your-group-to-see-your-recipes"),
    description: i18n.t("group.allow-users-outside-of-your-group-to-see-your-recipes-description"),
  },
  {
    key: "recipeShowNutrition",
    label: i18n.t("group.show-nutrition-information"),
    description: i18n.t("group.show-nutrition-information-description"),
  },
  {
    key: "recipeShowAssets",
    label: i18n.t("group.show-recipe-assets"),
    description: i18n.t("group.show-recipe-assets-description"),
  },
  {
    key: "recipeLandscapeView",
    label: i18n.t("group.default-to-landscape-view"),
    description: i18n.t("group.default-to-landscape-view-description"),
  },
  {
    key: "recipeDisableComments",
    label: i18n.t("group.disable-users-from-commenting-on-recipes"),
    description: i18n.t("group.disable-users-from-commenting-on-recipes-description"),
  },
];

const allDays = [
  {
    name: i18n.t("general.sunday"),
    value: 0,
  },
  {
    name: i18n.t("general.monday"),
    value: 1,
  },
  {
    name: i18n.t("general.tuesday"),
    value: 2,
  },
  {
    name: i18n.t("general.wednesday"),
    value: 3,
  },
  {
    name: i18n.t("general.thursday"),
    value: 4,
  },
  {
    name: i18n.t("general.friday"),
    value: 5,
  },
  {
    name: i18n.t("general.saturday"),
    value: 6,
  },
];
</script>

<style lang="css">
.preference-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 600px;
}
</style>
