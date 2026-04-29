<template>
  <!--
    DefaultLayout — updated for Tailwind layout shell.

    v-app is kept as root: Vuetify dialogs, menus, and overlays that haven't
    been migrated yet teleport into it and need its context.

    v-app-bar and v-navigation-drawer have been replaced with our own
    AppHeader and AppSidebar Tailwind components. v-main is replaced with
    a plain <main> that manually sets the top/left offset.
  -->
  <v-app>
    <TheSnackbar />

    <!-- Top navigation bar -->
    <AppHeader>
      <!-- Hamburger toggle -->
      <button
        type="button"
        class="bs-btn bs-btn-sm text-white rounded-full hover:bg-white/20 transition-colors"
        @click.stop="sidebar = !sidebar"
      >
        <AppIcon :path="$globals.icons.menu" size="md" />
      </button>
    </AppHeader>

    <!-- Side navigation -->
    <AppSidebar
      v-model="sidebar"
      :top-link="topLinks"
      :secondary-links="cookbookLinks || []"
    >
      <!-- Create recipe dropdown -->
      <Menu v-if="isOwnGroup" as="div" class="relative mx-2 mt-2 mb-1">
        <MenuButton
          class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium
                 bg-surface border border-border text-on-surface
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <AppIcon :path="$globals.icons.createAlt" size="md" class="text-primary shrink-0" />
          {{ $t('general.create') }}
          <AppIcon :path="$globals.icons.chevronDown" size="sm" class="ml-auto text-on-surface/40" />
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
            class="absolute left-0 right-0 top-full mt-1 z-50 bg-surface border border-border
                   rounded-lg shadow-lg py-1 focus:outline-none"
          >
            <template v-for="(item, index) in createLinks" :key="index">
              <hr v-if="item.insertDivider" class="my-1 border-t border-border" />
              <MenuItem v-if="!item.hide && (!item.restricted || isOwnGroup)" v-slot="{ active }">
                <NuxtLink
                  :to="item.to"
                  :class="[
                    'flex items-start gap-3 px-3 py-2 no-underline transition-colors',
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                  ]"
                >
                  <AppIcon :path="item.icon" size="lg" class="text-primary shrink-0 mt-0.5" />
                  <div>
                    <div class="text-sm font-medium text-on-surface">{{ item.title }}</div>
                    <div class="text-xs text-on-surface/60">{{ item.subtitle }}</div>
                  </div>
                </NuxtLink>
              </MenuItem>
            </template>
          </MenuItems>
        </Transition>
      </Menu>
    </AppSidebar>

    <!-- Main content — offset below header (pt-12) and beside open sidebar on desktop (ml-64) -->
    <main
      class="pt-12 min-h-screen transition-[margin-left] duration-200"
      :class="sidebar && lgAndUp ? 'ml-64' : 'ml-0'"
    >
      <NuxtPage />
    </main>
  </v-app>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type { SideBarLink } from "~/types/application-types";
import { useCookbookPreferences } from "~/composables/use-users/preferences";
import { useCookbookStore, usePublicCookbookStore } from "~/composables/store/use-cookbook-store";
import type { ReadCookBook } from "~/lib/api/types/cookbook";
import { useLiteMode } from "~/composables/use-lite-mode";

const i18n = useI18n();
const { $appInfo, $globals } = useNuxtApp();
const display = useDisplay();
const { lgAndUp } = display;
const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();
const liteMode = useLiteMode();

const route = useRoute();
const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");

const cookbookPreferences = useCookbookPreferences();
const ownCookbookStore = useCookbookStore(i18n);
const publicCookbookStoreCache = ref<Record<string, ReturnType<typeof usePublicCookbookStore>>>({});

function getPublicCookbookStore(slug: string) {
  if (!publicCookbookStoreCache.value[slug]) {
    publicCookbookStoreCache.value[slug] = usePublicCookbookStore(slug, i18n);
  }
  return publicCookbookStoreCache.value[slug];
}

const cookbooks = computed(() => {
  if (isOwnGroup.value) return ownCookbookStore.store.value;
  if (groupSlug.value) return unref(getPublicCookbookStore(groupSlug.value).store);
  return [];
});

const showImageImport = computed(() => $appInfo.enableOpenaiImageServices);

const sidebar = ref<boolean>(false);
onMounted(() => {
  sidebar.value = display.lgAndUp.value;
});

