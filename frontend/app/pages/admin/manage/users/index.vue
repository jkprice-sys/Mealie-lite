<template>
  <div class="px-4 py-4">
    <UserInviteDialog v-model="inviteDialog" />
    <BaseDialog
      v-model="state.deleteDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteUser(state.deleteTargetId)"
    >
      <template #activator />
      <div class="px-4 py-3 space-y-2">
        <div
          v-if="isUserOwnAccount"
          class="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
        >
          {{ $t('general.confirm-delete-own-admin-account') }}
        </div>
        <p class="text-sm text-on-surface">{{ $t("general.confirm-delete-generic") }}</p>
      </div>
    </BaseDialog>

    <BaseCardSectionTitle :title="$t('user.user-management')" />

    <section>
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <BaseButton to="/admin/manage/users/create">
          {{ $t("general.create") }}
        </BaseButton>
        <BaseButton
          v-if="$appInfo.allowPasswordLogin"
          color="info"
          :icon="$globals.icons.link"
          @click="inviteDialog = true"
        >
          {{ $t("group.invite") }}
        </BaseButton>
        <BaseOverflowButton
          mode="event"
          variant="elevated"
          :items="ACTIONS_OPTIONS"
          @unlock-all-users="unlockAllUsers"
        />
      </div>

      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full text-sm text-on-surface">
          <thead>
            <tr class="border-b border-border bg-surface">
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.user-id') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.username') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.full-name') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.email') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('group.group') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('household.household') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.auth-method') }}</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">{{ $t('user.admin') }}</th>
              <th class="px-3 py-2 text-center font-medium text-on-surface/60">{{ $t('general.delete') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users || []"
              :key="u.id"
              class="border-b border-border hover:bg-primary/5 cursor-pointer transition-colors"
              @click="handleRowClick(u)"
            >
              <td class="px-3 py-2 text-xs text-on-surface/60">{{ u.id }}</td>
              <td class="px-3 py-2">{{ u.username }}</td>
              <td class="px-3 py-2">{{ u.fullName }}</td>
              <td class="px-3 py-2">{{ u.email }}</td>
              <td class="px-3 py-2">{{ u.group }}</td>
              <td class="px-3 py-2">{{ u.household }}</td>
              <td class="px-3 py-2">{{ u.authMethod }}</td>
              <td class="px-3 py-2">
                <AppIcon
                  :path="u.admin ? $globals.icons.checkboxMarkedCircle : $globals.icons.windowClose"
                  size="sm"
                  :class="u.admin ? 'text-success' : 'text-on-surface/40'"
                />
              </td>
              <td class="px-3 py-2 text-center">
                <button
                  type="button"
                  :disabled="+u.id == 1"
                  class="p-1 rounded text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  @click.stop="state.deleteDialog = true; state.deleteTargetId = u.id"
                >
                  <AppIcon :path="$globals.icons.delete" size="sm" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <hr class="border-border mt-2" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useUser, useAllUsers } from "~/composables/use-user";
import type { UserOut } from "~/lib/api/types/user";
import UserInviteDialog from "~/components/Domain/User/UserInviteDialog.vue";

definePageMeta({
  layout: "admin",
});
const i18n = useI18n();

useHead({
  title: i18n.t("sidebar.manage-users"),
});

const api = useAdminApi();
const inviteDialog = ref();
const auth = useMealieAuth();

const user = computed(() => auth.user.value);

const { $globals } = useNuxtApp();

const router = useRouter();

const isUserOwnAccount = computed(() => {
  return state.deleteTargetId === user.value?.id;
});

const ACTIONS_OPTIONS = [
  {
    text: i18n.t("user.reset-locked-users"),
    icon: $globals.icons.lock,
    event: "unlock-all-users",
  },
];

const state = reactive({
  deleteDialog: false,
  deleteTargetId: "",
  search: "",
  groups: [],
  households: [],
  sendTo: "",
});

const { users, refreshAllUsers } = useAllUsers();
const { deleteUser: deleteUserMixin } = useUser(refreshAllUsers);

function deleteUser(id: string) {
  deleteUserMixin(id);

  if (isUserOwnAccount.value) {
    auth.refresh();
  }
}

function handleRowClick(item: UserOut) {
  router.push(`/admin/manage/users/${item.id}`);
}

async function unlockAllUsers(): Promise<void> {
  const { data } = await api.users.unlockAllUsers(true);

  if (data) {
    const unlocked = data.unlocked ?? 0;

    alert.success(`${unlocked} user(s) unlocked`);
    refreshAllUsers();
  }
}

useSeoMeta({
  title: i18n.t("sidebar.manage-users"),
});
</script>
