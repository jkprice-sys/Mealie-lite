<template>
  <!-- AppFooter — Tailwind replacement for v-footer / v-row / v-col -->
  <footer class="bg-primary text-white py-2 text-center text-sm print:hidden">
    <a
      href="https://github.com/mealie-recipes/mealie"
      target="_blank"
      class="inline-flex items-center text-white hover:text-white/80 transition-colors mr-1"
      aria-label="GitHub"
    >
      <AppIcon :path="$globals.icons.github" size="md" />
    </a>
    {{ new Date().getFullYear() }} — <strong>Mealie</strong>
  </footer>
</template>

<script setup lang="ts">
const { $globals } = useNuxtApp();
</script>
