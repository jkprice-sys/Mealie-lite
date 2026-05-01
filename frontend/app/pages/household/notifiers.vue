<template>
  <div class="narrow-container mx-auto px-4 py-6">
    <!-- Delete confirm dialog -->
    <BaseDialog
      v-model="state.deleteDialog"
      color="error"
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="deleteNotifier(state.deleteTargetId)"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t("general.confirm-delete-generic") }}
      </div>
    </BaseDialog>

    <!-- Create dialog -->
    <BaseDialog
      v-model="state.createDialog"
      :title="$t('events.new-notification')"
      :icon="$globals.icons.bellPlus"
      can-submit
      @submit="createNewNotifier"
    >
      <div class="px-4 py-3 space-y-3">
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.name') }}</label>
          <input
            v-model="createNotifierData.name"
            type="text"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('events.apprise-url') }}</label>
          <input
            v-model="createNotifierData.appriseUrl"
            type="text"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
      </div>
    </BaseDialog>

    <BasePageTitle divider>
      <template #header>
        <img width="125" height="125" src="/svgs/manage-notifiers.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t("events.event-notifiers") }}
      </template>
      <p class="text-sm text-on-surface/70 mb-3">{{ $t("events.new-notification-form-description") }}</p>
      <div class="flex flex-wrap gap-3">
        <a href="https://github.com/caronc/apprise/wiki" target="_blank" class="text-sm text-primary hover:underline">Apprise</a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_gotify" target="_blank" class="text-sm text-primary hover:underline">Gotify</a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_discord" target="_blank" class="text-sm text-primary hover:underline">Discord</a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_homeassistant" target="_blank" class="text-sm text-primary hover:underline">Home Assistant</a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_matrix" target="_blank" class="text-sm text-primary hover:underline">Matrix</a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_pushover" target="_blank" class="text-sm text-primary hover:underline">Pushover</a>
      </div>
    </BasePageTitle>

    <BaseButton create class="mt-4" @click="state.createDialog = true" />

    <div v-if="notifiers" class="mt-3 space-y-2">
      <div
        v-for="(notifier, index) in notifiers"
        :key="index"
        class="rounded-lg border border-border bg-surface overflow-hidden"
      >
        <!-- Panel header -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors"
          @click="toggleOpen(index)"
        >
          <span class="flex-1 text-sm font-medium text-on-surface">{{ notifier.name }}</span>
          <AppIcon
            :path="openIndex === index ? $globals.icons.chevronUp : $globals.icons.chevronDown"
            size="sm"
            class="text-on-surface/40 shrink-0"
          />
        </button>

        <!-- Panel body -->
        <div v-if="openIndex === index" class="border-t border-border px-4 py-3 space-y-3">
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.name') }}</label>
            <input
              v-model="notifiers[index].name"
              type="text"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('events.apprise-url-skipped-if-blank') }}</label>
            <input
              v-model="notifiers[index].appriseUrl"
              type="text"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
            <p class="mt-1 text-xs text-on-surface/50">{{ $t('events.apprise-url-is-left-intentionally-blank') }}</p>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="notifiers[index].enabled" type="checkbox" class="accent-primary" />
            <span class="text-sm text-on-surface">{{ $t('events.enable-notifier') }}</span>
          </label>

          <hr class="border-border" />
          <p class="text-sm font-medium text-on-surface">{{ $t("events.what-events") }}</p>

          <div class="notifier-options">
            <section v-for="sec in optionsSections" :key="sec.id">
              <h4 class="text-xs font-semibold text-on-surface/60 uppercase tracking-wide mb-1">{{ sec.text }}</h4>
              <label
                v-for="opt in sec.options"
                :key="opt.key"
                class="flex items-center gap-2 cursor-pointer py-0.5"
              >
                <input
                  v-model="notifiers[index].options[opt.key]"
                  type="checkbox"
                  class="accent-primary"
                />
                <span class="text-sm text-on-surface">{{ opt.text }}</span>
              </label>
            </section>
          </div>

          <div class="flex justify-end pt-1">
            <BaseButtonGroup
              :buttons="[
                { icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete' },
                { icon: $globals.icons.testTube, text: $t('general.test'), event: 'test' },
                { icon: $globals.icons.save, text: $t('general.save'), event: 'save' },
              ]"
              @delete="openDelete(notifier)"
              @save="saveNotifier(notifier)"
              @test="testNotifier(notifier)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { useAsyncKey } from "~/composables/use-utils";
