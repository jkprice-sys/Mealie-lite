<template>
  <div class="relative inline-block" :class="btnClass">
    <button
      type="button"
      class="bs-btn bs-btn-sm bs-btn-ghost"
      :disabled="!copyText"
      @click="textToClipboard"
    >
      <AppIcon :path="$globals.icons.contentCopy" size="sm" />
      <span v-if="!icon">{{ $t("general.copy") }}</span>
    </button>

    <!-- Feedback tooltip -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show && copiedSuccess !== null"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded
               text-xs text-white bg-on-surface/80 whitespace-nowrap z-10"
      >
        <AppIcon
          :path="copiedSuccess ? $globals.icons.clipboardCheck : $globals.icons.close"
          size="sm"
          class="inline mr-1"
        />
        {{ copiedSuccess ? $t("general.copied_message") : $t("general.clipboard-copy-failure") }}
      </div>
      <div
        v-else-if="show && !isSupported"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded
               text-xs text-white bg-on-surface/80 whitespace-nowrap z-10"
      >
        {{ $t("general.your-browser-does-not-support-clipboard") }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const { $globals } = useNuxtApp();

const props = defineProps({
  copyText: { type: String, required: true },
  color:    { type: String, default: "" },
  icon:     { type: Boolean, default: true },
  btnClass: { type: String, default: "" },
});

const { copy, copied, isSupported } = useClipboard();
const show = ref(false);
const copiedSuccess = ref<boolean | null>(null);

async function textToClipboard() {
  if (isSupported.value) {
    await copy(props.copyText);
    copiedSuccess.value = copied.value;
    if (!copied.value) console.error("Copy failed");
  }
  else {
    console.warn("Clipboard not supported on this browser (requires HTTPS).");
    copiedSuccess.value = null;
  }
  show.value = true;
  setTimeout(() => { show.value = false; }, 3000);
}
</script>
