<template>
  <!--
    BaseButtonGroup — horizontal group of icon buttons with optional tooltips and
    dropdown child menus. Replaces the Vuetify v-item-group / v-menu / v-tooltip pattern.
    Prop API is identical to the old version.
  -->
  <div class="inline-flex items-center">
    <template v-for="btn in buttons" :key="btn.event">
      <!-- Button with children → Headless UI Menu dropdown -->
      <Menu v-if="btn.children" as="div" class="relative">
        <MenuButton
          class="bs-btn bs-btn-sm bs-btn-ghost rounded-md"
          :style="stretch ? `width: ${maxButtonWidth}` : ''"
        >
          <AppIcon v-if="btn.icon" :path="btn.icon" size="md" />
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
            class="absolute bottom-full mb-1 left-0 z-20 w-40 origin-bottom-left
                   bg-surface border border-border rounded-lg shadow-lg py-1 focus:outline-none"
          >
            <template v-for="(child, idx) in btn.children" :key="idx">
              <hr v-if="child.divider" class="my-1 border-t border-border" />
              <MenuItem v-else v-slot="{ active }">
                <button
                  type="button"
                  :class="[
                    'w-full text-left px-3 py-2 text-sm text-on-surface',
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                  ]"
                  @click="$emit(child.event)"
                >
                  {{ child.text }}
                </button>
              </MenuItem>
            </template>
          </MenuItems>
        </Transition>
      </Menu>

      <!-- Plain icon button with tooltip -->
      <div
        v-else
        class="relative group"
        :style="stretch ? `width: ${maxButtonWidth}` : ''"
      >
        <button
          type="button"
          :disabled="btn.disabled"
          :class="[
            'bs-btn bs-btn-sm bs-btn-ghost rounded-md',
            btn.color ? `text-[${btn.color}]` : '',
          ]"
          @click="$emit(btn.event)"
        >
          <AppIcon v-if="btn.icon" :path="btn.icon" size="md" />
        </button>

        <!-- Tooltip -->
        <div
          v-if="btn.text"
          class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                 whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-xs text-white
                 opacity-0 group-hover:opacity-100 transition-opacity delay-150 z-30"
        >
          {{ btn.text }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";

export interface ButtonOption {
  icon?: string;
  color?: string;
  text: string;
  event: string;
  children?: ButtonOption[];
  disabled?: boolean;
  divider?: boolean;
}

const props = defineProps({
  buttons: { type: Array as () => ButtonOption[], required: true },
  large:   { type: Boolean, default: true },
  stretch: { type: Boolean, default: false },
});

// Dynamic event names from button configs — typed emits not feasible here
defineEmits([]);

const maxButtonWidth = computed(() => `${100 / props.buttons.length}%`);
</script>
