<template>
  <div
    v-if="wakeIsSupported"
    class="print:hidden flex px-2"
    :class="smAndDown ? 'justify-center' : 'justify-end'"
  >
    <label class="inline-flex items-center gap-3 cursor-pointer select-none">
      <span class="text-sm text-on-surface/70">{{ $t('recipe.screen-awake') }}</span>
      <button
        type="button"
        role="switch"
        :aria-checked="isActive"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        :class="isActive ? 'bg-primary' : 'bg-on-surface/20'"
        @click="toggleWakeLock"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          :class="isActive ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
    </label>
  </div>
</template>

<script setup lang="ts">
import { useWakeLock, useBreakpoints, breakpointsTailwind } from "@vueuse/core";

const bp = useBreakpoints(breakpointsTailwind);
const smAndDown = bp.smallerOrEqual("sm");

const { isSupported: wakeIsSupported, isActive, request, release } = useWakeLock();

function toggleWakeLock() {
  if (isActive.value) unlockScreen();
  else lockScreen();
}

async function lockScreen() {
  if (wakeIsSupported.value) {
    console.debug("Wake Lock Requested");
    await request("screen");
  }
}

async function unlockScreen() {
  if (wakeIsSupported.value || isActive.value) {
    console.debug("Wake Lock Released");
    await release();
  }
}

onMounted(() => lockScreen());
onUnmounted(() => unlockScreen());
</script>
