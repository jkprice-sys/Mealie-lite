<template>
  <!--
    AppHeader — full nav bar (no sidebar).
    Logo + title on the left, nav links in the middle/right, search + logout on the far right.
    Mobile: nav collapses into a hamburger dropdown (Headless UI Menu).
  -->
  <header
    class="fixed top-0 left-0 right-0 h-12 bg-primary text-white
           flex items-center gap-1 px-2 z-[2010] print:hidden"
  >
    <!-- Logo -->
    <RouterLink :to="routerLink" class="flex items-center text-white no-underline ml-1 shrink-0">
      <AppIcon :path="$globals.icons.primary" size="lg" />
    </RouterLink>

    <!-- App title -->
    <span
      class="pl-1 font-semibold text-base cursor-pointer select-none shrink-0"
      @click="$router.push(routerLink)"
    >
      ByteSized
    </span>

    <!-- Search dialog (opened programmatically) -->
    <RecipeDialogSearch ref="domSearchDialog" />

    <!-- ── Desktop nav (md+) ───────────────────────────── -->
    <nav v-if="menu && mdAndUp" class="flex items-center gap-1 ml-4">
      <!-- Recipes -->
      <NuxtLink
        :to="routerLink"
        class="px-3 py-1.5 rounded-lg text-sm font-medium text-white/90
               hover:bg-white/20 transition-colors no-underline"
      >
        {{ $t('general.recipes') }}
      </NuxtLink>

      <!-- Organizers dropdown -->
      <Menu as="div" class="relative">
        <MenuButton
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                 text-white/90 hover:bg-white/20 transition-colors"
        >
          {{ $t('general.organizers') }}
          <AppIcon :path="$globals.icons.chevronDown" size="sm" class="opacity-70" />
        </MenuButton>
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems
            class="absolute left-0 top-full mt-1 w-44 z-50 bg-surface border border-border
                   rounded-lg shadow-lg py-1 focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/recipes/categories`"
                :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.categories" size="sm" class="text-primary" />
                {{ $t('sidebar.categories') }}
              </NuxtLink>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/recipes/tags`"
                :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.tags" size="sm" class="text-primary" />
                {{ $t('sidebar.tags') }}
              </NuxtLink>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>

      <!-- Create dropdown (own group only) -->
      <Menu v-if="isOwnGroup" as="div" class="relative">
        <MenuButton
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                 bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <AppIcon :path="$globals.icons.createAlt" size="sm" />
          {{ $t('general.create') }}
          <AppIcon :path="$globals.icons.chevronDown" size="sm" class="opacity-70" />
        </MenuButton>
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems
            class="absolute left-0 top-full mt-1 w-52 z-50 bg-surface border border-border
                   rounded-lg shadow-lg py-1 focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/r/create/url`"
                :class="['flex items-start gap-3 px-3 py-2 no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.link" size="lg" class="text-primary shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-on-surface">{{ $t('general.import') }}</div>
                  <div class="text-xs text-on-surface/60">{{ $t('new-recipe.import-by-url') }}</div>
                </div>
              </NuxtLink>
            </MenuItem>
            <MenuItem v-if="showImageImport" v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/r/create/image`"
                :class="['flex items-start gap-3 px-3 py-2 no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.fileImage" size="lg" class="text-primary shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-on-surface">{{ $t('recipe.create-from-images') }}</div>
                  <div class="text-xs text-on-surface/60">{{ $t('recipe.create-recipe-from-an-image') }}</div>
                </div>
              </NuxtLink>
            </MenuItem>
            <hr class="my-1 border-t border-border" />
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/r/create/new`"
                :class="['flex items-start gap-3 px-3 py-2 no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.edit" size="lg" class="text-primary shrink-0 mt-0.5" />
                <div>
                  <div class="text-sm font-medium text-on-surface">{{ $t('general.create') }}</div>
                  <div class="text-xs text-on-surface/60">{{ $t('new-recipe.create-manually') }}</div>
                </div>
              </NuxtLink>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </nav>

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

      <!-- ── Mobile nav hamburger (below md) ───────────── -->
      <Menu v-if="!mdAndUp" as="div" class="relative">
        <MenuButton
          class="bs-btn bs-btn-sm text-white rounded-full hover:bg-white/20 transition-colors"
          :aria-label="$t('general.menu')"
        >
          <AppIcon :path="$globals.icons.menu" size="md" />
        </MenuButton>
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems
            class="absolute right-0 top-full mt-1 w-56 z-50 bg-surface border border-border
                   rounded-lg shadow-lg py-1 focus:outline-none"
          >
            <!-- Recipes -->
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="routerLink"
                :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.silverwareForkKnife" size="sm" class="text-primary" />
                {{ $t('general.recipes') }}
              </NuxtLink>
            </MenuItem>
            <!-- Organizers header -->
            <div class="px-3 py-1 text-xs font-semibold text-on-surface/40 uppercase tracking-wide mt-1">
              {{ $t('general.organizers') }}
            </div>
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/recipes/categories`"
                :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.categories" size="sm" class="text-primary" />
                {{ $t('sidebar.categories') }}
              </NuxtLink>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <NuxtLink
                :to="`/g/${groupSlug}/recipes/tags`"
                :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
              >
                <AppIcon :path="$globals.icons.tags" size="sm" class="text-primary" />
                {{ $t('sidebar.tags') }}
              </NuxtLink>
            </MenuItem>
            <!-- Create (own group only) -->
            <template v-if="isOwnGroup">
              <hr class="my-1 border-t border-border" />
              <div class="px-3 py-1 text-xs font-semibold text-on-surface/40 uppercase tracking-wide">
                {{ $t('general.create') }}
              </div>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  :to="`/g/${groupSlug}/r/create/url`"
                  :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                >
                  <AppIcon :path="$globals.icons.link" size="sm" class="text-primary" />
                  {{ $t('general.import') }}
                </NuxtLink>
              </MenuItem>
              <MenuItem v-if="showImageImport" v-slot="{ active }">
                <NuxtLink
                  :to="`/g/${groupSlug}/r/create/image`"
                  :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                >
                  <AppIcon :path="$globals.icons.fileImage" size="sm" class="text-primary" />
                  {{ $t('recipe.create-from-images') }}
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  :to="`/g/${groupSlug}/r/create/new`"
                  :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline transition-colors', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                >
                  <AppIcon :path="$globals.icons.edit" size="sm" class="text-primary" />
                  {{ $t('new-recipe.create-manually') }}
                </NuxtLink>
              </MenuItem>
            </template>
          </MenuItems>
        </Transition>
      </Menu>

      <!-- Logout -->
      <button
        v-if="loggedIn"
        type="button"
        class="bs-btn bs-btn-sm text-white rounded-full hover:bg-white/20 transition-colors"
        @click="logout()"
      >
        <AppIcon :path="$globals.icons.logout" size="md" />
        <span v-if="lgAndUp" class="text-sm">{{ $t('user.logout') }}</span>
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
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type RecipeDialogSearch from "~/components/Domain/Recipe/RecipeDialogSearch.vue";

defineProps({
  menu: { type: Boolean, default: true },
});

const { $appInfo, $globals } = useNuxtApp();
const auth = useMealieAuth();
const { loggedIn, isOwnGroup } = useLoggedInState();
const route = useRoute();
const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");
const { xs, mdAndUp, lgAndUp } = useDisplay();

const showImageImport = computed(() => $appInfo.enableOpenaiImageServices);
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
