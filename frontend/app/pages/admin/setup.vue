<template>
  <div class="min-h-screen bg-background flex justify-center items-start py-0 md:py-10">
    <div class="w-full max-w-5xl bg-surface shadow-lg rounded-none md:rounded-xl overflow-hidden">
      <!-- Header bar -->
      <div class="bg-primary px-6 py-4 flex justify-center">
        <h1 class="text-2xl font-bold text-on-primary">Mealie</h1>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-0 px-4 py-4 overflow-x-auto">
        <template v-for="(step, idx) in steps" :key="step.page">
          <div class="flex flex-col items-center flex-shrink-0">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors"
              :class="stepCircleClass(step.page)"
            >
              <AppIcon v-if="currentPage > step.page" :path="$globals.icons.check" size="sm" />
              <AppIcon v-else :path="step.icon" size="sm" />
            </div>
            <span class="text-xs mt-1 text-on-surface/70 whitespace-nowrap">{{ step.label }}</span>
          </div>
          <div
            v-if="idx < steps.length - 1"
            class="h-0.5 w-8 mx-1 flex-shrink-0 mt-[-1rem] transition-colors"
            :class="currentPage > step.page ? 'bg-success' : 'bg-border'"
          />
        </template>
      </div>

      <!-- Progress bar (during submission) -->
      <div v-if="isSubmitting && currentPage === Pages.CONFIRM" class="h-1 bg-primary/20 mb-2">
        <div class="h-full bg-primary animate-pulse w-full" />
      </div>

      <!-- Step content -->
      <div class="px-4 py-2 min-h-[400px]">
        <!-- LANDING -->
        <div v-show="currentPage === Pages.LANDING" class="flex flex-col items-center py-8 gap-6">
          <AppLogo />
          <h2 class="text-2xl font-bold text-on-surface text-center break-words max-w-xl">
            {{ $t('admin.setup.welcome-to-mealie-get-started') }}
          </h2>
          <NuxtLink
            :to="groupSlug ? `/g/${groupSlug}` : '/login'"
            class="inline-flex items-center rounded-full border border-on-surface/20 px-4 py-2 text-sm font-medium text-on-surface/70 hover:bg-on-surface/5 transition-colors"
          >
            {{ $t('admin.setup.already-set-up-bring-to-homepage') }}
          </NuxtLink>
          <BaseButton
            size="large"
            color="primary"
            rounded
            :icon="$globals.icons.translate"
            @click="langDialog = true"
          >
            {{ $t('language-dialog.choose-language') }}
          </BaseButton>
        </div>

        <!-- USER INFO -->
        <div v-show="currentPage === Pages.USER_INFO" class="max-w-2xl mx-auto py-4">
          <UserRegistrationForm />
        </div>

        <!-- COMMON SETTINGS -->
        <div v-show="currentPage === Pages.PAGE_2" class="max-w-2xl mx-auto py-4">
          <h2 class="text-lg font-semibold text-on-surface mb-4">
            {{ $t('admin.setup.common-settings-for-new-sites') }}
          </h2>
          <AutoForm v-model="commonSettings" :items="commonSettingsForm" />
        </div>

        <!-- CONFIRMATION -->
        <div v-show="currentPage === Pages.CONFIRM" class="max-w-2xl mx-auto py-4">
          <h2 class="text-lg font-semibold text-on-surface mb-4">
            {{ $t('general.confirm-how-does-everything-look') }}
          </h2>
          <div class="rounded-xl border border-border bg-surface divide-y divide-border">
            <template v-for="(item, idx) in confirmationData" :key="idx">
              <div v-if="item.display" class="px-4 py-3">
                <p class="text-sm font-medium text-on-surface">{{ item.text }}</p>
                <p class="text-xs text-on-surface/60 mt-0.5">{{ item.value }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- END -->
        <div v-show="currentPage === Pages.END" class="py-4">
          <EndPageContent />
        </div>
      </div>

      <!-- Navigation footer -->
      <div class="flex items-center justify-between px-4 py-4 border-t border-border">
        <button
          v-if="currentPage > Pages.LANDING"
          type="button"
          :disabled="isSubmitting"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-on-surface/5 transition-colors disabled:opacity-50"
          @click="onPrev"
        >
          {{ $t('general.back') }}
        </button>
        <div v-else />

        <template v-if="currentPage === Pages.CONFIRM">
          <BaseButton
            create
            :disabled="isSubmitting"
            :loading="isSubmitting"
            :icon="$globals.icons.check"
            @click="onNext"
          >
            {{ $t('general.submit') }}
          </BaseButton>
        </template>
        <template v-else-if="currentPage === Pages.END">
          <BaseButton
            color="primary"
            :disabled="isSubmitting"
            :loading="isSubmitting"
            :icon="$globals.icons.home"
            @click="onFinish"
          >
            {{ $t('general.home') }}
          </BaseButton>
        </template>
        <template v-else>
          <button
            type="button"
            :disabled="isSubmitting"
            class="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 transition-colors disabled:opacity-50"
            @click="onNext"
          >
            {{ $t('general.next') }}
          </button>
        </template>
      </div>

      <!-- Language Dialog -->
      <LanguageDialog v-model="langDialog" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi, useUserApi } from "~/composables/api";
