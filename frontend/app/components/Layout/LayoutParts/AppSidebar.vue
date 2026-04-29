<template>
  <!--
    AppSidebar — Tailwind replacement for v-navigation-drawer.

    Desktop (lg+): always-visible fixed panel, 256px wide, starts below header.
    Mobile: off-canvas panel with a backdrop overlay.

    The parent (DefaultLayout) owns the open/close boolean via v-model.
  -->

  <!-- Mobile backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="modelValue && !lgAndUp"
      class="fixed inset-0 bg-black/50 z-30 print:hidden"
      @click="modelValue = false"
    />
  </Transition>

  <!-- Sidebar panel -->
  <Transition
    enter-active-class="transition-transform duration-200 ease-out"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-150 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <nav
      v-show="modelValue"
      class="fixed left-0 top-12 bottom-0 w-64 bg-surface border-r border-border
             flex flex-col z-40 overflow-hidden print:hidden"
    >
      <AnnouncementDialog v-model="showAnnouncementsDialog" />
      <LanguageDialog v-model="state.languageDialog" />

      <!-- User profile -->
      <template v-if="loggedIn && sessionUser">
        <NuxtLink
          :to="userProfileLink"
          class="flex items-center gap-2 px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800
                 text-on-surface no-underline transition-colors shrink-0"
        >
          <UserAvatar list :user-id="sessionUser.id" :tooltip="false" />
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-medium text-on-surface truncate pr-2">
              {{ sessionUser.fullName }}
            </span>
            <NuxtLink
              v-if="isOwnGroup"
              :to="userFavoritesLink"
              class="flex items-center gap-1 text-xs text-primary no-underline hover:underline mt-0.5"
              @click.stop
            >
              <AppIcon :path="$globals.icons.heart" size="xs" />
              {{ $t('user.favorite-recipes') }}
            </NuxtLink>
          </div>
        </NuxtLink>
        <hr class="border-t border-border" />
      </template>

      <!-- Create button slot (from DefaultLayout) -->
      <slot />

      <!-- Primary nav links -->
      <div class="flex-1 overflow-y-auto py-1">
        <template v-if="topLink">
          <template v-for="nav in topLink" :key="nav.key || nav.title">
            <div v-if="!nav.restricted || isOwnGroup">
              <!-- Group with children -->
              <template v-if="nav.children">
                <button
                  type="button"
                  class="flex items-center gap-3 w-full px-4 py-2 text-sm text-on-surface
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  @click="toggleGroup(nav.title)"
                >
                  <AppIcon v-if="nav.icon" :path="nav.icon" size="md" class="text-on-surface/60 shrink-0" />
                  <span class="flex-1 text-left">{{ nav.title }}</span>
                  <AppIcon
                    :path="$globals.icons.chevronDown"
                    size="sm"
                    class="text-on-surface/40 transition-transform duration-150 shrink-0"
                    :class="state.dropDowns[nav.title] ? 'rotate-180' : ''"
                  />
                </button>
                <div v-show="state.dropDowns[nav.title]">
                  <NuxtLink
                    v-for="child in nav.children"
                    :key="child.key || child.title"
                    :to="child.to"
                    class="flex items-center gap-3 pl-10 pr-4 py-2 text-sm text-on-surface
                           hover:bg-gray-100 dark:hover:bg-gray-800 no-underline transition-colors"
                    active-class="text-primary font-medium bg-primary/5"
                  >
                    <AppIcon v-if="child.icon" :path="child.icon" size="md" class="text-on-surface/60 shrink-0" />
                    {{ child.title }}
                  </NuxtLink>
                </div>
              </template>

              <!-- Single link -->
              <NuxtLink
                v-else
                :to="nav.to"
                class="flex items-center gap-3 px-4 py-2 text-sm text-on-surface
                       hover:bg-gray-100 dark:hover:bg-gray-800 no-underline transition-colors"
                active-class="text-primary font-medium bg-primary/5"
              >
                <AppIcon v-if="nav.icon" :path="nav.icon" size="md" class="text-on-surface/60 shrink-0" />
                {{ nav.title }}
              </NuxtLink>
            </div>
          </template>
        </template>

        <!-- Secondary links (cookbooks etc.) -->
        <template v-if="secondaryLinks && secondaryLinks.length > 0">
          <hr class="border-t border-border my-1" />
          <template v-for="nav in secondaryLinks" :key="nav.key || nav.title">
            <div v-if="!nav.restricted || isOwnGroup">
              <template v-if="nav.children">
                <button
                  type="button"
                  class="flex items-center gap-3 w-full px-4 py-1.5 text-xs text-on-surface/70
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  @click="toggleGroup(nav.title)"
                >
                  <AppIcon v-if="nav.icon" :path="nav.icon" size="sm" class="shrink-0" />
                  <span class="flex-1 text-left">{{ nav.title }}</span>
                  <AppIcon :path="$globals.icons.chevronDown" size="xs" class="transition-transform duration-150 shrink-0" :class="state.dropDowns[nav.title] ? 'rotate-180' : ''" />
                </button>
                <div v-show="state.dropDowns[nav.title]">
                  <NuxtLink
                    v-for="child in nav.children"
                    :key="child.key || child.title"
                    :to="child.to"
                    class="flex items-center gap-3 pl-9 pr-4 py-1.5 text-xs text-on-surface/70
                           hover:bg-gray-100 dark:hover:bg-gray-800 no-underline transition-colors"
                    active-class="text-primary font-medium"
                  >
                    <AppIcon v-if="child.icon" :path="child.icon" size="sm" class="shrink-0" />
                    {{ child.title }}
                  </NuxtLink>
                </div>
              </template>
              <NuxtLink
                v-else
                :to="nav.to"
                class="flex items-center gap-3 px-4 py-1.5 text-xs text-on-surface/70
                       hover:bg-gray-100 dark:hover:bg-gray-800 no-underline transition-colors"
                active-class="text-primary font-medium"
              >
                <AppIcon v-if="nav.icon" :path="nav.icon" size="sm" class="shrink-0" />
                {{ nav.title }}
              </NuxtLink>
            </div>
          </template>
        </template>
      </div>

      <!-- Bottom: announcements + settings -->
      <div class="shrink-0 border-t border-border">
        <!-- Announcements -->
        <button
          v-if="loggedIn && announcementsEnabled && !liteMode"
          type="button"
          class="flex items-center gap-3 w-full px-4 py-2 text-sm text-on-surface
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="showAnnouncementsDialog = !showAnnouncementsDialog"
        >
          <span class="relative shrink-0">
            <AppIcon :path="$globals.icons.bullhornVariant" size="md" class="text-on-surface/60" />
            <span
              v-if="newAnnouncements.length"
              class="absolute -top-1 -right-1 flex items-center justify-center
                     w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold"
            >
              {{ newAnnouncements.length }}
            </span>
          </span>
          {{ $t('announcements.announcements') }}
        </button>

        <!-- Settings dropdown -->
        <Menu as="div" class="relative">
          <MenuButton
            class="flex items-center gap-3 w-full px-4 py-2 text-sm text-on-surface
                   hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <AppIcon :path="$globals.icons.cog" size="md" class="text-on-surface/60 shrink-0" />
            {{ $t('general.settings') }}
          </MenuButton>
          <MenuItems
            class="absolute bottom-full left-2 right-2 mb-1 bg-surface border border-border
                   rounded-lg shadow-lg py-1 focus:outline-none z-50"
          >
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="state.languageDialog = true"
              >
                <AppIcon :path="$globals.icons.translate" size="sm" />
                {{ $t('sidebar.language') }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="['flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                @click="toggleDark"
              >
                <AppIcon :path="isDark ? $globals.icons.weatherSunny : $globals.icons.weatherNight" size="sm" />
                {{ isDark ? $t('settings.theme.light-mode') : $t('settings.theme.dark-mode') }}
              </button>
            </MenuItem>
            <template v-if="loggedIn">
              <hr class="my-1 border-t border-border" />
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/user/profile"
                  :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                >
                  <AppIcon :path="$globals.icons.cog" size="sm" />
                  {{ $t('profile.user-settings') }}
                </NuxtLink>
              </MenuItem>
              <MenuItem v-if="canManage && !liteMode" v-slot="{ active }">
                <NuxtLink
                  to="/group/data"
                  :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                >
                  <AppIcon :path="$globals.icons.manageData" size="sm" />
                  {{ $t('data-pages.data-management') }}
                </NuxtLink>
              </MenuItem>
            </template>
            <template v-if="isAdmin">
              <hr class="my-1 border-t border-border" />
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/admin/site-settings"
                  :class="['flex items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline', active ? 'bg-gray-100 dark:bg-gray-700' : '']"
                >
                  <AppIcon :path="$globals.icons.wrench" size="sm" />
                  {{ $t('settings.admin-settings') }}
                </NuxtLink>
              </MenuItem>
            </template>
          </MenuItems>
        </Menu>
      </div>
    </nav>
  </Transition>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type { SidebarLinks } from "~/types/application-types";
import AnnouncementDialog from "~/components/Domain/Announcement/AnnouncementDialog.vue";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import { useToggleDarkMode } from "~/composables/use-utils";
import { useAnnouncements } from "~/composables/use-announcements";

const props = defineProps({
  user: { type: Object, default: null },
  topLink: { type: Array as () => SidebarLinks, required: true },
  secondaryLinks: { type: Array as () => SidebarLinks, required: false, default: null },
});

const modelValue = defineModel<boolean>({ default: false });

const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const sessionUser = computed(() => auth.user.value);
const { loggedIn, isOwnGroup } = useLoggedInState();
const liteMode = useLiteMode();
const isAdmin = computed(() => auth.user.value?.admin);
const canManage = computed(() => auth.user.value?.canManage);

const userFavoritesLink = computed(() => auth.user.value ? `/user/${auth.user.value.id}/favorites` : undefined);
const userProfileLink = computed(() => auth.user.value ? "/user/profile" : undefined);

const { lgAndUp } = useDisplay();

const toggleDark = useToggleDarkMode();

// Track dark mode from Vuetify theme (still present during migration)
const { $vuetify } = useNuxtApp() as any;
const isDark = computed(() => $vuetify?.theme?.current?.value?.dark ?? false);

const showAnnouncementsDialog = ref(false);
const { announcementsEnabled, newAnnouncements } = useAnnouncements();

const state = reactive({
  dropDowns: {} as Record<string, boolean>,
  secondarySelected: null as string[] | null,
  bottomSelected: null as string[] | null,
  languageDialog: false as boolean,
});

const allLinks = computed(() => [...props.topLink, ...(props.secondaryLinks || [])]);

function initDropdowns() {
  allLinks.value.forEach((link) => {
    if (!(link.title in state.dropDowns)) {
      state.dropDowns[link.title] = (link as any).childrenStartExpanded || false;
    }
  });
}

function toggleGroup(title: string) {
  state.dropDowns[title] = !state.dropDowns[title];
}

watch(() => allLinks.value, initDropdowns, { deep: true, immediate: true });
</script>

<style scoped>
@media print {
  nav { display: none; }
}
</style>
