<template>
  <div>
    <div class="flex items-center gap-3 pb-3">
      <AppIcon :path="$globals.icons.user" size="lg" class="text-primary" />
      <span class="text-lg font-semibold text-on-surface">{{ $t("user-registration.account-details") }}</span>
    </div>
    <hr class="border-border mb-4" />

    <form ref="domAccountForm" class="space-y-3" @submit.prevent>
      <!-- Username -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.username') }}</label>
        <div class="flex items-center gap-2">
          <AppIcon :path="$globals.icons.user" size="sm" class="text-on-surface/40 shrink-0" />
          <input
            v-model="accountDetails.username.value"
            type="text"
            autofocus
            required
            class="flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            :class="usernameErrorMessages.length ? 'border-error' : 'border-border'"
            @blur="validateUsername"
          />
        </div>
        <p v-if="usernameErrorMessages.length" class="mt-1 ml-6 text-xs text-error">
          {{ usernameErrorMessages[0] }}
        </p>
      </div>

      <!-- Full name -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.full-name') }}</label>
        <div class="flex items-center gap-2">
          <AppIcon :path="$globals.icons.user" size="sm" class="text-on-surface/40 shrink-0" />
          <input
            v-model="accountDetails.fullName.value"
            type="text"
            required
            class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      <!-- Email -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.email') }}</label>
        <div class="flex items-center gap-2">
          <AppIcon :path="$globals.icons.email" size="sm" class="text-on-surface/40 shrink-0" />
          <input
            v-model="accountDetails.email.value"
            type="email"
            required
            class="flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            :class="emailErrorMessages.length ? 'border-error' : 'border-border'"
            @blur="validateEmail"
          />
        </div>
        <p v-if="emailErrorMessages.length" class="mt-1 ml-6 text-xs text-error">
          {{ emailErrorMessages[0] }}
        </p>
      </div>

      <!-- Password -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.password') }}</label>
        <div class="flex items-center gap-2">
          <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40 shrink-0" />
          <div class="relative flex-1">
            <input
              v-model="credentials.password1.value"
              :type="pwFields.inputType.value"
              required
              minlength="8"
              maxlength="258"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 pr-10 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface transition-colors"
              @click="pwFields.togglePasswordShow"
            >
              <AppIcon :path="pwFields.passwordIcon.value" size="sm" />
            </button>
          </div>
        </div>
      </div>

      <UserPasswordStrength v-model="credentials.password1.value" />

      <!-- Confirm password -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.confirm-password') }}</label>
        <div class="flex items-center gap-2">
          <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40 shrink-0" />
          <input
            v-model="credentials.password2.value"
            :type="pwFields.inputType.value"
            required
            class="flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            :class="passwordMismatch ? 'border-error' : 'border-border'"
          />
        </div>
        <p v-if="passwordMismatch" class="mt-1 ml-6 text-xs text-error">
          {{ $t('user.password-must-match') }}
        </p>
      </div>

      <!-- Advanced options -->
      <div class="px-2 pt-1">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="accountDetails.advancedOptions.value"
            type="checkbox"
            class="accent-primary"
          />
          <span class="text-sm text-on-surface">{{ $t('user.enable-advanced-content') }}</span>
        </label>
        <p class="mt-1 ml-5 text-xs text-on-surface/60">
          {{ $t("user.enable-advanced-content-description") }}
        </p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { validators } from "~/composables/use-validators";
import { useUserRegistrationForm } from "~/composables/use-users/user-registration-form";
import { usePasswordField } from "~/composables/use-passwords";
import UserPasswordStrength from "~/components/Domain/User/UserPasswordStrength.vue";

definePageMeta({ layout: "blank" });

const { $globals } = useNuxtApp();
const pwFields = usePasswordField();
const {
  accountDetails,
  credentials,
  emailErrorMessages,
  usernameErrorMessages,
  validateUsername,
  validateEmail,
  domAccountForm,
} = useUserRegistrationForm();

const passwordMismatch = computed(() => {
  if (!credentials.password2.value) return false;
  return credentials.password1.value !== credentials.password2.value;
});
</script>
