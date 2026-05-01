<template>
  <div class="text-center">
    <RecipeDialogAddToShoppingList
      v-if="shoppingLists"
      v-model="shoppingListDialog"
      :recipes="recipesWithScales"
      :shopping-lists="shoppingLists"
    />
    <Menu as="div" class="relative inline-block text-left">
      <MenuButton
        class="inline-flex items-center justify-center rounded-full p-1 text-on-surface/60 hover:bg-on-surface/10 hover:text-on-surface transition-colors focus:outline-none"
        @click.prevent
      >
        <AppIcon :path="icon" size="sm" />
      </MenuButton>
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems
          class="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg focus:outline-none"
        >
          <div class="py-1">
            <MenuItem
              v-for="(item, index) in menuItems"
              :key="index"
              v-slot="{ active }"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
                :class="active ? 'bg-primary/10 text-primary' : 'text-on-surface'"
                @click="contextMenuEventHandler(item.event)"
              >
                <AppIcon :path="item.icon" size="sm" :class="item.color ? `text-${item.color}` : ''" />
                {{ item.title }}
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import type { Recipe } from "~/lib/api/types/recipe";
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import type { ShoppingListSummary } from "~/lib/api/types/household";
import { useUserApi } from "~/composables/api";

export interface ContextMenuItem {
  title: string;
  icon: string;
  color: string | undefined;
  event: string;
  isPublic: boolean;
}

interface Props {
  recipes?: Recipe[];
  menuTop?: boolean;
  fab?: boolean;
  color?: string;
  menuIcon?: string | null;
}
const props = withDefaults(defineProps<Props>(), {
  recipes: () => [],
  menuTop: true,
  fab: false,
  color: "primary",
  menuIcon: null,
});

const emit = defineEmits<{
  [key: string]: [];
}>();

const i18n = useI18n();
const { $globals } = useNuxtApp();
const api = useUserApi();

const state = reactive({
  loading: false,
  shoppingListDialog: false,
  menuItems: [
    {
      title: i18n.t("meal-plan.add-day-to-list"),
      icon: $globals.icons.cartCheck,
      color: undefined,
      event: "shoppingList",
      isPublic: false,
    },
  ],
});

const { shoppingListDialog, menuItems } = toRefs(state);

const icon = computed(() => props.menuIcon || $globals.icons.dotsVertical);

const shoppingLists = ref<ShoppingListSummary[]>();
const recipesWithScales = computed(() => {
  return props.recipes.map((recipe) => {
    return {
      scale: 1,
      ...recipe,
    };
  });
});

async function getShoppingLists() {
  const { data } = await api.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });
  if (data) {
    shoppingLists.value = data.items as ShoppingListSummary[] ?? [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
const eventHandlers: { [key: string]: () => void | Promise<any> } = {
  shoppingList: async () => {
    await getShoppingLists();
    state.shoppingListDialog = true;
  },
};

function contextMenuEventHandler(eventKey: string) {
  const handler = eventHandlers[eventKey];

  if (handler && typeof handler === "function") {
    handler();
    state.loading = false;
    return;
  }

  emit(eventKey);
  state.loading = false;
}
</script>