function cookbookAsLink(cookbook: ReadCookBook): SideBarLink {
  return {
    key: cookbook.slug || "",
    icon: $globals.icons.pages,
    title: cookbook.name,
    to: `/g/${groupSlug.value}/cookbooks/${cookbook.slug || ""}`,
    restricted: false,
  };
}

const currentUserHouseholdId = computed(() => auth.user.value?.householdId);
const cookbookLinks = computed<SideBarLink[]>(() => {
  if (liteMode) return [];
  if (!cookbooks.value?.length) return [];

  const sorted = [...cookbooks.value].sort((a, b) => (a.position || 0) - (b.position || 0));
  const ownLinks: SideBarLink[] = [];
  const links: SideBarLink[] = [];

  const byHousehold = sorted.reduce((acc, cb) => {
    const name = cb.household?.name || "";
    (acc[name] ||= []).push(cb);
    return acc;
  }, {} as Record<string, ReadCookBook[]>);

  Object.entries(byHousehold).forEach(([name, cbs]) => {
    if (!cbs.length) return;
    if (cbs[0].householdId === currentUserHouseholdId.value) {
      ownLinks.push(...cbs.map(cookbookAsLink));
    }
    else {
      links.push({
        key: name,
        icon: $globals.icons.book,
        title: name,
        children: cbs.map(cookbookAsLink),
        restricted: false,
      });
    }
  });

  links.sort((a, b) => a.title.localeCompare(b.title));
  return auth.user.value && cookbookPreferences.value.hideOtherHouseholds
    ? ownLinks
    : [...ownLinks, ...links];
});

const createLinks = computed(() => [
  {
    insertDivider: false,
    icon: $globals.icons.link,
    title: i18n.t("general.import"),
    subtitle: i18n.t("new-recipe.import-by-url"),
    to: `/g/${groupSlug.value}/r/create/url`,
    restricted: true,
    hide: false,
  },
  {
    insertDivider: false,
    icon: $globals.icons.fileImage,
    title: i18n.t("recipe.create-from-images"),
    subtitle: i18n.t("recipe.create-recipe-from-an-image"),
    to: `/g/${groupSlug.value}/r/create/image`,
    restricted: true,
    hide: !showImageImport.value,
  },
  {
    insertDivider: true,
    icon: $globals.icons.edit,
    title: i18n.t("general.create"),
    subtitle: i18n.t("new-recipe.create-manually"),
    to: `/g/${groupSlug.value}/r/create/new`,
    restricted: true,
    hide: false,
  },
]);

const topLinks = computed<SideBarLink[]>(() => {
  const all: SideBarLink[] = [
    { key: "recipes", icon: $globals.icons.silverwareForkKnife, to: `/g/${groupSlug.value}`, title: i18n.t("general.recipes"), restricted: false },
    { key: "recipe-finder", icon: $globals.icons.search, to: `/g/${groupSlug.value}/recipes/finder`, title: i18n.t("recipe-finder.recipe-finder"), restricted: false },
    { key: "mealplan", icon: $globals.icons.calendarMultiselect, title: i18n.t("meal-plan.meal-planner"), to: "/household/mealplan/planner/view", restricted: true },
    { key: "shopping", icon: $globals.icons.formatListCheck, title: i18n.t("shopping-list.shopping-lists"), to: "/shopping-lists", restricted: true },
    { key: "timeline", icon: $globals.icons.timelineText, title: i18n.t("recipe.timeline"), to: `/g/${groupSlug.value}/recipes/timeline`, restricted: true },
    { key: "cookbooks", icon: $globals.icons.book, to: `/g/${groupSlug.value}/cookbooks`, title: i18n.t("cookbook.cookbooks"), restricted: true },
    {
      key: "organizers",
      icon: $globals.icons.organizers,
      title: i18n.t("general.organizers"),
      restricted: true,
      children: [
        { icon: $globals.icons.categories, to: `/g/${groupSlug.value}/recipes/categories`, title: i18n.t("sidebar.categories"), restricted: true },
        { icon: $globals.icons.tags, to: `/g/${groupSlug.value}/recipes/tags`, title: i18n.t("sidebar.tags"), restricted: true },
        ...(!liteMode ? [{ icon: $globals.icons.potSteam, to: `/g/${groupSlug.value}/recipes/tools`, title: i18n.t("tool.tools"), restricted: true }] : []),
      ],
    },
  ];

  if (liteMode) {
    return all.filter(l => ["recipes", "organizers"].includes(l.key as string));
  }
  return all;
});
</script>