import { useLocales } from "~/composables/use-locales";
import { alert } from "~/composables/use-toast";
import { useUserRegistrationForm } from "~/composables/use-users/user-registration-form";
import { useCommonSettingsForm } from "~/composables/use-setup/common-settings-form";
import UserRegistrationForm from "~/components/Domain/User/UserRegistrationForm.vue";

definePageMeta({
  layout: "blank",
  middleware: ["admin-only"],
});

const i18n = useI18n();
const auth = useMealieAuth();
const userApi = useUserApi();
const adminApi = useAdminApi();
const { $globals } = useNuxtApp();

const groupSlug = computed(() => auth.user.value?.groupSlug);
const { locale } = useLocales();
const router = useRouter();
const isSubmitting = ref(false);
const langDialog = ref(false);

useSeoMeta({
  title: i18n.t("admin.setup.first-time-setup"),
});

enum Pages {
  LANDING = 1,
  USER_INFO = 2,
  PAGE_2 = 3,
  CONFIRM = 4,
  END = 5,
}

const steps = [
  { page: Pages.LANDING, icon: $globals.icons.wave, label: i18n.t("general.start") },
  { page: Pages.USER_INFO, icon: $globals.icons.user, label: i18n.t("user-registration.account-details") },
  { page: Pages.PAGE_2, icon: $globals.icons.cog, label: i18n.t("settings.site-settings") },
  { page: Pages.CONFIRM, icon: $globals.icons.chefHat, label: i18n.t("admin.maintenance.summary-title") },
  { page: Pages.END, icon: $globals.icons.check, label: i18n.t("admin.setup.setup-complete") },
];

function stepCircleClass(page: Pages) {
  if (currentPage.value === page) return "border-info bg-info/10 text-info";
  if (currentPage.value > page) return "border-success bg-success/10 text-success";
  return "border-border bg-surface text-on-surface/40";
}

// Forms
const { accountDetails, credentials } = useUserRegistrationForm();
const { commonSettingsForm } = useCommonSettingsForm();
const commonSettings = ref({
  makeGroupRecipesPublic: false,
  useSeedData: true,
});

