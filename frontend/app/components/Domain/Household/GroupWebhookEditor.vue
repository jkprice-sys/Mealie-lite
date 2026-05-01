<template>
  <div>
    <div class="px-4 py-3 space-y-3">
      <!-- Enabled toggle -->
      <label class="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          role="switch"
          :aria-checked="webhookCopy.enabled"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0"
          :class="webhookCopy.enabled ? 'bg-primary' : 'bg-on-surface/20'"
          @click="webhookCopy.enabled = !webhookCopy.enabled"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
            :class="webhookCopy.enabled ? 'translate-x-4' : 'translate-x-0.5'"
          />
        </button>
        <span class="text-sm text-on-surface">{{ $t('general.enabled') }}</span>
      </label>

      <!-- Webhook name -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('settings.webhooks.webhook-name') }}</label>
        <input
          v-model="webhookCopy.name"
          type="text"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      <!-- Webhook URL -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('settings.webhooks.webhook-url') }}</label>
        <input
          v-model="webhookCopy.url"
          type="text"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      <!-- Scheduled time -->
      <div>
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('settings.webhooks.scheduled-time') }}</label>
        <div class="flex items-center gap-2">
          <input
            v-model="scheduledTime"
            type="time"
            class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
          <button
            v-if="scheduledTime"
            type="button"
            class="p-2 rounded-lg hover:bg-on-surface/10 text-on-surface/40 transition-colors"
            @click="scheduledTime = ''"
          >
            <AppIcon :path="$globals.icons.close" size="sm" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex justify-end px-4 py-2">
      <BaseButtonGroup
        :buttons="[
          {
            icon: $globals.icons.delete,
            text: $t('general.delete'),
            event: 'delete',
          },
          {
            icon: $globals.icons.testTube,
            text: $t('general.test'),
            event: 'test',
          },
          {
            icon: $globals.icons.save,
            text: $t('general.save'),
            event: 'save',
          },
        ]"
        @delete="$emit('delete', webhookCopy.id)"
        @save="handleSave"
        @test="$emit('test', webhookCopy.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReadWebhook } from "~/lib/api/types/household";
import { timeLocalToUTC, timeUTCToLocal } from "~/composables/use-group-webhooks";

const props = defineProps<{
  webhook: ReadWebhook;
}>();

const emit = defineEmits<{
  delete: [id: string];
  save: [webhook: ReadWebhook];
  test: [id: string];
}>();

const i18n = useI18n();
const { $globals } = useNuxtApp();
const itemUTC = ref<string>(props.webhook.scheduledTime);
const itemLocal = ref<string>(timeUTCToLocal(props.webhook.scheduledTime));

const scheduledTime = computed({
  get() {
    return itemLocal.value;
  },
  set(v: string) {
    itemUTC.value = timeLocalToUTC(v);
    itemLocal.value = v;
  },
});

const webhookCopy = ref({ ...props.webhook });

function handleSave() {
  webhookCopy.value.scheduledTime = itemLocal.value;
  emit("save", webhookCopy.value);
}

// Set page title using useSeoMeta
useSeoMeta({
  title: i18n.t("settings.webhooks.webhooks"),
});
</script>
