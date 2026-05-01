<template>
  <div v-if="household" class="narrow-container mx-auto px-4 py-4">
    <BasePageTitle class="mb-5">
      <template #header>
        <img width="100" height="100" src="/svgs/manage-group-settings.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t("profile.household-settings") }}
      </template>
      {{ $t("profile.household-description") }}
    </BasePageTitle>

    <form @submit.prevent="handleSubmit">
      <div class="bs-card border border-border/40">
        <div class="bs-card-body">
          <HouseholdPreferencesEditor v-if="household.preferences" v-model="household.preferences" />
        </div>
      </div>
      <div class="flex justify-end p-2">
        <BaseButton type="submit" edit>
          {{ $t("general.update") }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import HouseholdPreferencesEditor from "~/components/Domain/Household/HouseholdPreferencesEditor.vue";
import { useHouseholdSelf } from "~/composables/use-households";
import { alert } from "~/composables/use-toast";

definePageMeta({
  middleware: ["can-manage-household-only"],
});

const { household, actions: householdActions } = useHouseholdSelf();
const i18n = useI18n();

useSeoMeta({ title: i18n.t("household.household") });

async function handleSubmit() {
  if (!household.value?.preferences) return;

  const data = await householdActions.updatePreferences();
  if (data) {
    alert.success(i18n.t("settings.settings-updated"));
  }
  else {
    alert.error(i18n.t("settings.settings-update-failed"));
  }
}
</script>

<style>
.preference-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 600px;
}
</style>
