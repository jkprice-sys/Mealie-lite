<template>
  <div class="narrow-container mx-auto px-4 py-6">
    <BasePageTitle divider>
      <template #header>
        <div class="flex flex-col items-center justify-center">
          <UserAvatar
            :tooltip="false"
            size="96"
            :user-id="userCopy.id!"
          />
          <AppButtonUpload
            class="my-1"
            file-name="profile"
            accept="image/*"
            :url="`/api/users/${userCopy.id}/image`"
            @uploaded="auth.refresh()"
          />
        </div>
      </template>
      <template #title>
        {{ $t("profile.user-settings") }}
      </template>
    </BasePageTitle>

    <!-- ── Toggle: Profile ↔ Change Password ─────────────────────────────── -->
    <section class="mt-5">
      <ToggleState tag="article">
        <template #activator="{ toggle, modelValue: toggleState }">
          <button
            v-if="!toggleState && $appInfo.allowPasswordLogin"
            type="button"
            class="bs-btn bs-btn-md bs-btn-outline mt-2 mb-n3"
            @click="toggle"
          >
            <AppIcon :path="$globals.icons.lock" size="sm" />
            {{ $t("settings.change-password") }}
          </button>
          <button
            v-else-if="$appInfo.allowPasswordLogin"
            type="button"
            class="bs-btn bs-btn-md bs-btn-outline mt-2 mb-n3"
            @click="toggle"
          >
            <AppIcon :path="$globals.icons.user" size="sm" />
            {{ $t("settings.profile") }}
          </button>
        </template>

        <template #default="{ modelValue: toggleState }">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-x-3"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0 translate-x-3"
            mode="out-in"
          >
            <!-- Personal info form -->
            <div v-if="!toggleState" key="personal-info">
              <BaseCardSectionTitle class="mt-10" :title="$t('profile.personal-information')" />
              <div class="bs-card border border-border/40">
                <div class="bs-card-body space-y-3">
                  <div>
                    <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.username') }}</label>
                    <input
                      v-model="userCopy.username"
                      type="text"
                      required
                      class="w-full border-b border-border bg-transparent text-sm text-on-surface
                             focus:outline-none focus:border-primary transition-colors py-1"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.full-name') }}</label>
                    <input
                      v-model="userCopy.fullName"
                      type="text"
                      required
                      class="w-full border-b border-border bg-transparent text-sm text-on-surface
                             focus:outline-none focus:border-primary transition-colors py-1"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.email') }}</label>
                    <input
                      v-model="userCopy.email"
                      type="email"
                      required
                      class="w-full border-b border-border bg-transparent text-sm text-on-surface
                             focus:outline-none focus:border-primary transition-colors py-1"
                    />
                  </div>
                </div>
                <div class="flex justify-end px-4 pb-4">
                  <BaseButton update @click="updateUser" />
                </div>
              </div>
            </div>

            <!-- Change password form -->
            <div v-else key="change-password">
              <BaseCardSectionTitle class="mt-10" :title="$t('settings.change-password')" />
              <div class="bs-card border border-border/40">
                <div class="bs-card-body space-y-3">
                  <!-- Current password -->
                  <div>
                    <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.current-password') }}</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40" />
                      </div>
                      <input
                        v-model="password.current"
                        :type="showPassword ? 'text' : 'password'"
                        class="w-full border-b border-border bg-transparent text-sm text-on-surface pl-6 pr-8
                               focus:outline-none focus:border-primary transition-colors py-1"
                      />
                      <button
                        type="button"
                        class="absolute inset-y-0 right-0 flex items-center text-on-surface/40 hover:text-on-surface"
                        @click="showPassword = !showPassword"
                      >
                        <AppIcon :path="showPassword ? $globals.icons.eyeOff : $globals.icons.eye" size="sm" />
                      </button>
                    </div>
                  </div>

                  <!-- New password -->
                  <div>
                    <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.new-password') }}</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40" />
                      </div>
                      <input
                        v-model="password.newOne"
                        :type="showPassword ? 'text' : 'password'"
                        class="w-full border-b border-border bg-transparent text-sm text-on-surface pl-6 pr-8
                               focus:outline-none focus:border-primary transition-colors py-1"
                      />
                      <button
                        type="button"
                        class="absolute inset-y-0 right-0 flex items-center text-on-surface/40 hover:text-on-surface"
                        @click="showPassword = !showPassword"
                      >
                        <AppIcon :path="showPassword ? $globals.icons.eyeOff : $globals.icons.eye" size="sm" />
                      </button>
                    </div>
                  </div>

                  <!-- Confirm new password -->
                  <div>
                    <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.confirm-password') }}</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <AppIcon :path="$globals.icons.lock" size="sm" class="text-on-surface/40" />
                      </div>
                      <input
                        v-model="password.newTwo"
                        :type="showPassword ? 'text' : 'password'"
                        class="w-full border-b border-border bg-transparent text-sm text-on-surface pl-6 pr-8
                               focus:outline-none focus:border-primary transition-colors py-1"
                      />
                      <button
                        type="button"
                        class="absolute inset-y-0 right-0 flex items-center text-on-surface/40 hover:text-on-surface"
                        @click="showPassword = !showPassword"
                      >
                        <AppIcon :path="showPassword ? $globals.icons.eyeOff : $globals.icons.eye" size="sm" />
                      </button>
                    </div>
                    <p v-if="password.newTwo && !passwordsMatch" class="text-xs text-error mt-1">
                      {{ $t('user.password-must-match') }}
                    </p>
                  </div>

                  <UserPasswordStrength v-model="password.newOne" />
                </div>
                <div class="flex justify-end px-4 pb-4">
                  <BaseButton
                    update
                    :disabled="!passwordsMatch || password.current.length === 0"
                    @click="updatePassword"
                  />
                </div>
              </div>
            </div>
          </Transition>
        </template>
      </ToggleState>
    </section>

    <!-- ── Preferences ────────────────────────────────────────────────────── -->
    <section>
      <BaseCardSectionTitle class="mt-10" :title="$t('profile.preferences')" />
      <div class="bs-card border border-border/40">
        <div class="bs-card-body space-y-4">
          <!-- Default activity -->
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('user.default-activity') }}</label>
            <select
              v-model="selectedDefaultActivity"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              <option v-for="opt in activityOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <p class="text-xs text-on-surface/50 mt-1">{{ $t('user.default-activity-hint') }}</p>
          </div>

          <!-- Show announcements -->
          <label class="flex items-center gap-3 cursor-pointer text-sm text-on-surface">
            <input
              v-model="userCopy.showAnnouncements"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
              @change="updateUser"
            />
            {{ $t('announcements.show-announcements-from-mealie') }}
          </label>

          <!-- Advanced mode -->
          <label class="flex items-center gap-3 cursor-pointer text-sm text-on-surface">
            <input
              v-model="userCopy.advanced"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
              @change="updateUser"
            />
            {{ $t('profile.show-advanced-description') }}
          </label>
        </div>
      </div>

      <NuxtLink
        class="mt-5 flex flex-col items-center text-center text-primary text-sm hover:underline"
        to="/group"
      >
        {{ $t('profile.looking-for-privacy-settings') }}
      </NuxtLink>

      <div class="flex flex-wrap justify-center mt-5">
        <NuxtLink to="/user/profile" class="bs-btn bs-btn-md bs-btn-outline rounded-xl my-1 mx-1">
          <AppIcon :path="$globals.icons.backArrow" size="sm" />
          {{ $t('profile.back-to-profile') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import UserPasswordStrength from "~/components/Domain/User/UserPasswordStrength.vue";
import { useUserActivityPreferences } from "~/composables/use-users/preferences";
import useDefaultActivity from "~/composables/use-default-activity";
import { ActivityKey } from "~/lib/api/types/activity";
import type { UserBase } from "~/lib/api/types/user";

const { $globals, $appInfo } = useNuxtApp();
const i18n = useI18n();
const auth = useMealieAuth();
const { getDefaultActivityLabels, getActivityLabel, getActivityKey } = useDefaultActivity();
const user = computed(() => auth.user.value);

useSeoMeta({ title: i18n.t("settings.profile") });

const activityPreferences = useUserActivityPreferences();
const activityOptions = getDefaultActivityLabels(i18n);
const selectedDefaultActivity = ref(getActivityLabel(i18n, activityPreferences.value.defaultActivity));
watch(selectedDefaultActivity, () => {
  activityPreferences.value.defaultActivity = getActivityKey(i18n, selectedDefaultActivity.value) ?? ActivityKey.RECIPES;
});

const userCopy = ref({ ...user.value });
watch(user, () => {
  userCopy.value = { ...user.value };
});

const api = useUserApi();
const showPassword = ref(false);
const password = reactive({
  current: "",
  newOne: "",
  newTwo: "",
});

const passwordsMatch = computed(() => password.newOne === password.newTwo && password.newOne.length > 0);

async function updateUser() {
  const userData = userCopy.value;
  if (!userData?.id || !userData.email) return;

  const updatePayload: UserBase = {
    id: userData.id,
    username: userData.username,
    fullName: userData.fullName,
    email: userData.email,
    authMethod: userData.authMethod,
    admin: userData.admin,
    group: userData.group,
    household: userData.household,
    showAnnouncements: userData.showAnnouncements,
    advanced: userData.advanced,
    canInvite: userData.canInvite,
    canManage: userData.canManage,
    canManageHousehold: userData.canManageHousehold,
    canOrganize: userData.canOrganize,
  };

  const { response } = await api.users.updateOne(userData.id, updatePayload);
  if (response?.status === 200) {
    auth.refresh();
  }
}

async function updatePassword() {
  if (!userCopy.value?.id) return;
  const { response } = await api.users.changePassword({
    currentPassword: password.current,
    newPassword: password.newOne,
  });

  if (response?.status === 200) {
    console.log("Password Changed");
  }
}
</script>
