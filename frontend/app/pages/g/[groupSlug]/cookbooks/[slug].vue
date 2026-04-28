<template>
  <CookbookPage />
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["lite-mode"] });
import CookbookPage from "@/components/Domain/Cookbook/CookbookPage.vue";
</script>
