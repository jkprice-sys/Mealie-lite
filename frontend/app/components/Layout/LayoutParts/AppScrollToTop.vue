<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-90"
    >
      <button
        v-if="showButton"
        type="button"
        class="fixed bottom-6 right-6 z-[999] bs-btn bs-btn-md bs-btn-primary
               rounded-full shadow-lg w-11 h-11 flex items-center justify-center print:hidden"
        :title="$t('general.scroll-to-top')"
        @click="scrollToTop"
      >
        <AppIcon :path="$globals.icons.arrowUp" size="md" />
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { $globals } = useNuxtApp();

const showButton = ref(false);
const threshold = 400;

function onScroll() {
  showButton.value = document.documentElement.scrollTop > threshold;
}

function scrollToTop() {
  document.documentElement.scrollTop = 0;
}

onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>
