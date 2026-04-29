<template>
  <!-- BasePageTitle — replaces the Vuetify d-flex / text-h5 pattern -->
  <div class="mt-4">
    <section class="flex flex-col items-center">
      <slot name="header" />
      <h2 class="text-xl font-semibold text-on-surface">
        <slot name="title">👋 Here's a Title</slot>
      </h2>
      <p class="text-sm text-on-surface/70 mt-1">
        <slot />
      </p>
    </section>
    <section class="flex">
      <slot name="content" />
    </section>
    <hr v-if="divider" class="my-4 border-t border-border" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  divider: { type: Boolean, default: false },
});
</script>
