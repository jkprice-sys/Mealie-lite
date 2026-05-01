<template>
  <div class="text-center">
    <!-- Edit event dialog -->
    <BaseDialog
      v-model="recipeEventEditDialog"
      :title="$t('recipe.edit-timeline-event')"
      :icon="$globals.icons.edit"
      can-submit
      disable-submit-on-enter
      :submit-text="$t('general.save')"
      @submit="submitEdit"
    >
      <div class="px-4 py-3 space-y-3">
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.subject') }}</label>
          <input
            v-model="localEvent.subject"
            type="text"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.message') }}</label>
          <textarea
            v-model="localEvent.eventMessage"
            rows="4"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
          />
        </div>
      </div>
    </BaseDialog>

    <!-- Delete event dialog -->
    <BaseDialog
      v-model="recipeEventDeleteDialog"
      :title="$t('events.delete-event')"
      color="error"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="$emit('delete')"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t('events.event-delete-confirmation') }}
      </div>
    </BaseDialog>

    <!-- Context menu trigger + dropdown -->
    <Menu as="div" class="relative inline-block text-left">
      <MenuButton
        class="p-1 rounded-full hover:bg-primary/10 text-on-surface/50 hover:text-on-surface transition-colors focus:outline-none"
        @click.prevent
      >
        <AppIcon :path="icon" size="sm" />
      </MenuButton>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <MenuItems class="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-lg border border-border bg-surface shadow-lg py-1 focus:outline-none">
          <MenuItem
            v-for="(item, idx) in menuItems"
            :key="idx"
            v-slot="{ active }"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
              :class="[
                active ? 'bg-primary/10' : '',
                item.color === 'error' ? 'text-error' : 'text-on-surface',
              ]"
              @click="contextMenuEventHandler(item.event)"
            >
              <AppIcon :path="item.icon" size="sm" />
              {{ item.title }}
            </button>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import type { RecipeTimelineEventOut } from "~/lib/api/types/recipe";

export interface TimelineContextMenuIncludes {
  edit: boolean;
  delete: boolean;
}

export interface ContextMenuItem {
  title: string;
  icon: string;
  color: string | undefined;
  event: string;
}

const props = defineProps<{
  useItems?: TimelineContextMenuIncludes;
  appendItems?: ContextMenuItem[];
  leadingItems?: ContextMenuItem[];
  menuTop?: boolean;
  fab?: boolean;
  elevation?: number | null;
  color?: string;
  event: RecipeTimelineEventOut;
  menuIcon?: string | null;
}>();

const emit = defineEmits(["delete", "update"]);

const i18n = useI18n();
const { $globals } = useNuxtApp();

const recipeEventEditDialog   = ref(false);
const recipeEventDeleteDialog = ref(false);
const loading                 = ref(false);

const defaultItems: Record<string, ContextMenuItem> = {
  edit: {
    title: i18n.t("general.edit"),
    icon:  $globals.icons.edit,
    color: undefined,
    event: "edit",
  },
  delete: {
    title: i18n.t("general.delete"),
    icon:  $globals.icons.delete,
    color: "error",
    event: "delete",
  },
};

const menuItems = computed(() => {
  const items: ContextMenuItem[] = [];
  const useItems = props.useItems ?? { edit: true, delete: true };
  for (const [key, value] of Object.entries(useItems)) {
    if (value && defaultItems[key]) items.push(defaultItems[key]);
  }
  return [
    ...items,
    ...(props.leadingItems ?? []),
    ...(props.appendItems ?? []),
  ];
});

const icon = computed(() => props.menuIcon || $globals.icons.dotsVertical);

const localEvent = ref({ ...props.event });
watch(() => props.event, (val) => { localEvent.value = { ...val }; });

function openEditDialog() {
  localEvent.value = { ...props.event };
  recipeEventEditDialog.value = true;
}
function openDeleteDialog() {
  recipeEventDeleteDialog.value = true;
}
function contextMenuEventHandler(eventKey: string) {
  loading.value = false;
  if (eventKey === "edit")   { openEditDialog();   return; }
  if (eventKey === "delete") { openDeleteDialog(); return; }
  emit(eventKey as "delete" | "update");
}
function submitEdit() {
  emit("update", { ...localEvent.value });
  recipeEventEditDialog.value = false;
}
</script>