import type { GroupEventNotifierCreate, GroupEventNotifierOut } from "~/lib/api/types/household";

interface OptionKey {
  text: string;
  key: keyof GroupEventNotifierOut["options"];
}

interface OptionSection {
  id: number;
  text: string;
  options: OptionKey[];
}

definePageMeta({
  middleware: ["advanced-only", "lite-mode"],
});

const api = useUserApi();
const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("profile.notifiers"),
});

const state = reactive({
  deleteDialog: false,
  createDialog: false,
  deleteTargetId: "",
});

const openIndex = ref<number | null>(null);
function toggleOpen(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}

const { data: notifiers } = useAsyncData(useAsyncKey(), async () => {
  const { data } = await api.groupEventNotifier.getAll();
  return data?.items;
});

async function refreshNotifiers() {
  const { data } = await api.groupEventNotifier.getAll();
  notifiers.value = data?.items;
}

const createNotifierData: GroupEventNotifierCreate = reactive({
  name: "",
  enabled: true,
  appriseUrl: "",
});

async function createNewNotifier() {
  await api.groupEventNotifier.createOne(createNotifierData);
  refreshNotifiers();
}

function openDelete(notifier: GroupEventNotifierOut) {
  state.deleteDialog = true;
  state.deleteTargetId = notifier.id;
}

async function deleteNotifier(targetId: string) {
  await api.groupEventNotifier.deleteOne(targetId);
  refreshNotifiers();
  state.deleteTargetId = "";
}

async function saveNotifier(notifier: GroupEventNotifierOut) {
  await api.groupEventNotifier.updateOne(notifier.id, notifier);
  refreshNotifiers();
}

async function testNotifier(notifier: GroupEventNotifierOut) {
  await api.groupEventNotifier.test(notifier.id);
}

const optionsSections: OptionSection[] = [
  {
    id: 1,
    text: i18n.t("events.recipe-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "recipeCreated" },
      { text: i18n.t("general.update") as string, key: "recipeUpdated" },
      { text: i18n.t("general.delete") as string, key: "recipeDeleted" },
    ],
  },
  {
    id: 2,
    text: i18n.t("events.user-events"),
    options: [
      { text: i18n.t("events.when-a-new-user-joins-your-group"), key: "userSignup" },
    ],
  },
  {
    id: 3,
    text: i18n.t("events.mealplan-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "mealplanEntryCreated" },
      { text: i18n.t("general.update") as string, key: "mealplanEntryUpdated" },
      { text: i18n.t("general.delete") as string, key: "mealplanEntryDeleted" },
    ],
  },
  {
    id: 4,
    text: i18n.t("events.shopping-list-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "shoppingListCreated" },
      { text: i18n.t("general.update") as string, key: "shoppingListUpdated" },
      { text: i18n.t("general.delete") as string, key: "shoppingListDeleted" },
    ],
  },
  {
    id: 5,
    text: i18n.t("events.cookbook-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "cookbookCreated" },
      { text: i18n.t("general.update") as string, key: "cookbookUpdated" },
      { text: i18n.t("general.delete") as string, key: "cookbookDeleted" },
    ],
  },
  {
    id: 6,
    text: i18n.t("events.tag-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "tagCreated" },
      { text: i18n.t("general.update") as string, key: "tagUpdated" },
      { text: i18n.t("general.delete") as string, key: "tagDeleted" },
    ],
  },
  {
    id: 7,
    text: i18n.t("events.category-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "categoryCreated" },
      { text: i18n.t("general.update") as string, key: "categoryUpdated" },
      { text: i18n.t("general.delete") as string, key: "categoryDeleted" },
    ],
  },
  {
    id: 8,
    text: i18n.t("events.label-events"),
    options: [
      { text: i18n.t("general.create") as string, key: "labelCreated" },
      { text: i18n.t("general.update") as string, key: "labelUpdated" },
      { text: i18n.t("general.delete") as string, key: "labelDeleted" },
    ],
  },
];
</script>

<style>
.notifier-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
