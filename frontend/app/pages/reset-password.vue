<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bs-card">
      <div class="bs-card-header justify-center">
        <h1 class="text-xl font-semibold">{{ $t("user.reset-password") }}</h1>
      </div>
      <hr class="border-border" />
      <div class="bs-card-body">
        <form @submit.prevent="requestLink()">
          <!-- Email -->
          <div class="relative mb-3">
            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <AppIcon :path="$globals.icons.email" size="sm" class="text-on-surface/40" />
            </div>
            <input
              v-model="state.email"
              type="text"
              name="login"
              autofocus
              :placeholder="$t('user.email')"
              class="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm
                     text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          <!-- New password -->
          <div class="relative mb-3">
            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40" />
            </div>
            <input
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              :placeholder="$t('user.password')"
              class="w-full rounded-lg border border-border bg-surface pl-10 pr-10 py-2.5 text-sm
                     text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-primary focus:border-primary transition-colors"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-3 flex items-center text-on-surface/40 hover:text-on-surface"
              @click="showPassword = !showPassword"
            >
              <AppIcon :path="showPassword ? $globals.icons.eyeOff : $globals.icons.eye" size="sm" />
            </button>
          </div>

          <!-- Confirm password -->
          <div class="relative mb-4">
            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40" />
            </div>
            <input
              v-model="state.passwordConfirm"
              :type="showPassword ? 'text' : 'password'"
              name="passwordConfirm"
              :placeholder="$t('user.confirm-password')"
              class="w-full rounded-lg border border-border bg-surface pl-10 pr-10 py-2.5 text-sm
                     text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          <!-- Mismatch warning -->
          <p v-if="state.passwordConfirm && state.password !== state.passwordConfirm" class="text-xs text-error mb-2">
            {{ $t('user.password-must-match') }}
          </p>

          <p class="text-center text-sm text-on-surface/70 mb-4">
            {{ $t("user.please-enter-password") }}
          </p>

          <button
            type="submit"
            :disabled="state.loading || token === ''"
            class="bs-btn bs-btn-md bs-btn-primary w-full rounded-xl justify-center disabled:opacity-50"
          >
            <AppIcon :path="$globals.icons.lock" size="sm" />
            {{ token === "" ? "Token Required" : $t("user.reset-password") }}
          </button>
        </form>
      </div>

      <div class="flex justify-center pb-4">
        <NuxtLink to="/login" class="bs-btn bs-btn-sm bs-btn-ghost">
          {{ $t("user.login") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useRouteQuery } from "~/composables/use-router";

definePageMeta({ layout: "basic" });

const { $globals } = useNuxtApp();

const state = reactive({
  email: "",
  password: "",
  passwordConfirm: "",
  loading: false,
  error: false,
});

const showPassword = ref(false);
const i18n = useI18n();
useSeoMeta({ title: i18n.t("user.login") });

const token = useRouteQuery("token", "");
const api = useUserApi();

async function requestLink() {
  state.loading = true;
  const { response } = await api.users.resetPassword({
    token: token.value,
    email: state.email,
    password: state.password,
    passwordConfirm: state.passwordConfirm,
  });

  state.loading = false;

  if (response?.status === 200) {
    state.error = false;
    alert.success(i18n.t("user.password-updated"));
  }
  else {
    state.error = true;
    alert.error(i18n.t("events.something-went-wrong"));
  }
}
</script>
