<template>
  <div class="px-4 py-4 max-w-4xl mx-auto">
    <BasePageTitle divider>
      <template #header>
        <img width="150" height="150" src="/svgs/admin-site-settings.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t("settings.site-settings") }}
      </template>
    </BasePageTitle>

    <!-- Bug Report Dialog -->
    <BaseDialog
      v-model="bugReportDialog"
      :title="$t('settings.bug-report')"
      :icon="$globals.icons.github"
    >
      <div class="px-4 py-3 space-y-3">
        <p class="text-sm text-on-surface/70">{{ $t('settings.bug-report-information') }}</p>
        <textarea
          v-model="bugReportText"
          rows="18"
          readonly
          class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-on-surface font-mono focus:outline-none resize-none"
        />
        <div class="flex justify-end gap-2">
          <BaseButton
            color="gray"
            secondary
            target="_blank"
            href="https://github.com/mealie-recipes/mealie/issues/new/choose"
          >
            <template #icon>
              {{ $globals.icons.github }}
            </template>
            {{ $t('settings.tracker') }}
          </BaseButton>
          <AppButtonCopy :copy-text="bugReportText" color="info" :icon="false" />
        </div>
      </div>
    </BaseDialog>

    <div class="flex justify-end mb-4">
      <BaseButton color="info" @click="bugReportDialog = true">
        <template #icon>
          {{ $globals.icons.github }}
        </template>
        {{ $t('settings.bug-report') }}
      </BaseButton>
    </div>

    <!-- Configuration section -->
    <section>
      <BaseCardSectionTitle class="pb-0" :icon="$globals.icons.cog" :title="$t('settings.configuration')" />
      <div class="rounded-xl border border-border bg-surface mb-4 divide-y divide-border">
        <div
          v-for="(check, idx) in simpleChecks"
          :key="`check-${idx}`"
          class="flex items-start gap-3 px-4 py-3"
        >
          <AppIcon
            :path="check.icon"
            size="sm"
            :class="check.color === 'success' ? 'text-success' : check.color === 'error' ? 'text-error' : 'text-warning'"
            class="flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-on-surface">{{ check.text }}</p>
            <p class="text-xs text-on-surface/60 mt-0.5 break-words">
              {{ check.status ? check.successText : check.errorText }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Email section -->
    <section>
      <BaseCardSectionTitle class="pt-2" :icon="$globals.icons.email" :title="$t('user.email')" />
      <div
        class="rounded-xl border bg-surface p-4 mb-4"
        :class="appConfig.emailReady ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error'"
      >
        <div class="flex items-start gap-3 mb-3">
          <AppIcon
            :path="appConfig.emailReady ? $globals.icons.checkboxMarkedCircle : $globals.icons.alertCircle"
            size="sm"
            :class="appConfig.emailReady ? 'text-success' : 'text-warning'"
            class="flex-shrink-0 mt-0.5"
          />
          <div>
            <p class="text-sm font-medium text-on-surface">{{ $t('settings.email-configuration-status') }}</p>
            <p class="text-xs text-on-surface/60">
              {{ appConfig.emailReady ? $t('settings.ready') : $t('settings.not-ready') }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.email') }}</label>
            <input
              v-model="state.address"
              type="email"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <BaseButton
            color="info"
            :disabled="!appConfig.emailReady || !validEmail"
            :loading="state.loading"
            @click="testEmail"
          >
            <template #icon>
              {{ $globals.icons.email }}
            </template>
            {{ $t("general.test") }}
          </BaseButton>
        </div>

        <template v-if="state.tested">
          <hr class="border-border my-4" />
          <div>
            <h4 class="text-sm font-medium text-on-surface">{{ $t("settings.email-test-results") }}</h4>
            <p class="text-sm text-on-surface/70 pl-4 mt-1">
              {{ state.success ? $t('settings.succeeded') : $t('settings.failed') }}
            </p>
          </div>
        </template>
      </div>
    </section>

    <!-- General App Info section -->
    <section class="mt-4">
      <BaseCardSectionTitle class="pb-0" :icon="$globals.icons.cog" :title="$t('settings.general-about')" />
      <div class="rounded-xl border border-border bg-surface mb-4">
        <template v-if="appInfo && appInfo.length">
          <div
            v-for="(property, idx) in appInfo"
            :key="property.name"
            class="flex items-start gap-3 px-4 py-3"
            :class="{ 'border-t border-border': idx > 0 }"
          >
            <AppIcon
              :path="property.icon || $globals.icons.user"
              size="sm"
              class="flex-shrink-0 mt-0.5 text-on-surface/60"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-on-surface">{{ property.name }}</p>
              <div class="text-xs text-on-surface/60 mt-0.5 break-all">
                <template v-if="property.slot === 'recipe-scraper'">
                  <a
                    class="text-primary hover:underline"
                    target="_blank"
                    :href="`https://github.com/hhursev/recipe-scrapers/releases/tag/${property.value}`"
                  >{{ property.value }}</a>
                </template>
                <template v-else-if="property.slot === 'build'">
                  <a
                    class="text-primary hover:underline"
                    target="_blank"
                    :href="`https://github.com/mealie-recipes/mealie/commit/${property.value}`"
                  >{{ property.value }}</a>
                </template>
                <template v-else-if="property.slot === 'version' && property.value !== 'develop' && property.value !== 'nightly'">
                  <a
                    class="text-primary hover:underline"
                    target="_blank"
                    :href="`https://github.com/mealie-recipes/mealie/releases/tag/${property.value}`"
                  >{{ property.value }}</a>
                </template>
                <template v-else>
                  {{ property.value }}
                </template>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="py-6 text-center">
            <AppLoader :waiting-text="$t('general.loading')" />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { TranslateResult } from "vue-i18n";
import { useAdminApi, useUserApi } from "~/composables/api";
import { validators } from "~/composables/use-validators";
import { useAsyncKey } from "~/composables/use-utils";
import type { CheckAppConfig } from "~/lib/api/types/admin";
import AppLoader from "~/components/global/AppLoader.vue";

interface SimpleCheck {
  id: string;
  text: TranslateResult;
  status: boolean | undefined;
  successText: TranslateResult;
  errorText: TranslateResult;
  color: string;
  icon: string;
}

interface CheckApp extends CheckAppConfig {
  isSiteSecure?: boolean;
}

definePageMeta({
  layout: "admin",
});

onMounted(() => {
  setPageLayout("admin");
});

const { $globals } = useNuxtApp();
const i18n = useI18n();

const state = reactive({
  loading: false,
  address: "",
  success: false,
  error: "",
  tested: false,
});

useSeoMeta({
  title: i18n.t("settings.site-settings"),
});

const appConfig = ref<CheckApp>({
  emailReady: true,
  baseUrlSet: true,
  isSiteSecure: true,
  isUpToDate: false,
  ldapReady: false,
  oidcReady: false,
  enableOpenai: false,
});
// Note: ldapReady, oidcReady, enableOpenai are kept in the type for API compatibility
// but are not displayed in the ByteSized lite UI.

function isLocalHostOrHttps() {
  return window.location.hostname === "localhost" || window.location.protocol === "https:";
}

const api = useUserApi();
const adminApi = useAdminApi();

onMounted(async () => {
  const { data } = await adminApi.about.checkApp();
  if (data) {
    appConfig.value = { ...data, isSiteSecure: false };
  }
  appConfig.value.isSiteSecure = isLocalHostOrHttps();
});

const simpleChecks = computed<SimpleCheck[]>(() => {
  const goodIcon = $globals.icons.checkboxMarkedCircle;
  const badIcon = $globals.icons.alert;
  const warningIcon = $globals.icons.alertCircle;
  const goodColor = "success";
  const badColor = "error";
  const warningColor = "warning";
  const data: SimpleCheck[] = [
    {
      id: "application-version",
      text: i18n.t("settings.application-version"),
      status: appConfig.value.isUpToDate,
      errorText: i18n.t("settings.application-version-error-text", [rawAppInfo.value.version, rawAppInfo.value.versionLatest]),
      successText: i18n.t("settings.mealie-is-up-to-date"),
      color: appConfig.value.isUpToDate ? goodColor : warningColor,
      icon: appConfig.value.isUpToDate ? goodIcon : warningIcon,
    },
    {
      id: "secure-site",
      text: i18n.t("settings.secure-site"),
      status: appConfig.value.isSiteSecure,
      errorText: i18n.t("settings.secure-site-error-text"),
      successText: i18n.t("settings.secure-site-success-text"),
      color: appConfig.value.isSiteSecure ? goodColor : badColor,
      icon: appConfig.value.isSiteSecure ? goodIcon : badIcon,
    },
    {
      id: "server-side-base-url",
      text: i18n.t("settings.server-side-base-url"),
      status: appConfig.value.baseUrlSet,
      errorText: i18n.t("settings.server-side-base-url-error-text"),
      successText: i18n.t("settings.server-side-base-url-success-text"),
      color: appConfig.value.baseUrlSet ? goodColor : badColor,
      icon: appConfig.value.baseUrlSet ? goodIcon : badIcon,
    },
  ];
  return data;
});

async function testEmail() {
  state.loading = true;
  state.tested = false;
  const { data } = await api.email.test({ email: state.address });
  if (data) {
    if (data.success) {
      state.success = true;
    }
    else {
      state.error = data.error ?? "";
      state.success = false;
    }
  }
  state.loading = false;
  state.tested = true;
}

const validEmail = computed(() => {
  if (state.address === "") return false;
  const valid = validators.email(state.address);
  return valid === true;
});

const rawAppInfo = ref({
  version: "null",
  versionLatest: "null",
});

function getAppInfo() {
  const { data: statistics } = useAsyncData(useAsyncKey(), async () => {
    const { data } = await adminApi.about.about();
    if (data) {
      rawAppInfo.value.version = data.version;
      rawAppInfo.value.versionLatest = data.versionLatest;
      const prettyInfo = [
        {
          slot: "version",
          name: i18n.t("about.version"),
          icon: $globals.icons.information,
          value: data.version,
        },
        {
          slot: "build",
          name: i18n.t("settings.build"),
          icon: $globals.icons.information,
          value: data.buildId,
        },
        {
          name: i18n.t("about.application-mode"),
          icon: $globals.icons.devTo,
          value: data.production ? i18n.t("about.production") : i18n.t("about.development"),
        },
        {
          name: i18n.t("about.demo-status"),
          icon: $globals.icons.testTube,
          value: data.demoStatus ? i18n.t("about.demo") : i18n.t("about.not-demo"),
        },
        {
          name: i18n.t("about.api-port"),
          icon: $globals.icons.api,
          value: data.apiPort,
        },
        {
          name: i18n.t("about.api-docs"),
          icon: $globals.icons.file,
          value: data.apiDocs ? i18n.t("general.enabled") : i18n.t("general.disabled"),
        },
        {
          name: i18n.t("about.database-type"),
          icon: $globals.icons.database,
          value: data.dbType,
        },
        {
          name: i18n.t("about.database-url"),
          icon: $globals.icons.database,
          value: data.dbUrl,
        },
        {
          name: i18n.t("about.default-group"),
          icon: $globals.icons.group,
          value: data.defaultGroup,
        },
        {
          name: i18n.t("about.default-household"),
          icon: $globals.icons.household,
          value: data.defaultHousehold,
        },
        {
          slot: "recipe-scraper",
          name: i18n.t("settings.recipe-scraper-version"),
          icon: $globals.icons.primary,
          value: data.recipeScraperVersion,
        },
      ];
      return prettyInfo;
    }
    return data;
  });
  return statistics;
}

const appInfo = getAppInfo();
const bugReportDialog = ref(false);
const bugReportText = computed(() => {
  const ignore = {
    [i18n.t("about.database-url")]: true,
    [i18n.t("about.default-group")]: true,
  };
  let text = "**Details**\n";
  appInfo.value?.forEach((item) => {
    if (ignore[item.name as string]) return;
    text += `${item.name as string}: ${item.value as string}\n`;
  });
  const ignoreChecks: { [key: string]: boolean } = {
    "application-version": true,
  };
  text += "\n**Checks**\n";
  simpleChecks.value.forEach((item) => {
    if (ignoreChecks[item.id]) return;
    const status = item.status ? i18n.t("general.yes") : i18n.t("general.no");
    text += `${item.text.toString()}: ${status}\n`;
  });
  text += `${i18n.t("settings.email-configured")}: ${appConfig.value.emailReady ? i18n.t("general.yes") : i18n.t("general.no")}\n`;
  return text;
});
</script>
