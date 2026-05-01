<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-4"
    :class="!isDark ? 'bg-[#f5f8fa]' : ''"
  >
    <div class="w-full max-w-5xl bg-surface rounded-xl shadow-xl overflow-hidden flex flex-col min-h-[700px]">
      <!-- Header bar -->
      <div class="w-full bg-primary py-4 text-center">
        <h1 class="text-3xl font-bold text-white">Mealie</h1>
      </div>
      <AppLogo />

      <!-- Step content -->
      <div class="flex justify-center flex-1 items-center my-4 px-4">
        <!-- Initial: Choose join or create -->
        <template v-if="state.ctx.state === States.Initial">
          <div class="w-full">
            <h2 class="text-xl font-semibold my-4 mb-5 text-center">
              {{ $t("user-registration.user-registration") }}
            </h2>
            <div class="flex flex-wrap justify-center gap-4 p-4">
              <button
                type="button"
                class="bs-btn bs-btn-primary flex flex-col items-center justify-center gap-2
                       w-[320px] h-[80px] rounded-xl text-lg font-medium"
                @click="initial.joinGroup"
              >
                <AppIcon :path="$globals.icons.group" size="lg" />
                {{ $t("user-registration.join-a-group") }}
              </button>
              <button
                type="button"
                class="bs-btn bs-btn-primary flex flex-col items-center justify-center gap-2
                       w-[320px] h-[80px] rounded-xl text-lg font-medium"
                @click="initial.createGroup"
              >
                <AppIcon :path="$globals.icons.user" size="lg" />
                {{ $t("user-registration.create-a-new-group") }}
              </button>
            </div>
          </div>
        </template>

        <!-- Provide Token -->
        <template v-else-if="state.ctx.state === States.ProvideToken">
          <div class="w-full max-w-lg">
            <div class="flex items-center gap-3 mb-2">
              <AppIcon :path="$globals.icons.group" size="lg" class="text-on-surface/70" />
              <h2 class="text-lg font-semibold">{{ $t("user-registration.join-a-group") }}</h2>
            </div>
            <hr class="border-border mb-4" />
            <p class="text-sm text-on-surface/70 mb-4">{{ $t("user-registration.provide-registration-token-description") }}</p>
            <form ref="domTokenForm">
              <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.group-token') }}</label>
              <input
                v-model="token"
                type="text"
                required
                class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm
                       text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                       focus:border-primary transition-colors"
              />
            </form>
            <hr class="border-border mt-4 mb-3" />
            <div class="flex justify-between">
              <BaseButton cancel @click="state.back">
                <template #icon>{{ $globals.icons.back }}</template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton icon-right @click="provideToken.next">
                <template #icon>{{ $globals.icons.forward }}</template>
                {{ $t("general.next") }}
              </BaseButton>
            </div>
          </div>
        </template>

        <!-- Provide Group Details -->
        <template v-else-if="state.ctx.state === States.ProvideGroupDetails">
          <div class="w-full max-w-2xl">
            <div class="flex items-center gap-3 mb-2">
              <AppIcon :path="$globals.icons.group" size="lg" class="text-on-surface/70" />
              <h2 class="text-lg font-semibold">{{ $t("user-registration.group-details") }}</h2>
            </div>
            <p class="text-sm text-on-surface/70 mb-4">{{ $t("user-registration.group-details-description") }}</p>
            <hr class="border-border mb-4" />
            <form ref="domGroupForm" class="space-y-3">
              <div>
                <label class="block text-xs text-on-surface/60 mb-1">{{ $t('group.group-name') }}</label>
                <input
                  v-model="groupDetails.groupName.value"
                  type="text"
                  required
                  class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm
                         text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                         focus:border-primary transition-colors"
                  :class="groupErrorMessages.length ? 'border-error' : ''"
                  @blur="validGroupName"
                />
                <p v-for="msg in groupErrorMessages" :key="msg" class="text-xs text-error mt-1">{{ msg }}</p>
              </div>

              <label class="flex items-start gap-3 cursor-pointer text-sm text-on-surface">
                <input
                  v-model="groupDetails.groupPrivate.value"
                  type="checkbox"
                  class="w-4 h-4 rounded border-border accent-primary mt-0.5 shrink-0"
                />
                <div>
                  <span>{{ $t('group.settings.keep-my-recipes-private') }}</span>
                  <p class="text-xs text-on-surface/60 mt-0.5">{{ $t("group.settings.keep-my-recipes-private-description") }}</p>
                </div>
              </label>

              <label class="flex items-start gap-3 cursor-pointer text-sm text-on-surface">
                <input
                  v-model="groupDetails.groupSeed.value"
                  type="checkbox"
                  class="w-4 h-4 rounded border-border accent-primary mt-0.5 shrink-0"
                />
                <div>
                  <span>{{ $t('data-pages.seed-data') }}</span>
                  <p class="text-xs text-on-surface/60 mt-0.5">{{ $t("user-registration.use-seed-data-description") }}</p>
                </div>
              </label>
            </form>
            <hr class="border-border mt-4 mb-3" />
            <div class="flex justify-between">
              <BaseButton cancel @click="state.back">
                <template #icon>{{ $globals.icons.back }}</template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton icon-right @click="groupDetails.next">
                <template #icon>{{ $globals.icons.forward }}</template>
                {{ $t("general.next") }}
              </BaseButton>
            </div>
          </div>
        </template>

        <!-- Account Details -->
        <template v-else-if="state.ctx.state === States.ProvideAccountDetails">
          <div class="w-full max-w-2xl">
            <UserRegistrationForm />
            <hr class="border-border my-4" />
            <div class="flex justify-between">
              <BaseButton cancel @click="state.back">
                <template #icon>{{ $globals.icons.back }}</template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton icon-right @click="accountDetailsNext">
                <template #icon>{{ $globals.icons.forward }}</template>
                {{ $t("general.next") }}
              </BaseButton>
            </div>
          </div>
        </template>

        <!-- Confirmation -->
        <template v-else-if="state.ctx.state === States.Confirmation">
          <div class="w-full max-w-2xl">
            <div class="flex items-center gap-3 mb-4">
              <AppIcon :path="$globals.icons.user" size="lg" class="text-on-surface/70" />
              <h2 class="text-lg font-semibold">{{ $t("general.confirm") }}</h2>
            </div>
            <ul class="divide-y divide-border">
              <template v-for="(item, idx) in confirmationData" :key="idx">
                <li v-if="item.display" class="py-3">
                  <p class="text-sm font-medium text-on-surface">{{ item.text }}</p>
                  <p class="text-xs text-on-surface/60 mt-0.5">{{ item.value }}</p>
                </li>
              </template>
            </ul>
            <hr class="border-border mt-4 mb-3" />
            <div class="flex justify-between">
              <BaseButton cancel @click="state.back">
                <template #icon>{{ $globals.icons.back }}</template>
                {{ $t("general.back") }}
              </BaseButton>
              <BaseButton @click="submitRegistration">
                <template #icon>{{ $globals.icons.check }}</template>
                {{ $t("general.submit") }}
              </BaseButton>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer actions -->
      <div class="flex flex-col items-center gap-3 py-8">
        <NuxtLink to="/login" class="bs-btn bs-btn-sm bs-btn-ghost">
          {{ $t("user.login") }}
        </NuxtLink>
        <BaseButton
          size="large"
          color="primary"
          :icon="$globals.icons.translate"
          @click="langDialog = true"
        >
          {{ $t("language-dialog.choose-language") }}
        </BaseButton>
      </div>
    </div>

    <LanguageDialog v-model="langDialog" />
  </div>
