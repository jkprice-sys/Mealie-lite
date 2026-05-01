<template>
  <div class="min-h-screen bg-background">
    <TheSnackbar />

    <div
      v-if="$appInfo.demoStatus"
      class="sticky top-0 z-50 w-full bg-warning/20 border-b border-warning py-2 text-center text-sm font-semibold text-on-surface"
    >
      {{ $t("demo.info_message_with_version", { version: $appInfo.version }) }}
    </div>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import TheSnackbar from "~/components/Layout/LayoutParts/TheSnackbar.vue";
</script>
