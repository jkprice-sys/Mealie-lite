<template>
  <!--
    DefaultLayout — sidebar-free layout for ByteSized.
    Navigation lives entirely in AppHeader (inline on desktop, hamburger on mobile).
    v-app is kept as root so Vuetify dialogs/overlays that haven't been migrated yet
    can still teleport into it.
  -->
  <v-app>
    <TheSnackbar />

    <!-- Top navigation bar (includes all nav links) -->
    <AppHeader />

    <!-- Main content — offset below fixed header only -->
    <main class="pt-12 min-h-screen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <NuxtPage />
      </div>
    </main>
  </v-app>
</template>

<script setup lang="ts">
// DefaultLayout is now a thin shell — all navigation is in AppHeader.
</script>