</template>

<script setup lang="ts">
import { useDark } from "@vueuse/core";
import { States, RegistrationType, useRegistration } from "./states";
import { useUserRegistrationForm } from "~/composables/use-users/user-registration-form";
import { useRouteQuery } from "~/composables/use-router";
import { useAsyncValidator } from "~/composables/use-validators";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import type { CreateUserRegistration } from "~/lib/api/types/user";
import { usePublicApi } from "~/composables/api/api-client";
import { useLocales } from "~/composables/use-locales";
import UserRegistrationForm from "~/components/Domain/User/UserRegistrationForm.vue";

definePageMeta({ layout: "blank" });

const { $globals } = useNuxtApp();
const i18n = useI18n();
const isDark = useDark();

// Use native form validity instead of Vuetify VForm
function safeValidate(formEl: Ref<HTMLFormElement | null>) {
  return formEl.value?.checkValidity() ?? true;
}

// Registration state machine
const state = useRegistration();

// Handle token URL / initialization
const token = useRouteQuery("token");
function initialUser() { return false; }
onMounted(() => {
  if (token.value) {
    state.setState(States.ProvideAccountDetails);
    state.setType(RegistrationType.JoinGroup);
  }
  if (initialUser()) {
    state.setState(States.ProvideGroupDetails);
    state.setType(RegistrationType.InitialGroup);
  }
});

