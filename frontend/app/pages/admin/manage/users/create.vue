<template>
  <div class="px-4 py-4 max-w-3xl mx-auto">
    <BasePageTitle class="mb-2">
      <template #header>
        <img width="125" height="125" src="/svgs/manage-profile.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('user.admin-user-creation') }}
      </template>
    </BasePageTitle>
    <AppToolbar back />

    <form ref="refNewUserForm" @submit.prevent="handleSubmit">
      <div class="rounded-xl border border-border bg-surface">
        <div class="px-4 py-3 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.user-group') }}</label>
              <select
                v-model="selectedGroup"
                required
                class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option :value="undefined" disabled>{{ $t('group.user-group') }}</option>
                <option v-for="g in groups || []" :key="g.id" :value="g">{{ g.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('household.user-household') }}</label>
              <select
                v-model="newUserData.household"
                :disabled="!selectedGroup"
                required
                class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>{{ $t('household.user-household') }}</option>
                <option v-for="h in households" :key="h.id" :value="h.name">{{ h.name }}</option>
              </select>
              <p v-if="!selectedGroup" class="mt-0.5 text-xs text-on-surface/50">
                {{ $t('group.you-must-select-a-group-before-selecting-a-household') }}
              </p>
            </div>
          </div>

          <AutoForm
            v-model="newUserData"
            :items="userForm"
          />
        </div>
      </div>

      <div class="flex justify-end mt-3">
        <BaseButton type="submit" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import { useGroups } from "~/composables/use-groups";
import { useUserForm } from "~/composables/use-users";
import type { GroupInDB, UserIn } from "~/lib/api/types/user";

definePageMeta({
  layout: "admin",
});
const { userForm } = useUserForm();
const { groups } = useGroups();
const router = useRouter();

const refNewUserForm = ref<HTMLFormElement | null>(null);
const adminApi = useAdminApi();

const selectedGroup = ref<GroupInDB | undefined>(undefined);
const households = computed(() => selectedGroup.value?.households || []);

const newUserData = ref({
  username: "",
  fullName: "",
  email: "",
  admin: false,
  group: computed(() => selectedGroup.value?.name || ""),
  household: "",
  advanced: false,
  canInvite: false,
  canManage: false,
  canOrganize: false,
  password: "",
  authMethod: "Mealie",
});

async function handleSubmit() {
  if (!(refNewUserForm.value?.checkValidity() ?? false)) return;

  const { response } = await adminApi.users.createOne(newUserData.value as UserIn);

  if (response?.status === 201) {
    router.push("/admin/manage/users");
  }
}
</script>
