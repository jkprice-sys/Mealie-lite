<template>
  <div class="relative" @click.prevent>
    <Menu as="div" class="relative">
      <MenuButton
        :class="[
          'bs-btn rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary',
          fab
            ? 'bs-btn-sm bg-primary text-white hover:brightness-90'
            : 'p-1 text-on-surface/60 hover:bg-gray-100 dark:hover:bg-gray-700',
        ]"
        @click.prevent.stop
      >
        <AppIcon :path="icon" :size="fab ? 'lg' : 'md'" />
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
          class="absolute right-0 z-50 w-52 rounded-lg border border-border bg-surface
                 shadow-lg py-1 focus:outline-none print:hidden"
          :class="menuTop ? 'bottom-full mb-1' : 'top-full mt-1'"
        >
          <!-- Content is lazy-loaded on first open -->
          <RecipeContextMenuContent
            v-if="isMenuContentLoaded"
            v-bind="contentProps"
            @print="$emit('print')"
            @deleted="$emit('deleted', $event)"
          />
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import type { Recipe } from "~/lib/api/types/recipe";

interface ContextMenuIncludes {
  delete?: boolean;
  edit?: boolean;
  download?: boolean;
  duplicate?: boolean;
  mealplanner?: boolean;
  shoppingList?: boolean;
  print?: boolean;
  printPreferences?: boolean;
  share?: boolean;
  recipeActions?: boolean;
}

interface ContextMenuItem {
  title: string;
  icon: string;
  color?: string;
  event: string;
  isPublic: boolean;
}

interface Props {
  useItems?: ContextMenuIncludes;
  appendItems?: ContextMenuItem[];
  leadingItems?: ContextMenuItem[];
  menuTop?: boolean;
  fab?: boolean;
  color?: string;
  slug: string;
  menuIcon?: string | null;
  name: string;
  recipe?: Recipe;
  recipeId: string;
  recipeScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  useItems: () => ({
    delete: true,
    edit: true,
    download: true,
    duplicate: false,
    mealplanner: true,
    shoppingList: true,
    print: true,
    printPreferences: true,
    share: true,
    recipeActions: true,
  }),
  appendItems: () => [],
  leadingItems: () => [],
  menuTop: true,
  fab: false,
  color: "primary",
  menuIcon: null,
  recipe: undefined,
  recipeScale: 1,
});

defineEmits<{
  [key: string]: any;
  print: [];
  deleted: [slug: string];
}>();

const { $globals } = useNuxtApp();
const icon = computed(() => props.menuIcon || $globals.icons.dotsVertical);

// Lazy-load the content component on first open
const isMenuContentLoaded = ref(false);

// Watch for MenuItems becoming visible by observing menu open state via a watcher trick:
// Headless UI doesn't expose open state via template ref, so we load eagerly on mount
// but defer the import itself.
onMounted(() => {
  // Pre-load after a short idle so it's ready when the user first clicks
  requestIdleCallback
    ? requestIdleCallback(() => { isMenuContentLoaded.value = true; })
    : setTimeout(() => { isMenuContentLoaded.value = true; }, 500);
});

const contentProps = computed(() => ({ ...props }));

const RecipeContextMenuContent = defineAsyncComponent(
  () => import("./RecipeContextMenuContent.vue"),
);
</script>