// Initial step
const initial = {
  createGroup: () => {
    state.setState(States.ProvideGroupDetails);
    state.setType(RegistrationType.CreateGroup);
    if (token.value != null) token.value = null;
  },
  joinGroup: () => {
    state.setState(States.ProvideToken);
    state.setType(RegistrationType.JoinGroup);
  },
};

// Token step
const domTokenForm = ref<HTMLFormElement | null>(null);
const provideToken = {
  next: () => {
    if (!safeValidate(domTokenForm)) return;
    state.setState(States.ProvideAccountDetails);
  },
};

// Group details step
const publicApi = usePublicApi();
const domGroupForm = ref<HTMLFormElement | null>(null);
const groupName = ref("");
const groupSeed = ref(false);
const groupPrivate = ref(false);
const groupErrorMessages = ref<string[]>([]);
const { validate: validGroupName, valid: groupNameValid } = useAsyncValidator(
  groupName,
  (v: string) => publicApi.validators.group(v),
  i18n.t("validation.group-name-is-taken"),
  groupErrorMessages,
);
const groupDetails = {
  groupName,
  groupSeed,
  groupPrivate,
  next: () => {
    if (!safeValidate(domGroupForm) || !groupNameValid.value) return;
    state.setState(States.ProvideAccountDetails);
  },
};

// Account details step
const { accountDetails, credentials } = useUserRegistrationForm();
async function accountDetailsNext() {
  if (!await accountDetails.validate()) return;
  state.setState(States.Confirmation);
}

// Locale / language dialog
const { locale } = useLocales();
const langDialog = ref(false);

// Confirmation data
const confirmationData = computed(() => [
  {
    display: state.ctx.type === RegistrationType.CreateGroup,
    text:    i18n.t("group.group"),
    value:   groupName.value,
  },
  {
    display: state.ctx.type === RegistrationType.CreateGroup,
    text:    i18n.t("data-pages.seed-data"),
    value:   groupSeed.value ? i18n.t("general.yes") : i18n.t("general.no"),
  },
  {
    display: state.ctx.type === RegistrationType.CreateGroup,
    text:    i18n.t("group.settings.keep-my-recipes-private"),
    value:   groupPrivate.value ? i18n.t("general.yes") : i18n.t("general.no"),
  },
  {
    display: true,
    text:    i18n.t("user.email"),
    value:   accountDetails.email.value,
  },
  {
    display: true,
    text:    i18n.t("user.full-name"),
    value:   accountDetails.fullName.value,
  },
  {
    display: true,
    text:    i18n.t("user.username"),
    value:   accountDetails.username.value,
  },
  {
    display: true,
    text:    i18n.t("user.enable-advanced-content"),
    value:   accountDetails.advancedOptions.value ? i18n.t("general.yes") : i18n.t("general.no"),
  },
]);

// Submit
const api = useUserApi();
const router = useRouter();
async function submitRegistration() {
  const payload: CreateUserRegistration = {
    email:          accountDetails.email.value,
    username:       accountDetails.username.value,
    fullName:       accountDetails.fullName.value,
    password:       credentials.password1.value,
    passwordConfirm: credentials.password2.value,
    locale:         locale.value,
    advanced:       accountDetails.advancedOptions.value,
  };
  if (state.ctx.type === RegistrationType.CreateGroup) {
    payload.group    = groupName.value;
    payload.private  = groupPrivate.value;
    payload.seedData = groupSeed.value;
  }
  else {
    payload.groupToken = token.value;
  }
  const { response } = await api.register.register(payload);
  if (response?.status === 201) {
    accountDetails.reset();
    credentials.reset();
    alert.success(i18n.t("user-registration.registration-success"));
    router.push("/login");
  }
  else {
    alert.error(i18n.t("events.something-went-wrong"));
  }
}
</script>