const confirmationData = computed(() => {
  return [
    { display: true, text: i18n.t("user.email"), value: accountDetails.email.value },
    { display: true, text: i18n.t("user.username"), value: accountDetails.username.value },
    { display: true, text: i18n.t("user.full-name"), value: accountDetails.fullName.value },
    { display: true, text: i18n.t("user.enable-advanced-content"), value: accountDetails.advancedOptions.value ? i18n.t("general.yes") : i18n.t("general.no") },
    { display: true, text: i18n.t("group.enable-public-access"), value: commonSettings.value.makeGroupRecipesPublic ? i18n.t("general.yes") : i18n.t("general.no") },
    { display: true, text: i18n.t("user-registration.use-seed-data"), value: commonSettings.value.useSeedData ? i18n.t("general.yes") : i18n.t("general.no") },
  ];
});

const currentPage = ref(Pages.LANDING);

async function updateUser() {
  const { response } = await userApi.users.updateOne(auth.user.value!.id, {
    ...auth.user.value,
    email: accountDetails.email.value,
    username: accountDetails.username.value,
    fullName: accountDetails.fullName.value,
    advanced: accountDetails.advancedOptions.value,
  });
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
  else {
    auth.refresh();
  }
}

async function updatePassword() {
  const { response } = await userApi.users.changePassword({
    currentPassword: "MyPassword",
    newPassword: credentials.password1.value,
  });
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}

async function submitRegistration() {
  await updatePassword().then(updateUser);
}

async function updateGroup() {
  const { data } = await userApi.groups.getOne(auth.user.value!.groupId);
  if (!data || !data.preferences) {
    alert.error(i18n.t("events.something-went-wrong"));
    return;
  }
  const preferences = { ...data.preferences, privateGroup: !commonSettings.value.makeGroupRecipesPublic };
  const payload = { ...data, preferences };
  const { response } = await userApi.groups.updateOne(auth.user.value!.groupId, payload);
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}

async function updateHousehold() {
  const { data } = await adminApi.households.getOne(auth.user.value!.householdId);
  if (!data || !data.preferences) {
    alert.error(i18n.t("events.something-went-wrong"));
    return;
  }
  const preferences = {
    ...data.preferences,
    privateHousehold: !commonSettings.value.makeGroupRecipesPublic,
    recipePublic: commonSettings.value.makeGroupRecipesPublic,
  };
  const payload = { ...data, preferences };
  const { response } = await adminApi.households.updateOne(auth.user.value!.householdId, payload);
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}

async function seedFoods() {
  const { response } = await userApi.seeders.foods({ locale: locale.value });
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}

async function seedUnits() {
  const { response } = await userApi.seeders.units({ locale: locale.value });
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}

async function seedLabels() {
  const { response } = await userApi.seeders.labels({ locale: locale.value });
  if (!response || response.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}

async function seedData() {
  if (!commonSettings.value.useSeedData) return;
  await seedLabels();
  await Promise.all([seedFoods(), seedUnits()]);
}

async function submitCommonSettings() {
  await Promise.all([updateGroup(), updateHousehold(), seedData()]);
}

async function submitAll() {
  await Promise.all([submitRegistration(), submitCommonSettings()]);
}

async function handleSubmit(page: number) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  switch (page) {
    case Pages.USER_INFO:
      if (await accountDetails.validate()) {
        currentPage.value += 1;
      }
      break;
    case Pages.CONFIRM:
      await submitAll();
      currentPage.value += 1;
      break;
    case Pages.END:
      router.push(groupSlug.value ? `/g/${groupSlug.value}` : "/login");
      break;
  }
  isSubmitting.value = false;
}

function onPrev() {
  if (isSubmitting.value) return;
  if (currentPage.value > Pages.LANDING) currentPage.value -= 1;
}

async function onNext() {
  if (isSubmitting.value) return;
  if (currentPage.value === Pages.USER_INFO) {
    await handleSubmit(Pages.USER_INFO);
    return;
  }
  if (currentPage.value === Pages.CONFIRM) {
    await handleSubmit(Pages.CONFIRM);
    return;
  }
  currentPage.value += 1;
}

async function onFinish() {
  if (isSubmitting.value) return;
  await handleSubmit(Pages.END);
}
</script>
