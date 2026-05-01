<template>
  <div v-if="household" class="px-4 py-4 max-w-3xl mx-auto">
    <BasePageTitle>
      <template #header>
        <img width="125" height="125" src="/svgs/manage-group-settings.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('household.admin-household-management') }}
      </template>
    </BasePageTitle>
    <AppToolbar back />

    <p class="text-sm text-on-surface/70 mb-4">{{ $t('household.household-id-value', [household.id]) }}</p>

    <form
      v-if="!userError"
      ref="refHouseholdEditForm"
      @submit.prevent="handleSubmit"
    >
      <div class="rounded-xl border border-border bg-surface">
        <div class="px-4 py-3 space-y-3">
          <div v-if="groups">
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.user-group') }}</label>
            <select
              v-model="household.groupId"
              disabled
              class="w-full rounded-lg border border-border bg-on-surface/5 px-3 py-2 text-sm text-on-surface/50 cursor-not-allowed"
            >
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('household.household-name') }}</label>
            <input
              v-model="household.name"
              type="text"
              required
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <HouseholdPreferencesEditor
            v-if="household.preferences"
            v-model="household.preferences"
          />
        </div>
      </div>

      <div class="flex justify-end mt-3">
        <BaseButton type="submit" edit>
          {{ $t("general.update") }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import HouseholdPreferencesEditor from "~/components/Domain/Household/HouseholdPreferencesEditor.vue";
import { useGroups } from "~/composables/use-groups";
import { useAdminApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { validators } from "~/composables/use-validators";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const i18n = useI18n();

const { groups } = useGroups();
const householdId = computed(() => route.params.id as string);

const refHouseholdEditForm = ref<HTMLFormElement | null>(null);

const adminApi = useAdminApi();

const userError = ref(false);

const { data: household } = useAsyncData(`get-household-${householdId.value}`, async () => {
  if (!householdId.value) {
    return null;
  }
  const { data, error } = await adminApi.households.getOne(householdId.value);

  if (error?.response?.status === 404) {
    alert.error(i18n.t("user.user-not-found"));
    userError.value = true;
  }
  return data;
}, { watch: [householdId] });

async function handleSubmit() {
  if (!(refHouseholdEditForm.value?.checkValidity() ?? false) || household.value === null) {
    return;
  }

  const { response, data } = await adminApi.households.updateOne(household.value.id, household.value);
  if (response?.status === 200 && data) {
    household.value = data;
    alert.success(i18n.t("settings.settings-updated"));
  }
  else {
    alert.error(i18n.t("settings.settings-update-failed"));
  }
}

// suppress unused import warning
void validators;
</script>
