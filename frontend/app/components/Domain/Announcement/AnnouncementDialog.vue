<template>
  <BaseDialog
    v-if="currentAnnouncement"
    v-model="dialog"
    :title="$t('announcements.announcements')"
    :icon="$globals.icons.bullhornVariant"
    :cancel-text="$t('general.done')"
    width="100%"
    max-width="1200"
  >
    <div class="flex" :style="{ height: useMobile ? '100%' : '60vh', minHeight: '60vh' }">
      <!-- Nav sidebar -->
      <div
        v-show="!useMobile || navOpen"
        class="overflow-y-auto border-r border-border shrink-0 py-1"
        style="width: 200px; max-height: 60vh"
      >
        <button
          v-for="announcement in allAnnouncements.toReversed()"
          :key="announcement.key"
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col gap-0.5 text-sm"
          :class="currentAnnouncement.key === announcement.key
            ? 'bg-primary text-on-primary'
            : 'text-on-surface hover:bg-primary/10'"
          @click="setCurrentAnnouncement(announcement); navOpen = false"
        >
          <span class="font-medium leading-snug">{{ announcement.meta?.title }}</span>
          <span v-if="announcement.date" class="text-xs opacity-70">{{ $d(announcement.date) }}</span>
          <span
            v-if="newAnnouncements.some(a => a.key === announcement.key)"
            class="inline-flex items-center"
          >
            <AppIcon :path="$globals.icons.alertCircle" size="xs" class="text-info" />
          </span>
        </button>
      </div>

      <!-- Main content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Mobile nav toggle -->
        <button
          v-if="useMobile"
          type="button"
          class="inline-flex items-center gap-1 mt-2 ms-2 px-2 py-1 rounded text-sm text-on-surface/70 hover:bg-on-surface/10 transition-colors"
          @click="navOpen = !navOpen"
        >
          <AppIcon :path="navOpen ? $globals.icons.chevronLeft : $globals.icons.chevronRight" size="sm" />
          {{ $t("announcements.all-announcements") }}
        </button>

        <!-- Announcement title -->
        <div class="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
          <span
            v-if="currentAnnouncement.date"
            class="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-on-surface/70"
          >
            <AppIcon :path="$globals.icons.calendar" size="xs" />
            {{ $d(currentAnnouncement.date) }}
          </span>
          <span class="font-semibold text-on-surface">{{ currentAnnouncement.meta?.title }}</span>
        </div>

        <!-- Announcement body -->
        <div class="px-4 py-2 text-sm text-on-surface">
          <component :is="currentAnnouncement.component" />
        </div>
      </div>
    </div>

    <template #custom-card-action>
      <BaseButton
        v-if="newAnnouncements.length"
        color="success"
        :icon="$globals.icons.textBoxCheckOutline"
        :text="$t('announcements.mark-all-as-read')"
        @click="markAllAsRead"
      />
      <BaseButton
        :disabled="isLastAnnouncement(currentAnnouncement.key)"
        color="info"
        :icon="$globals.icons.arrowRightBold"
        icon-right
        :text="$t('general.next')"
        @click="nextAnnouncement"
      />
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { useAnnouncements } from "~/composables/use-announcements";
import type { Announcement } from "~/composables/use-announcements";

const dialog = defineModel<boolean>({ default: false });
const { $globals } = useNuxtApp();

const bp = useBreakpoints(breakpointsTailwind);
const useMobile = bp.smallerOrEqual("sm");
const navOpen = ref(false);

const route = useRoute();
watch(() => route.fullPath, () => { dialog.value = false; });

const { newAnnouncements, allAnnouncements, setLastRead, markAllAsRead } = useAnnouncements();

const currentAnnouncement = shallowRef<Announcement | undefined>();

watch(dialog, () => {
  if (!dialog.value || currentAnnouncement.value) {
    return;
  }

  // Show first unread on open, or fall back to the newest
  const next = newAnnouncements.value.at(0) || allAnnouncements.at(-1)!;
  setCurrentAnnouncement(next);
});

function setCurrentAnnouncement(announcement: Announcement) {
  currentAnnouncement.value = announcement;
  setLastRead(announcement.key);
}

function nextAnnouncement() {
  const next = newAnnouncements.value.find(a => a.key > currentAnnouncement.value!.key);
  if (next) {
    setCurrentAnnouncement(next);
  }
}

function isLastAnnouncement(key: string) {
  if (!newAnnouncements.value.length) {
    return true;
  }
  else {
    return key >= newAnnouncements.value.at(-1)!.key;
  }
}
</script>
