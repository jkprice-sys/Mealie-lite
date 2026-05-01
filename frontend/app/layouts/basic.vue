<template>
  <div class="min-h-screen bg-background">
    <TheSnackbar />
    <AppHeader :menu="false" />
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import TheSnackbar from "~/components/Layout/LayoutParts/TheSnackbar.vue";
import AppHeader from "@/components/Layout/LayoutParts/AppHeader.vue";
import { useGlobalI18n } from "~/composables/use-global-i18n";

useGlobalI18n(); // ensure i18n is initialized
</script>
