<template>
  <div class="narrow-container mx-auto px-4 py-4">
    <BasePageTitle divider>
      <template #header>
        <img width="200" height="200" src="/svgs/manage-api-tokens.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t("settings.token.api-tokens") }}
      </template>
      {{ $t('settings.token.you-have-token-count', user?.tokens?.length ?? 0) }}
    </BasePageTitle>

    <!-- Create token -->
    <section class="flex justify-center mt-4">
      <div class="w-full bs-card-body space-y-3">
        <h3 class="text-base font-semibold">{{ $t("settings.token.create-an-api-token") }}</h3>

        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('settings.token.token-name') }}</label>
          <input
            v-model="name"
            type="text"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm
                   text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                   focus:border-primary transition-colors"
          />
        </div>

        <!-- Show created token -->
        <template v-if="createdToken">
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('settings.token.api-token') }}</label>
            <textarea
              v-model="createdToken"
              readonly
              rows="3"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                     text-on-surface font-mono focus:outline-none resize-none"
            />
          </div>
          <p class="text-xs text-on-surface/60">
            {{ $t("settings.token.copy-this-token-for-use-with-an-external-application-this-token-will-not-be-viewable-again") }}
          </p>
        </template>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <BaseButton v-if="createdToken" cancel @click="resetCreate()">
            {{ $t('general.close') }}
          </BaseButton>
          <div class="ml-auto flex items-center gap-2">
            <AppButtonCopy
              v-if="createdToken"
              :icon="false"
              color="info"
              :copy-text="createdToken"
            />
            <BaseButton
              v-else
              key="generate-button"
              :disabled="name === ''"
              @click="createToken(name)"
            >
              {{ $t('settings.token.generate') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Active tokens -->
    <BaseCardSectionTitle class="mt-10" :title="$t('settings.token.active-tokens')" />
    <section class="flex flex-col">
      <ul class="divide-y divide-border">
        <li
          v-for="(token, index) in user?.tokens"
          :key="index"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div>
            <p class="text-sm font-medium text-on-surface">{{ token.name }}</p>
            <p class="text-xs text-on-surface/60 mt-0.5">
              {{ $t('general.created-on-date', [$d(new Date(token.createdAt!))]) }}
            </p>
          </div>
          <BaseButton delete small @click="deleteToken(token.id)" />
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";

definePageMeta({ middleware: ["advanced-only"] });

const i18n = useI18n();
const auth = useMealieAuth();

useSeoMeta({ title: i18n.t("settings.token.api-tokens") });

const user = computed(() => auth.user.value);
const api = useUserApi();

const createdToken = ref("");
const name = ref("");
const loading = ref(false);

function resetCreate() {
  createdToken.value = "";
  loading.value      = false;
  name.value         = "";
  auth.refresh();
}

async function createToken(tokenName: string) {
  if (loading.value) { resetCreate(); return; }
  if (!tokenName) return;
  loading.value = true;

  const { data } = await api.users.createAPIToken({ name: tokenName });
  if (data) createdToken.value = data.token;

  loading.value = false;
}

async function deleteToken(id: number) {
  await api.users.deleteAPIToken(id);
  auth.refresh();
}
</script>
