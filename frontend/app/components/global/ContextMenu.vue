<template>
  <Menu as="div" class="relative" @click.stop>
    <MenuButton
      class="bs-btn p-1 rounded-full text-on-surface/60
             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      @click.prevent.stop
    >
      <AppIcon :path="$globals.icons.dotsVertical" size="md" />
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
        class="absolute right-0 z-50 w-44 rounded-lg border border-border bg-surface
               shadow-lg py-1 focus:outline-none print:hidden"
        :class="menuTop ? 'bottom-full mb-1' : 'top-full mt-1'"
      >
        <MenuItem
          v-for="(item, index) in items"
          :key="index"
          v-slot="{ active }"
        >
          <button
            type="button"
            class="flex items-center gap-3 w-full px-3 py-2 text-sm text-on-surface
                   transition-colors text-left"
            :class="[
              active ? 'bg-gray-100 dark:bg-gray-700' : '',
              item.color ? `text-${item.color}` : '',
            ]"
            @click="$emit(item.event)"
          >
            <AppIcon
              v-if="item.icon"
              :path="item.icon"
              size="sm"
              class="shrink-0"
              :class="item.color ? `text-${item.color}` : 'text-on-surface/60'"
            />
            {{ item.title }}
          </button>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import type { ContextMenuItem } from "~/composables/use-context-presents";

defineProps({
  items:   { type: Array as () => ContextMenuItem[], required: true },
  menuTop: { type: Boolean, default: true },
});

defineEmits<Record<string, []>>();

const { $globals } = useNuxtApp();
</script>
