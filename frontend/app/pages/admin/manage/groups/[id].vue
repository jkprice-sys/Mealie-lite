<template>
  <div v-if="group" class="px-4 py-4 max-w-3xl mx-auto">
    <BasePageTitle>
      <template #header>
        <img width="125" height="125" src="/svgs/manage-group-settings.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('group.admin-group-management') }}
      </template>
    </BasePageTitle>
    <AppToolbar back />

    <p class="text-sm text-on-surface/70 mb-4">{{ $t('group.group-id-value', [group.id]) }}</p>

    <form
      v-if="!userError"
      ref="refGroupEditForm"
      @submit.prevent="handleSubmit"
    >
      <div class="rounded-xl border border-border bg-surface">
        <div class="px-4 py-3 space-y-3">
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.group-name') }}</label>
            <input
              v-model="group.name"
              type="text"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <GroupPreferencesEditor
            v-if="group.preferences"
            v-model="group.preferences"
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
import GroupPreferencesEditor from "~/components/Domain/Group/GroupPreferencesEditor.vue";
import { useAdminApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";

definePageMeta({
  layout: "admin",
});
const route = useRoute();

const i18n = useI18n();

const groupId = computed(() => route.params.id as string);

const refGroupEditForm = ref<HTMLFormElement | null>(null);

const adminApi = useAdminApi();

const userError = ref(false);

const { data: group } = useLazyAsyncData(`get-household-${groupId.value}`, async () => {
  if (!groupId.value) {
    return null;
  }
  const { data, error } = await adminApi.groups.getOne(groupId.value);

  if (error?.response?.status === 404) {
    alert.error(i18n.t("user.user-not-found"));
    userError.value = true;
  }
  return data;
}, { watch: [groupId] });

async function handleSubmit() {
  if (!(refGroupEditForm.value?.checkValidity() ?? false) || group.value === null) {
    return;
  }

  const { response, data } = await adminApi.groups.updateOne(group.value.id, group.value);
  if (response?.status === 200 && data) {
    if (group.value.slug !== data.slug) {
      window.location.reload();
    }
    group.value = data;
    alert.success(i18n.t("settings.settings-updated"));
  }
  else {
    alert.error(i18n.t("settings.settings-update-failed"));
  }
}
</script>
