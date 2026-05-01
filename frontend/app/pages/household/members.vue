<template>
  <div class="container mx-auto px-4 py-4">
    <BasePageTitle divider>
      <template #header>
        <img width="125" height="125" src="/svgs/manage-members.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('group.manage-members') }}
      </template>
      <i18n-t keypath="group.manage-members-description">
        <template #manage><b>{{ $t('group.manage') }}</b></template>
        <template #invite><b>{{ $t('group.invite') }}</b></template>
      </i18n-t>
      <div class="mt-1">
        <NuxtLink class="text-center text-primary text-sm hover:underline" to="/user/profile/edit">
          {{ $t('group.looking-to-update-your-profile') }}
        </NuxtLink>
      </div>
    </BasePageTitle>

    <!-- Members table -->
    <div class="overflow-x-auto mt-4">
      <table class="w-full text-sm text-on-surface">
        <thead>
          <tr class="border-b border-border">
            <th class="py-3 px-2 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide w-12" />
            <th class="py-3 px-2 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('user.username') }}</th>
            <th class="py-3 px-2 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('user.full-name') }}</th>
            <th class="py-3 px-2 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('user.admin') }}</th>
            <th class="py-3 px-2 text-center text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('group.manage') }}</th>
            <th class="py-3 px-2 text-center text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('settings.organize') }}</th>
            <th class="py-3 px-2 text-center text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('group.invite') }}</th>
            <th class="py-3 px-2 text-center text-xs font-semibold text-on-surface/60 uppercase tracking-wide">{{ $t('group.manage-household') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in members"
            :key="item?.id"
            class="border-b border-border hover:bg-primary/5 transition-colors"
          >
            <td class="py-2 px-2">
              <UserAvatar v-if="item" :tooltip="false" :user-id="item.id" />
            </td>
            <td class="py-2 px-2">{{ item?.username }}</td>
            <td class="py-2 px-2">{{ item?.fullName }}</td>
            <td class="py-2 px-2">{{ item?.admin ? $t('user.admin') : $t('user.user') }}</td>
            <td class="py-2 px-2 text-center">
              <input
                v-if="item"
                v-model="item.canManage"
                type="checkbox"
                class="w-4 h-4 rounded border-border accent-primary"
                :disabled="item.id === sessionUser?.id || item.admin"
                @change="setPermissions(item)"
              />
            </td>
            <td class="py-2 px-2 text-center">
              <input
                v-if="item"
                v-model="item.canOrganize"
                type="checkbox"
                class="w-4 h-4 rounded border-border accent-primary"
                :disabled="item.id === sessionUser?.id || item.admin"
                @change="setPermissions(item)"
              />
            </td>
            <td class="py-2 px-2 text-center">
              <input
                v-if="item"
                v-model="item.canInvite"
                type="checkbox"
                class="w-4 h-4 rounded border-border accent-primary"
                :disabled="item.id === sessionUser?.id || item.admin"
                @change="setPermissions(item)"
              />
            </td>
            <td class="py-2 px-2 text-center">
              <input
                v-if="item"
                v-model="item.canManageHousehold"
                type="checkbox"
                class="w-4 h-4 rounded border-border accent-primary"
                :disabled="item.id === sessionUser?.id || item.admin"
                @change="setPermissions(item)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { UserOut } from "~/lib/api/types/user";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";

const api = useUserApi();
const i18n = useI18n();
const auth = useMealieAuth();
const sessionUser = computed(() => auth.user.value);

useSeoMeta({ title: i18n.t("profile.members") });

const members = ref<UserOut[] | null[]>([]);

async function refreshMembers() {
  const { data } = await api.households.fetchMembers();
  if (data) members.value = data.items;
}

async function setPermissions(user: UserOut) {
  await api.households.setMemberPermissions({
    userId:             user.id,
    canInvite:          user.canInvite,
    canManageHousehold: user.canManageHousehold,
    canManage:          user.canManage,
    canOrganize:        user.canOrganize,
  });
}

onMounted(async () => await refreshMembers());
</script>
