<template>
  <!--
    AppHeader — Tailwind replacement for v-app-bar.
    Fixed h-12 green bar. Slot receives the hamburger button from DefaultLayout.
    Keeps z-[2010] to sit above Vuetify dialogs that haven't been migrated yet.
  -->
  <header
    class="fixed top-0 left-0 right-0 h-12 bg-primary text-white
           flex items-center gap-1 px-2 z-[2010] print:hidden"
  >
    <!-- Hamburger button injected by DefaultLayout -->
    <slot />

    <!-- Logo -->
    <RouterLink :to="routerLink" class="flex items-center text-white no-underline ml-1">
      <AppIcon :path="$globals.icons.primary" size="lg" />
    </RouterLink>

    <!-- App title -->
    <span
      class="pl-1 font-semibold text-base cursor-pointer select-none"
      @click="$router.push(routerLink)"
    >
      ByteSized
    </span>

    <!-- Search dialog (opened programmatically) -->
    <RecipeDialogSearch ref="domSearchDialog" />

    <div class="flex-1" />

    <template v-if="menu">
      <!-- Search: icon on xs, pill on sm+ -->
      <button
        v-if="xs"
        type="button"
        class="bs-btn bs-btn-sm text-white rounded-full hover:bg-white/20 transition-colors"
        @click="activateSearch"
      >
        <AppIcon :path="$globals.icons.search" size="md" />
      </button>
      <button
        v-else
        type="button"
        class="flex items-center gap-2 bg-white/15 hover:bg-white/25
               rounded-full px-3 py-1 text-sm text-white/90 transition-colors mr-1"
        @click="activateSearch"
      >
        <AppIcon :path="$globals.icons.search" size="sm" />
        {{ $t('search.search-hint') }}
      </button>

      <!-- Logout -->
      <button
        v-if="loggedIn"
        type="button"
        class="bs-btn bs-btn-sm text-white rounded-full hover:bg-white/20 transition-colors"
        @click="logout()"
      >
        <AppIcon :path="$globals.icons.logout" size="md" />
        <span v-if="smAndUp" class="text-sm">{{ $t('user.logout') }}</span>
      </button>

      <!-- Login -->
      <NuxtLink
        v-else
        to="/login"
        class="bs-btn bs-btn-sm text-white rounded-full hover:bg-white/20 transition-colors no-underline"
      >
        <AppIcon :path="$globals.icons.user" size="md" />
        <span class="text-sm">{{ $t('user.login') }}</span>
      </NuxtLink>
    </template>
  </header>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type RecipeDialogSearch from "~/components/Domain/Recipe/RecipeDialogSearch.vue";

defineProps({
  menu: { type: Boolean, default: true },
});

const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const { loggedIn } = useLoggedInState();
const route = useRoute();
const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");
const { xs, smAndUp } = useDisplay();

const routerLink = computed(() => groupSlug.value ? `/g/${groupSlug.value}` : "/");
const domSearchDialog = ref<InstanceType<typeof RecipeDialogSearch> | null>(null);

function activateSearch() {
  domSearchDialog.value?.open();
}

function handleKeyEvent(e: KeyboardEvent) {
  const tag = document.activeElement?.tagName;
  if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
    e.preventDefault();
    activateSearch();
  }
}

onMounted(() => document.addEventListener("keydown", handleKeyEvent));
onBeforeUnmount(() => document.removeEventListener("keydown", handleKeyEvent));

async function logout() {
  try {
    await auth.signOut("/login?direct=1");
  }
  catch (e) {
    console.error(e);
  }
}
</script>
