<template>
  <div v-if="group" class="narrow-container mx-auto px-4 py-4">
    <BasePageTitle class="mb-5">
      <template #header>
        <img width="100" height="100" src="/svgs/manage-group-settings.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t("profile.group-settings") }}
      </template>
      {{ $t("profile.group-description") }}
    </BasePageTitle>

    <form @submit.prevent="handleSubmit">
      <div class="bs-card border border-border/40">
        <div class="bs-card-body">
          <GroupPreferencesEditor v-if="group.preferences" v-model="group.preferences" />
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
import GroupPreferencesEditor from "~/components/Domain/Group/GroupPreferencesEditor.vue";
import { useGroupSelf } from "~/composables/use-groups";
import { alert } from "~/composables/use-toast";

definePageMeta({
  middleware: ["can-manage-only"],
});

const { group, actions: groupActions } = useGroupSelf();
const i18n = useI18n();

useSeoMeta({ title: i18n.t("group.group") });

async function handleSubmit() {
  if (!group.value?.preferences) return;

  const data = await groupActions.updatePreferences();
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
