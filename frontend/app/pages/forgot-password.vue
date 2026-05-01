<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bs-card">
      <div class="bs-card-header justify-center">
        <h1 class="text-xl font-semibold">{{ $t('user.forgot-password') }}</h1>
      </div>
      <hr class="border-border" />
      <div class="bs-card-body">
        <form @submit.prevent="requestLink()">
          <!-- Email field -->
          <div class="relative mb-4">
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

          <p class="text-center text-sm text-on-surface/70 mb-4">
            {{ $t('user.forgot-password-text') }}
          </p>

          <button
            type="submit"
            :disabled="state.loading"
            class="bs-btn bs-btn-md bs-btn-primary w-full rounded-xl justify-center disabled:opacity-50"
          >
            <AppIcon :path="$globals.icons.email" size="sm" />
            {{ $t("user.reset-password") }}
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

definePageMeta({ layout: "basic" });

const { $globals } = useNuxtApp();

const state = reactive({
  email: "",
  loading: false,
  error: false,
});

const i18n = useI18n();
useSeoMeta({ title: i18n.t("user.login") });

const api = useUserApi();

async function requestLink() {
  state.loading = true;
  const { response } = await api.email.sendForgotPassword({ email: state.email });

  if (response?.status === 200) {
    state.loading = false;
    state.error = false;
    alert.success(i18n.t("profile.email-sent"));
  }
  else {
    state.loading = false;
    state.error = true;
    alert.error(i18n.t("profile.error-sending-email"));
  }
}
</script>
