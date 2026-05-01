<template>
  <div v-if="user" class="container mx-auto px-4 pb-8">
    <!-- Header: avatar + welcome -->
    <section class="flex flex-col items-center mt-4">
      <UserAvatar :tooltip="false" size="96" :user-id="user.id" />
      <h2 class="text-3xl font-semibold text-center mt-3">
        {{ $t('profile.welcome-user', [user.fullName]) }}
      </h2>
      <p class="text-base mb-0 text-center text-on-surface/70">
        {{ $t('profile.description') }}
      </p>
      <div class="flex justify-center my-4 w-full max-w-lg">
        <button
          v-if="user.canInvite"
          type="button"
          class="bs-btn bs-btn-md bs-btn-outline rounded-lg"
          @click="inviteDialog = true"
        >
          <AppIcon :path="$globals.icons.createAlt" size="sm" />
          {{ $t('profile.get-invite-link') }}
        </button>
      </div>
      <UserInviteDialog v-model="inviteDialog" />
    </section>

    <!-- Account summary / stats -->
    <section class="my-3">
      <div>
        <h3 class="text-xl font-semibold">{{ $t('profile.account-summary') }}</h3>
        <p class="text-sm text-on-surface/70">{{ $t('profile.account-summary-description') }}</p>
      </div>
      <div class="bs-card mt-4 border border-border/40">
        <div class="bs-card-header">
          <span class="text-lg font-semibold">{{ $t('profile.household-statistics') }}</span>
        </div>
        <p class="text-sm text-on-surface/60 px-4 pb-2">{{ $t('profile.household-statistics-description') }}</p>
        <div class="flex flex-wrap justify-center items-center gap-3 px-4 pb-4">
          <StatsCards
            v-for="(value, key) in stats"
            :key="`${key}-${value}`"
            :icon="getStatsIcon(key)"
            :to="getStatsTo(key)"
          >
            <template #title>{{ getStatsTitle(key) }}</template>
            <template #value>{{ value }}</template>
          </StatsCards>
        </div>
      </div>
    </section>

    <hr class="border-border my-7" />

    <!-- Personal section -->
    <section>
      <div>
        <h3 class="text-lg font-semibold">{{ $t('profile.personal') }}</h3>
        <p class="text-sm text-on-surface/70">{{ $t('profile.personal-description') }}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <UserProfileLinkCard
          :link="{ text: $t('profile.manage-user-profile'), to: `/user/profile/edit` }"
          image="/svgs/manage-profile.svg"
        >
          <template #title>{{ $t('profile.user-settings') }}</template>
          {{ $t('profile.user-settings-description') }}
        </UserProfileLinkCard>
        <AdvancedOnly>
          <UserProfileLinkCard
            :link="{ text: $t('profile.manage-your-api-tokens'), to: `/user/profile/api-tokens` }"
            image="/svgs/manage-api-tokens.svg"
          >
            <template #title>{{ $t('settings.token.api-tokens') }}</template>
            {{ $t('profile.api-tokens-description') }}
          </UserProfileLinkCard>
        </AdvancedOnly>
      </div>
    </section>

    <hr class="border-border my-7" />

    <!-- Household section -->
    <section>
      <div>
        <h3 class="text-lg font-semibold">{{ $t('household.household') }}</h3>
        <p class="text-sm text-on-surface/70">{{ $t('profile.household-description') }}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <UserProfileLinkCard
          v-if="user.canManageHousehold"
          :link="{ text: $t('profile.household-settings'), to: `/household` }"
          image="/svgs/manage-group-settings.svg"
        >
          <template #title>{{ $t('profile.household-settings') }}</template>
          {{ $t('profile.household-settings-description') }}
        </UserProfileLinkCard>
        <UserProfileLinkCard
          :link="{ text: $t('profile.manage-cookbooks'), to: `/g/${groupSlug}/cookbooks` }"
          image="/svgs/manage-cookbooks.svg"
        >
          <template #title>{{ $t('sidebar.cookbooks') }}</template>
          {{ $t('profile.cookbooks-description') }}
        </UserProfileLinkCard>
        <UserProfileLinkCard
          v-if="user.canManage"
          :link="{ text: $t('profile.manage-members'), to: `/household/members` }"
          image="/svgs/manage-members.svg"
        >
          <template #title>{{ $t('profile.members') }}</template>
          {{ $t('profile.members-description') }}
        </UserProfileLinkCard>
        <AdvancedOnly>
          <UserProfileLinkCard
            v-if="user.advanced"
            :link="{ text: $t('profile.manage-webhooks'), to: `/household/webhooks` }"
            image="/svgs/manage-webhooks.svg"
          >
            <template #title>{{ $t('settings.webhooks.webhooks') }}</template>
            {{ $t('profile.webhooks-description') }}
          </UserProfileLinkCard>
        </AdvancedOnly>
        <AdvancedOnly>
          <UserProfileLinkCard
            :link="{ text: $t('profile.manage-notifiers'), to: `/household/notifiers` }"
            image="/svgs/manage-notifiers.svg"
          >
            <template #title>{{ $t('profile.notifiers') }}</template>
            {{ $t('profile.notifiers-description') }}
          </UserProfileLinkCard>
        </AdvancedOnly>
      </div>
    </section>

    <hr class="border-border my-7" />

    <!-- Group section -->
    <section v-if="user.canManage || user.canOrganize || user.advanced">
      <div>
        <h3 class="text-lg font-semibold">{{ $t('group.group') }}</h3>
        <p class="text-sm text-on-surface/70">{{ $t('profile.group-description') }}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <UserProfileLinkCard
          v-if="user.canManage"
          :link="{ text: $t('profile.group-settings'), to: `/group` }"
          image="/svgs/manage-group-settings.svg"
        >
          <template #title>{{ $t('profile.group-settings') }}</template>
          {{ $t('profile.group-settings-description') }}
        </UserProfileLinkCard>
        <UserProfileLinkCard
          v-if="user.canOrganize"
          :link="{ text: $t('profile.manage-data'), to: `/group/data/foods` }"
          image="/svgs/manage-recipes.svg"
        >
          <template #title>{{ $t('profile.manage-data') }}</template>
          {{ $t('profile.manage-data-description') }}
        </UserProfileLinkCard>
        <AdvancedOnly>
          <UserProfileLinkCard
            :link="{ text: $t('profile.manage-data-migrations'), to: `/group/migrations` }"
            image="/svgs/manage-data-migrations.svg"
          >
            <template #title>{{ $t('profile.data-migrations') }}</template>
            {{ $t('profile.data-migrations-description') }}
          </UserProfileLinkCard>
        </AdvancedOnly>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import UserProfileLinkCard from "@/components/Domain/User/UserProfileLinkCard.vue";
