<template>
  <div>
    <BaseDialog
      v-model="dialog"
      :title="$t('recipe-share.share-recipe')"
      :icon="$globals.icons.link"
    >
      <div class="px-4 py-3 space-y-3">
        <!-- Expiration date field -->
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe-share.expiration-date') }}</label>
          <div class="flex items-center gap-2">
            <AppIcon :path="$globals.icons.calendar" size="sm" class="text-on-surface/40 shrink-0" />
            <input
              :value="expirationDate.toISOString().slice(0, 10)"
              type="date"
              class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              @change="expirationDate = new Date(($event.target as HTMLInputElement).value)"
            />
          </div>
          <p class="mt-1 text-xs text-on-surface/50">{{ $t('recipe-share.default-30-days') }}</p>
        </div>

        <!-- Create new token button -->
        <div class="flex justify-end">
          <BaseButton @click="createNewToken">{{ $t("general.new") }}</BaseButton>
        </div>

        <!-- Token list -->
        <div v-if="tokens.length" class="divide-y divide-border rounded-lg border border-border overflow-hidden">
          <div
            v-for="token in tokens"
            :key="token.id"
            class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors"
            @click="shareRecipe(token.id)"
          >
            <!-- Icon avatar -->
            <div class="w-8 h-8 rounded-full bg-on-surface/10 flex items-center justify-center shrink-0">
              <AppIcon :path="$globals.icons.link" size="sm" />
            </div>
            <!-- Expiry info -->
            <span class="flex-1 text-sm text-on-surface">
              {{ $t("recipe-share.expires-at") + ' ' + $d(new Date(token.expiresAt!), "short") }}
            </span>
            <!-- Delete button -->
            <button
              type="button"
              class="p-1 rounded hover:bg-error/10 text-on-surface/40 hover:text-error transition-colors"
              @click.stop="deleteToken(token.id)"
            >
              <AppIcon :path="$globals.icons.delete" size="sm" />
            </button>
            <!-- Copy button -->
            <button
              type="button"
              class="p-1 rounded hover:bg-info/10 text-on-surface/40 hover:text-info transition-colors"
              @click.stop="copyTokenLink(token.id)"
            >
              <AppIcon :path="$globals.icons.contentCopy" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { useClipboard, useShare, whenever } from "@vueuse/core";
import type { RecipeShareToken } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";
import { useHouseholdSelf } from "~/composables/use-households";
import { alert } from "~/composables/use-toast";

interface Props {
  recipeId: string;
  name: string;
}
const props = defineProps<Props>();

const dialog = defineModel<boolean>({ default: false });

const datePickerMenu = ref(false);
const expirationDate = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000));
const tokens = ref<RecipeShareToken[]>([]);

whenever(
  () => dialog.value,
  () => {
    // Set expiration date to today + 30 Days
    const today = new Date();
    expirationDate.value = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    refreshTokens();
  },
);

const i18n = useI18n();
const auth = useMealieAuth();
const { household } = useHouseholdSelf();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const firstDayOfWeek = computed(() => {
  return household.value?.preferences?.firstDayOfWeek || 0;
});

// ============================================================
// Token Actions

const userApi = useUserApi();

async function createNewToken() {
  // Convert expiration date to timestamp
  const { data } = await userApi.recipes.share.createOne({
    recipeId: props.recipeId,
    expiresAt: expirationDate.value.toISOString(),
  });

  if (data) {
    tokens.value.push(data);
  }
}

async function deleteToken(id: string) {
  await userApi.recipes.share.deleteOne(id);
  tokens.value = tokens.value.filter(token => token.id !== id);
}

async function refreshTokens() {
  const { data } = await userApi.recipes.share.getAll(1, -1, { recipe_id: props.recipeId });

  if (data) {
    // @ts-expect-error - TODO: This routes doesn't have pagination, but the type are mismatched.
    tokens.value = data ?? [];
  }
}

const { share, isSupported: shareIsSupported } = useShare();
const { copy, copied, isSupported } = useClipboard();

function getRecipeText() {
  return i18n.t("recipe.share-recipe-message", [props.name]);
}

function getTokenLink(token: string) {
  return `${window.location.origin}/g/${groupSlug.value}/shared/r/${token}`;
}

async function copyTokenLink(token: string) {
  if (isSupported.value) {
    await copy(getTokenLink(token));
    if (copied.value) {
      alert.success(i18n.t("recipe-share.recipe-link-copied-message") as string);
    }
    else {
      alert.error(i18n.t("general.clipboard-copy-failure") as string);
    }
  }
  else {
    alert.error(i18n.t("general.clipboard-not-supported") as string);
  }
}

async function shareRecipe(token: string) {
  if (shareIsSupported) {
    share({
      title: props.name,
      url: getTokenLink(token),
      text: getRecipeText() as string,
    });
  }
  else {
    await copyTokenLink(token);
  }
}
</script>
