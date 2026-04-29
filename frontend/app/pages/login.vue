<template>
  <div class="flex justify-center items-center flex-col min-h-screen bg-[#f5f8fa] dark:bg-background px-4 py-8">

    <!-- First-login info banner -->
    <div
      v-if="isFirstLogin"
      class="w-full max-w-[600px] mb-4 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-sm text-on-surface"
      style="flex: none"
    >
      <div class="flex gap-2 items-start">
        <AppIcon :path="$globals.icons.information" size="md" class="text-info shrink-0 mt-0.5" />
        <div>
          <p class="mb-3">
            {{ $t('user.it-looks-like-this-is-your-first-time-logging-in') }}
          </p>
          <p class="mb-1">
            <strong>{{ $t('user.username') }}: </strong>changeme@example.com
            <AppButtonCopy copy-text="changeme@example.com" color="info" btn-class="h-auto" />
          </p>
          <p class="mb-3">
            <strong>{{ $t('user.password') }}: </strong>MyPassword
            <AppButtonCopy copy-text="MyPassword" color="info" btn-class="h-auto" />
          </p>
          <p>
            {{ $t('user.dont-want-to-see-this-anymore-be-sure-to-change-your-email') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Login card -->
    <section class="flex flex-col items-center w-full max-w-[600px] bg-surface rounded-xl shadow-md overflow-hidden">

      <!-- Header bar -->
      <div class="w-full bg-primary flex justify-center items-center py-4 mb-4">
        <h1 class="text-3xl font-medium text-white text-center">ByteSized</h1>
      </div>

      <!-- Logo -->
      <AppLogo :size="100" />

      <!-- Sign in title -->
      <h2 class="text-xl flex justify-center pb-3 pt-2 text-on-surface font-medium">
        {{ $t('user.sign-in') }}
      </h2>

      <!-- Form -->
      <div class="w-full px-6 pb-2">
        <form @submit.prevent="authenticate">
          <!-- Email / username -->
          <div v-if="$appInfo.allowPasswordLogin" class="mb-3">
            <label for="username" class="block text-sm font-medium text-on-surface/70 mb-1">
              {{ $t('user.email-or-username') }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <AppIcon :path="$globals.icons.email" size="sm" class="text-on-surface/40" />
              </div>
              <input
                id="username"
                v-model="form.email"
                type="text"
                name="username"
                autocomplete="username"
                autofocus
                class="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm
                       text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>

          <!-- Password -->
          <div v-if="$appInfo.allowPasswordLogin" class="mb-3">
            <label for="password" class="block text-sm font-medium text-on-surface/70 mb-1">
              {{ $t('user.password') }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="inputType"
                name="password"
                autocomplete="current-password"
                class="w-full rounded-lg border border-border bg-surface pl-9 pr-10 py-2.5 text-sm
                       text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-primary focus:border-primary transition-colors"
              />
              <!-- Password visibility toggle -->
              <button
                type="button"
                class="absolute inset-y-0 right-3 flex items-center text-on-surface/40 hover:text-on-surface/70 transition-colors"
                @click="togglePasswordShow"
              >
                <AppIcon :path="passwordIcon" size="sm" />
              </button>
            </div>
          </div>

          <!-- Remember me -->
          <label v-if="$appInfo.allowPasswordLogin" class="flex items-center gap-2 ml-1 -mt-1 mb-3 cursor-pointer text-sm text-on-surface">
            <input
              v-model="form.remember"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
            />
            {{ $t('user.remember-me') }}
          </label>

          <!-- Login button -->
          <div v-if="$appInfo.allowPasswordLogin" class="flex justify-center pt-0 mb-2">
            <button
              type="submit"
              :disabled="loggingIn || oidcLoggingIn"
              class="w-[300px] bs-btn bs-btn-md bs-btn-primary rounded-xl justify-center"
            >
              <svg v-if="loggingIn" class="animate-spin w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {{ $t("user.login") }}
            </button>
          </div>

          <!-- OR divider (shown only when both password login and OIDC are enabled) -->
          <div
            v-if="$appInfo.enableOidc && $appInfo.allowPasswordLogin"
            class="relative flex items-center my-4"
          >
            <div class="flex-1 border-t border-border" />
            <span class="px-3 text-sm text-on-surface/50 bg-surface">{{ $t("user.or") }}</span>
            <div class="flex-1 border-t border-border" />
          </div>

          <!-- OIDC login button -->
          <div v-if="$appInfo.enableOidc" class="flex justify-center mb-2">
            <button
              type="button"
              :disabled="oidcLoggingIn"
              class="w-[300px] bs-btn bs-btn-md bs-btn-primary rounded-xl justify-center"
              @click="() => oidcAuthenticate()"
            >
              <svg v-if="oidcLoggingIn" class="animate-spin w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {{ $t("user.login-oidc") }} {{ $appInfo.oidcProviderName }}
            </button>
          </div>
        </form>
      </div>

      <!-- Register / forgot password links -->
      <div class="flex justify-center flex-col sm:flex-row gap-1 py-2 px-4 border-t border-border w-full">
        <NuxtLink
          v-if="$appInfo.allowSignup && $appInfo.allowPasswordLogin"
          to="/register"
          class="bs-btn bs-btn-sm bs-btn-ghost text-on-surface/70"
        >
          {{ $t("user.register") }}
        </NuxtLink>
        <button
          v-else
          disabled
          class="bs-btn bs-btn-sm bs-btn-ghost opacity-50"
        >
          {{ $t("user.invite-only") }}
        </button>
        <NuxtLink
          v-if="$appInfo.allowPasswordLogin"
          to="/forgot-password"
          class="bs-btn bs-btn-sm bs-btn-ghost text-on-surface/70"
        >
          {{ $t("user.reset-password") }}
        </NuxtLink>
      </div>

      <!-- Footer links (sponsor / github / docs) -->
      <div class="flex justify-center flex-col sm:flex-row py-3 px-4 w-full">
        <a
          v-for="link in [
            { text: $t('about.sponsor'), icon: $globals.icons.heart,         href: 'https://github.com/sponsors/hay-kot' },
            { text: $t('about.github'),  icon: $globals.icons.github,        href: 'https://github.com/mealie-recipes/mealie' },
            { text: $t('about.docs'),    icon: $globals.icons.folderOutline,  href: 'https://docs.mealie.io/' },
          ]"
          :key="link.text"
          :href="link.href"
          target="_blank"
          class="bs-btn bs-btn-sm bs-btn-ghost text-on-surface/60 text-center justify-center"
        >
          <AppIcon :path="link.icon" size="sm" />
          {{ link.text }}
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useDark, whenever } from "@vueuse/core";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { usePasswordField } from "~/composables/use-passwords";
import { alert } from "~/composables/use-toast";
import { useAsyncKey } from "~/composables/use-utils";
import type { AppStartupInfo } from "~/lib/api/types/admin";
import { useUserActivityPreferences } from "~/composables/use-users/preferences";

definePageMeta({
  layout: "blank",
});

const isDark = useDark();

const router = useRouter();
const i18n = useI18n();
const auth = useMealieAuth();
const { $appInfo, $axios, $globals } = useNuxtApp();
const { loggedIn } = useLoggedInState();
const groupSlug = computed(() => auth.user.value?.groupSlug);
const isDemo = ref(false);
const isFirstLogin = ref(false);
const activityPreferences = useUserActivityPreferences();
const { getDefaultActivityRoute } = useDefaultActivity();

useSeoMeta({
  title: i18n.t("user.login"),
});

const form = reactive({
  email: "",
  password: "",
  remember: false,
});

useAsyncData(useAsyncKey(), async () => {
  const data = await $axios.get<AppStartupInfo>("/api/app/about/startup-info");
  isDemo.value = data.data.isDemo;
  isFirstLogin.value = data.data.isFirstLogin;

  if (data.data.isFirstLogin) {
    form.email = "changeme@example.com";
    form.password = "MyPassword";
  }
});

whenever(
  () => loggedIn.value && groupSlug.value,
  () => {
    const defaultActivityRoute = getDefaultActivityRoute(
      activityPreferences.value.defaultActivity,
      groupSlug.value,
    );
    if (!isDemo.value && isFirstLogin.value && auth.user.value?.admin) {
      router.push("/admin/setup");
    }
    else if (defaultActivityRoute) {
      router.push(defaultActivityRoute);
    }
    else {
      router.push(`/g/${groupSlug.value || ""}`);
    }
  },
  { immediate: true },
);

const loggingIn = ref(false);
const oidcLoggingIn = ref(false);

const { passwordIcon, inputType, togglePasswordShow } = usePasswordField();

whenever(
  () => $appInfo.enableOidc && $appInfo.oidcRedirect && !isCallback() && !isDirectLogin(),
  () => oidcAuthenticate(),
  { immediate: true },
);

onBeforeMount(async () => {
  if (isCallback()) {
    await oidcAuthenticate(true);
  }
});

function isCallback() {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error");
}

function isDirectLogin() {
  const params = new URLSearchParams(window.location.search);
  return params.has("direct") && params.get("direct") === "1";
}

async function oidcAuthenticate(callback = false) {
  if (callback) {
    oidcLoggingIn.value = true;
    try {
      await auth.oauthSignIn();
    }
    catch (error) {
      await router.replace("/login?direct=1");
      alertOnError(error);
    }
    oidcLoggingIn.value = false;
  }
  else {
    navigateTo("/api/auth/oauth", { external: true });
  }
}

async function authenticate() {
  if (form.email.length === 0 || form.password.length === 0) {
    alert.error(i18n.t("user.please-enter-your-email-and-password"));
    return;
  }

  loggingIn.value = true;
  const formData = new FormData();
  formData.append("username", form.email);
  formData.append("password", form.password);
  formData.append("remember_me", String(form.remember));

  try {
    await auth.signIn(formData);
  }
  catch (error) {
    console.log(error);
    alertOnError(error);
  }
  loggingIn.value = false;
}

function alertOnError(error: any) {
  if (error.response?.status === 401) {
    alert.error(i18n.t("user.invalid-credentials"));
  }
  else if (error.response?.status === 423) {
    alert.error(i18n.t("user.account-locked-please-try-again-later"));
  }
  else {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}
</script>
