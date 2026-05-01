<template>
  <BaseDialog
    v-model="inviteDialog"
    :title="$t('profile.get-invite-link')"
    :icon="$globals.icons.accountPlusOutline"
    color="primary"
  >
    <div class="px-4 py-3 space-y-3">
      <!-- Group select (admin only) -->
      <div v-if="groups && groups.length">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.user-group') }}</label>
        <select
          v-model="selectedGroup"
          required
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        >
          <option value="" disabled>{{ $t('group.user-group') }}</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>

      <!-- Household select (admin only) -->
      <div v-if="households && households.length">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('household.user-household') }}</label>
        <select
          v-model="selectedHousehold"
          required
          :disabled="!selectedGroup"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50"
        >
          <option value="" disabled>{{ $t('household.user-household') }}</option>
          <option v-for="h in filteredHouseholds" :key="h.id" :value="h.id">{{ h.name }}</option>
        </select>
      </div>

      <!-- Generated link -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('profile.invite-link') }}</label>
        <div class="flex items-center gap-2">
          <input
            :value="generatedSignupLink"
            type="text"
            readonly
            class="flex-1 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm text-on-surface/70
                   focus:outline-none"
          />
          <AppButtonCopy
            :icon="false"
            color="info"
            :copy-text="generatedSignupLink"
            :disabled="!generatedSignupLink"
          />
        </div>
      </div>

      <!-- Email field -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.email') }}</label>
        <input
          v-model="sendTo"
          type="email"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          @keydown.enter="sendInvite"
        />
      </div>
    </div>

    <template #custom-card-action>
      <BaseButton
        :disabled="!validEmail"
        :loading="loading"
        :icon="$globals.icons.email"
        @click="sendInvite"
      >
        {{ $t("group.invite") }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useUserApi } from "@/composables/api";
import BaseDialog from "~/components/global/BaseDialog.vue";
import AppButtonCopy from "~/components/global/AppButtonCopy.vue";
import BaseButton from "~/components/global/BaseButton.vue";
import { validators } from "~/composables/use-validators";
import { alert } from "~/composables/use-toast";
import type { GroupInDB } from "~/lib/api/types/user";
import type { HouseholdInDB } from "~/lib/api/types/household";
import { useGroups } from "~/composables/use-groups";
import { useAdminHouseholds } from "~/composables/use-households";

const inviteDialog = defineModel<boolean>("modelValue", { type: Boolean, default: false });

const i18n = useI18n();
const { $globals } = useNuxtApp();
const auth = useMealieAuth();

const isAdmin = computed(() => auth.user.value?.admin);
const token = ref("");
const selectedGroup = ref<string | null>(null);
const selectedHousehold = ref<string | null>(null);
const groups = ref<GroupInDB[]>([]);
const households = ref<HouseholdInDB[]>([]);
const api = useUserApi();

const fetchGroupsAndHouseholds = () => {
  if (isAdmin.value) {
    const groupsResponse = useGroups();
    const householdsResponse = useAdminHouseholds();
    watchEffect(() => {
      groups.value = groupsResponse.groups.value || [];
      households.value = householdsResponse.households.value || [];
    });
  }
};

async function getSignupLink(group: string | null = null, household: string | null = null) {
  const payload = (group && household) ? { uses: 1, group_id: group, household_id: household } : { uses: 1 };
  const { data } = await api.households.createInvitation(payload);
  if (data) {
    token.value = data.token;
  }
}

const filteredHouseholds = computed(() => {
  if (!selectedGroup.value) return [];
  return households.value?.filter(household => household.groupId === selectedGroup.value);
});

function constructLink(tokenVal: string) {
  return tokenVal ? `${window.location.origin}/register?token=${tokenVal}` : "";
}

const generatedSignupLink = computed(() => constructLink(token.value));

// Email Invitation
const state = reactive({
  loading: false,
  sendTo: "",
});
const { loading, sendTo } = toRefs(state);

async function sendInvite() {
  state.loading = true;
  if (!token.value) {
    getSignupLink(selectedGroup.value, selectedHousehold.value);
  }
  const { data } = await api.email.sendInvitation({
    email: state.sendTo,
    token: token.value,
  });

  if (data && data.success) {
    alert.success(i18n.t("profile.email-sent"));
  }
  else {
    alert.error(i18n.t("profile.error-sending-email"));
  }
  state.loading = false;
  inviteDialog.value = false;
}

const validEmail = computed(() => {
  if (sendTo.value === "") return false;
  const valid = validators.email(sendTo.value);
  return valid === true;
});

// Watchers (replacing options API watchers)
watch(inviteDialog, (val) => {
  if (val && !isAdmin.value) {
    getSignupLink();
  }
});

watch(selectedHousehold, (newVal) => {
  if (newVal && selectedGroup.value) {
    getSignupLink(selectedGroup.value, selectedHousehold.value);
  }
});

// initial fetch
fetchGroupsAndHouseholds();
</script>
