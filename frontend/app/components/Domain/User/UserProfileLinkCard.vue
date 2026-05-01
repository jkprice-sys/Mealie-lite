<template>
  <NuxtLink
    :to="link.to"
    class="flex flex-col h-full mt-4 rounded-xl border border-border bg-surface hover:bg-primary/5 transition-colors overflow-hidden no-underline"
  >
    <!-- Mobile: image centered at top -->
    <div v-if="smAndDown && image" class="p-3 flex justify-center border-b border-border">
      <img :src="image" class="w-[150px] h-[125px] object-cover rounded" />
    </div>

    <!-- Main body -->
    <div class="flex justify-between items-stretch flex-1">
      <div class="flex flex-col">
        <div class="px-4 pt-4 pb-1 font-medium text-on-surface">
          <slot name="title" />
        </div>
        <div class="px-4 pb-4 text-sm text-on-surface/70 flex flex-row">
          <slot name="default" />
        </div>
      </div>
      <!-- Desktop: image on right -->
      <div v-if="!smAndDown && image" class="py-2 px-10 my-auto shrink-0">
        <img :src="image" class="w-[150px] h-[125px] object-cover rounded" />
      </div>
    </div>

    <hr class="border-border" />

    <div class="px-4 py-2">
      <span class="text-sm font-medium text-info">{{ link.text }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";

interface LinkProp {
  text: string;
  url?: string;
  to: string;
}

defineProps({
  link: {
    type: Object as () => LinkProp,
    required: true,
  },
  image: {
    type: String,
    required: false,
    default: "",
  },
});

const bp = useBreakpoints(breakpointsTailwind);
const smAndDown = bp.smallerOrEqual("sm");
</script>
