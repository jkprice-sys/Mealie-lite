<template>
  <div v-if="user" class="px-4 py-4 max-w-3xl mx-auto">
    <BasePageTitle>
      <template #header>
        <img width="125" height="125" src="/svgs/manage-profile.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t("user.admin-user-management") }}
      </template>
      {{ $t("user.changes-reflected-immediately") }}
    </BasePageTitle>
    <AppToolbar back />

    <form
      v-if="!userError"
      ref="refNewUserForm"
      @submit.prevent="handleSubmit"
    >
      <div class="rounded-xl border border-border bg-surface">
        <div class="px-4 pt-4 pb-3 space-y-3">
          <p class="text-sm text-on-surface/70">{{ $t("user.user-id-with-value", { id: user.id }) }}</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-if="groups">
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.user-group') }}</label>
              <select
                v-model="user.group"
                disabled
                class="w-full rounded-lg border border-border bg-on-surface/5 px-3 py-2 text-sm text-on-surface/50 cursor-not-allowed"
              >
                <option v-for="g in groups" :key="g.id" :value="g.name">{{ g.name }}</option>
              </select>
            </div>
            <div v-if="households">
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('household.user-household') }}</label>
              <select
                v-model="user.household"
                required
                class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option v-for="h in households" :key="h.id" :value="h.name">{{ h.name }}</option>
              </select>
            </div>
          </div>

          <div class="py-1">
            <BaseButton
              type="button"
              :loading="generatingToken"
              create
              @click.prevent="handlePasswordReset"
            >
              {{ $t("user.generate-password-reset-link") }}
            </BaseButton>
          </div>

          <!-- Reset URL section -->
          <div v-if="resetUrl" class="rounded-lg border border-border bg-background p-3 space-y-2">
            <p class="text-sm text-center break-all text-on-surface">{{ resetUrl }}</p>
            <div class="flex items-center gap-2 justify-end">
              <BaseButton cancel @click="resetUrl = ''">
                {{ $t("general.close") }}
              </BaseButton>
              <BaseButton
                v-if="user.email"
                color="info"
                @click="sendResetEmail"
              >
                <template #icon>
                  {{ $globals.icons.email }}
                </template>
                {{ $t("user.email") }}
              </BaseButton>
              <AppButtonCopy :icon="false" color="info" :copy-text="resetUrl" />
            </div>
          </div>

          <AutoForm
            v-model="user"
            :items="userForm"
            update-mode
            :disabled-fields="disabledFields"
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
import { useAdminApi, useUserApi } from "~/composables/api";
import { useGroups } from "~/composables/use-groups";
import { useAdminHouseholds } from "~/composables/use-households";
import { alert } from "~/composables/use-toast";
import { useUserForm } from "~/composables/use-users";
import type { UserOut } from "~/lib/api/types/user";

definePageMeta({
  layout: "admin",
});

const { userForm } = useUserForm();
const { groups } = useGroups();
const { useHouseholdsInGroup } = useAdminHouseholds();
const i18n = useI18n();
const route = useRoute();
const { $globals } = useNuxtApp();

const userId = route.params.id as string;

const refNewUserForm = ref<HTMLFormElement | null>(null);

const adminApi = useAdminApi();

const user = ref<UserOut | null>(null);
const households = useHouseholdsInGroup(computed(() => user.value?.groupId || ""));

const disabledFields = computed(() => {
  return user.value?.authMethod !== "Mealie" ? ["admin"] : [];
});

const userError = ref(false);

const resetUrl = ref<string | null>(null);
const generatingToken = ref(false);

onMounted(async () => {
  const { data, error } = await adminApi.users.getOne(userId);

  if (error?.response?.status === 404) {
    alert.error(i18n.t("user.user-not-found"));
    userError.value = true;
  }

  if (data) {
    user.value = data;
  }
});

async function handleSubmit() {
  if (!(refNewUserForm.value?.checkValidity() ?? false) || user.value === null) return;

  const { response, data } = await adminApi.users.updateOne(user.value.id, user.value);

  if (response?.status === 200 && data) {
    user.value = data;
  }
}

async function handlePasswordReset() {
  if (user.value === null) return;
  generatingToken.value = true;

  const { response, data } = await adminApi.users.generatePasswordResetToken({ email: user.value.email });

  if (response?.status === 201 && data) {
    const token: string = data.token;
    resetUrl.value = `${window.location.origin}/reset-password/?token=${token}`;
  }

  generatingToken.value = false;
}

const userApi = useUserApi();
async function sendResetEmail() {
  if (!user.value?.email) return;
  const { response } = await userApi.email.sendForgotPassword({ email: user.value.email });
  if (response && response.status === 200) {
    alert.success(i18n.t("profile.email-sent"));
  }
  else {
    alert.error(i18n.t("profile.error-sending-email"));
  }
}
</script>
