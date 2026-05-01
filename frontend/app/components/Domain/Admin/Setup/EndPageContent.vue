<template>
  <div class="max-w-[880px] mx-auto py-4 flex flex-col gap-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-on-surface">
        {{ $t('admin.setup.setup-complete') }}
      </h2>
      <p class="text-sm text-on-surface/60 mt-1">
        {{ $t('admin.setup.here-are-a-few-things-to-help-you-get-started') }}
      </p>
    </div>

    <div
      v-for="(section, idx) in sections"
      :key="idx"
      class="flex flex-col gap-3"
    >
      <h3 class="text-base font-semibold text-on-surface pl-0">
        {{ section.title }}
      </h3>
      <div class="flex flex-col gap-2">
        <a
          v-for="(link, linkIdx) in section.links"
          :key="linkIdx"
          :href="typeof link.to === 'string' ? link.to : link.to.value"
          class="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-on-surface/5 transition-colors"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="`bg-${section.color}/10 text-${section.color}`"
          >
            <AppIcon :path="link.icon" size="sm" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-on-surface">{{ link.text }}</p>
            <p class="text-xs text-on-surface/60 mt-0.5">{{ link.description }}</p>
          </div>
          <AppIcon :path="$globals.icons.chevronRight" size="sm" class="text-on-surface/40 flex-shrink-0" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const i18n = useI18n();
const auth = useMealieAuth();
const groupSlug = computed(() => auth.user.value?.groupSlug);
const { $globals } = useNuxtApp();

const sections = ref([
  {
    title: i18n.t("profile.data-migrations"),
    color: "info",
    links: [
      {
        icon: $globals.icons.backupRestore,
        to: "/admin/backups",
        text: i18n.t("settings.backup.backup-restore"),
        description: i18n.t("admin.setup.restore-from-v1-backup"),
      },
      {
        icon: $globals.icons.import,
        to: "/group/migrations",
        text: i18n.t("migration.recipe-migration"),
        description: i18n.t("migration.coming-from-another-application-or-an-even-older-version-of-mealie"),
      },
    ],
  },
  {
    title: i18n.t("recipe.create-recipes"),
    color: "success",
    links: [
      {
        icon: $globals.icons.createAlt,
        to: computed(() => `/g/${groupSlug.value || ""}/r/create/new`),
        text: i18n.t("recipe.create-recipe"),
        description: i18n.t("recipe.create-recipe-description"),
      },
      {
        icon: $globals.icons.link,
        to: computed(() => `/g/${groupSlug.value || ""}/r/create/url`),
        text: i18n.t("recipe.import-with-url"),
        description: i18n.t("recipe.scrape-recipe-description"),
      },
    ],
  },
  {
    title: i18n.t("user.manage-users"),
    color: "primary",
    links: [
      {
        icon: $globals.icons.group,
        to: "/admin/manage/users",
        text: i18n.t("user.manage-users"),
        description: i18n.t("user.manage-users-description"),
      },
      {
        icon: $globals.icons.user,
        to: "/user/profile",
        text: i18n.t("profile.manage-user-profile"),
        description: i18n.t("admin.setup.manage-profile-or-get-invite-link"),
      },
    ],
  },
]);
</script>