import { useUserApi } from "~/composables/api";
import UserAvatar from "@/components/Domain/User/UserAvatar.vue";
import { useAsyncKey } from "~/composables/use-utils";
import StatsCards from "~/components/global/StatsCards.vue";
import type { UserOut } from "~/lib/api/types/user";
import UserInviteDialog from "~/components/Domain/User/UserInviteDialog.vue";

definePageMeta({
  name: "UserProfile",
  scrollToTop: true,
});

const i18n = useI18n();
const auth = useMealieAuth();
const { $appInfo, $globals } = useNuxtApp();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");

useSeoMeta({ title: i18n.t("settings.profile") });

const user = computed<UserOut | null>(() => {
  const authUser = auth.user.value;
  if (!authUser) return null;
  const canInvite = !$appInfo.allowPasswordLogin ? false : authUser.canInvite;
  return { ...authUser, canInvite };
});

const inviteDialog = ref(false);
const api = useUserApi();

const { data: stats } = useAsyncData(useAsyncKey(), async () => {
  const { data } = await api.households.statistics();
  return data ?? undefined;
});

const statsText: Record<string, string> = {
  totalRecipes:    i18n.t("general.recipes"),
  totalUsers:      i18n.t("user.users"),
  totalCategories: i18n.t("sidebar.categories"),
  totalTags:       i18n.t("sidebar.tags"),
  totalTools:      i18n.t("tool.tools"),
};

function getStatsTitle(key: string) { return statsText[key] ?? "unknown"; }

const iconText: Record<string, string> = {
  totalUsers:      $globals.icons.user,
  totalCategories: $globals.icons.categories,
  totalTags:       $globals.icons.tags,
  totalTools:      $globals.icons.potSteam,
};

function getStatsIcon(key: string) { return iconText[key] ?? $globals.icons.primary; }

const statsTo = computed<Record<string, string>>(() => ({
  totalRecipes:    `/g/${groupSlug.value}/`,
  totalUsers:      "/household/members",
  totalCategories: `/g/${groupSlug.value}/recipes/categories`,
  totalTags:       `/g/${groupSlug.value}/recipes/tags`,
  totalTools:      `/g/${groupSlug.value}/recipes/tools`,
}));

function getStatsTo(key: string) { return statsTo.value[key] ?? "unknown"; }
</script>
