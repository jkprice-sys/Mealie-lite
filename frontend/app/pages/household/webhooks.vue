<template>
  <div class="narrow-container mx-auto px-4 py-6">
    <BasePageTitle divider>
      <template #header>
        <img width="125" height="125" src="/svgs/manage-webhooks.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('settings.webhooks.webhooks') }}
      </template>
      <p class="text-sm text-on-surface/70">{{ $t('settings.webhooks.description') }}</p>
    </BasePageTitle>

    <BaseButton create class="mt-4" @click="actions.createOne()" />

    <div class="mt-3 space-y-2">
      <div
        v-for="(webhook, index) in webhooks"
        :key="index"
        class="rounded-lg border border-border bg-surface overflow-hidden"
      >
        <!-- Panel header -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors"
          @click="toggleOpen(index)"
        >
          <AppIcon
            :path="$globals.icons.webhook"
            size="sm"
            :class="webhook.enabled ? 'text-info' : 'text-on-surface/40'"
          />
          <span class="flex-1 text-sm font-medium text-on-surface">
            {{ webhook.name }} - {{ $d(timeUTC(webhook.scheduledTime), "time") }}
          </span>
          <AppIcon
            :path="openIndex === index ? $globals.icons.chevronUp : $globals.icons.chevronDown"
            size="sm"
            class="text-on-surface/40 shrink-0"
          />
        </button>

        <!-- Panel body -->
        <div v-if="openIndex === index" class="border-t border-border">
          <GroupWebhookEditor
            :key="webhook.id"
            :webhook="webhook"
            @save="actions.updateOne($event)"
            @delete="actions.deleteOne($event)"
            @test="actions.testOne($event).then(() => alert.success($t('events.test-message-sent')))"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGroupWebhooks, timeUTC } from "~/composables/use-group-webhooks";
import GroupWebhookEditor from "~/components/Domain/Household/GroupWebhookEditor.vue";
import { alert } from "~/composables/use-toast";

definePageMeta({
  middleware: ["advanced-only", "lite-mode"],
});

const i18n = useI18n();
const { $globals } = useNuxtApp();
const { actions, webhooks } = useGroupWebhooks();

const openIndex = ref<number | null>(null);
function toggleOpen(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}

useSeoMeta({
  title: i18n.t("settings.webhooks.webhooks"),
});
</script>
