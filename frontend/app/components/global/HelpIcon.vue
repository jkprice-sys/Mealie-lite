<template>
  <div ref="containerRef" class="relative inline-block text-center">
    <button
      type="button"
      class="rounded-full hover:bg-primary/10 text-on-surface/50 hover:text-on-surface transition-colors focus:outline-none"
      :class="small ? 'p-0.5' : 'p-1'"
      @click.stop="isOpen = !isOpen"
      @mouseenter="isOpen = true"
      @mouseleave="isOpen = false"
    >
      <AppIcon :path="$globals.icons.help" :size="small ? 'xs' : 'sm'" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 bottom-full mb-1 max-w-[300px] rounded-lg border border-border bg-surface shadow-lg px-3 py-2 text-sm text-on-surface text-left"
        :class="right ? 'right-0' : 'left-0'"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";

defineProps({
  small: { type: Boolean, default: false },
  right: { type: Boolean, default: false },
});

const { $globals } = useNuxtApp();
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
onClickOutside(containerRef, () => { isOpen.value = false; });
</script>
