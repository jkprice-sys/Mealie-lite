<template>
  <Teleport to="body">

    <!-- ── Alert toast (top, auto-dismisses after 2 s) ─────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="toastAlert.open"
        class="fixed top-16 left-1/2 -translate-x-1/2 z-[9999]
               flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
               text-white text-sm min-w-[200px] max-w-sm print:hidden"
        :class="alertBg"
      >
        <AppIcon v-if="icon" :path="icon" size="sm" class="shrink-0" />
        <span class="flex-1">
          <span v-if="toastAlert.title" class="font-semibold mr-1">{{ toastAlert.title }}</span>
          {{ toastAlert.text }}
        </span>
        <button
          type="button"
          class="shrink-0 text-white/70 hover:text-white transition-colors ml-1"
          @click="toastAlert.open = false"
        >
          <AppIcon :path="$globals.icons.close" size="sm" />
        </button>
      </div>
    </Transition>

    <!-- ── Loading toast (bottom, manual close) ────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="toastLoading.open"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
               px-5 py-3 rounded-lg shadow-lg text-white text-sm
               min-w-[220px] max-w-sm text-center cursor-pointer print:hidden"
        :class="loadingBg"
        @click="toastLoading.open = false"
      >
        <p class="mb-2 font-medium">{{ toastLoading.text }}</p>
        <!-- Indeterminate progress bar -->
        <div class="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div class="h-full bg-white rounded-full animate-progress-indeterminate" />
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup lang="ts">
import { toastAlert, toastLoading } from "~/composables/use-toast";

const { $globals } = useNuxtApp();

// ── Alert icon by color ─────────────────────────────────────────────────────
const icon = computed(() => {
  switch (toastAlert.color) {
    case "error":   return $globals.icons.alertOutline;
    case "success": return $globals.icons.checkBold;
    case "info":    return $globals.icons.informationOutline;
    default:        return $globals.icons.alertOutline;
  }
});

// ── Background classes by color ─────────────────────────────────────────────
function colorBg(color: string) {
  switch (color) {
    case "error":   return "bg-error";
    case "success": return "bg-success";
    case "warning": return "bg-warning";
    default:        return "bg-info";
  }
}
const alertBg   = computed(() => colorBg(toastAlert.color));
const loadingBg = computed(() => colorBg(toastLoading.color));

// ── Auto-dismiss alert after 2 s ────────────────────────────────────────────
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

watch(() => toastAlert.open, (open) => {
  if (dismissTimer) clearTimeout(dismissTimer);
  if (open) {
    dismissTimer = setTimeout(() => { toastAlert.open = false; }, 2000);
  }
});
</script>

<style scoped>
@keyframes progress-indeterminate {
  0%   { transform: translateX(-100%) scaleX(0.5); }
  50%  { transform: translateX(50%)  scaleX(0.6); }
  100% { transform: translateX(200%) scaleX(0.5); }
}
.animate-progress-indeterminate {
  animation: progress-indeterminate 1.4s ease-in-out infinite;
}
</style>
