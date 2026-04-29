<template>
  <!--
    BaseOverflowButton — Headless UI Menu implementation.
    Three modes (model / link / event) with identical prop + v-model API as before.
    The trigger button shows the active item's text and a chevron.
  -->
  <Menu as="div" class="relative inline-block text-left">
    <MenuButton
      :disabled="disabled"
      :class="[
        'bs-btn bs-btn-md bs-btn-primary gap-2',
        btnClass,
      ]"
      v-bind="$attrs"
    >
      <AppIcon
        v-if="activeObj.icon"
        :path="activeObj.icon"
        size="sm"
      />
      <span>{{ mode === MODES.model ? activeObj.text : btnText }}</span>
      <AppIcon :path="$globals.icons.chevronDown" size="sm" class="ml-auto" />
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
        class="absolute left-0 z-20 mt-1 w-full min-w-[10rem] origin-top-left
               bg-surface border border-border rounded-lg shadow-lg py-1
               focus:outline-none"
      >
        <template v-for="(item, index) in items" :key="index">
          <hr v-if="item.divider" class="my-1 border-t border-border" />

          <!-- MODEL mode -->
          <MenuItem v-else-if="!item.hide && mode === MODES.model" v-slot="{ active }">
            <button
              type="button"
              :class="[
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface',
                active ? 'bg-gray-100 dark:bg-gray-700' : '',
              ]"
              @click="setValue(item)"
            >
              <AppIcon v-if="item.icon" :path="item.icon" size="sm" />
              {{ item.text }}
            </button>
          </MenuItem>

          <!-- LINK mode -->
          <MenuItem v-else-if="!item.hide && mode === MODES.link" v-slot="{ active }">
            <NuxtLink
              :to="item.to"
              :class="[
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface no-underline',
                active ? 'bg-gray-100 dark:bg-gray-700' : '',
              ]"
            >
              <AppIcon v-if="item.icon" :path="item.icon" size="sm" />
              {{ item.text }}
            </NuxtLink>
          </MenuItem>

          <!-- EVENT mode -->
          <MenuItem v-else-if="!item.hide && mode === MODES.event" v-slot="{ active }">
            <button
              type="button"
              :class="[
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface',
                active ? 'bg-gray-100 dark:bg-gray-700' : '',
              ]"
              @click="$emit(item.event ?? '')"
            >
              <AppIcon v-if="item.icon" :path="item.icon" size="sm" />
              {{ item.text }}
            </button>
          </MenuItem>
        </template>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";

const MODES = { model: "model", link: "link", event: "event" } as const;
type ModeKey = keyof typeof MODES;

export interface MenuItem {
  text: string;
  icon?: string;
  to?: string;
  value?: string;
  event?: string;
  divider?: boolean;
  hide?: boolean;
}

const props = defineProps({
  mode:     { type: String as () => ModeKey, default: "model" },
  items:    { type: Array as () => MenuItem[], required: true },
  disabled: { type: Boolean, default: false },
  btnClass: { type: String, default: "" },
  btnText:  {
    type: String,
    default: function () { return useI18n().t("general.actions"); },
  },
});

const { $globals } = useNuxtApp();

const modelValue = defineModel({ type: String, required: false, default: "" });

const activeObj = ref<MenuItem>({ text: "DEFAULT", value: "" });

// Initialise to the item matching the current model value
let startIndex = 0;
props.items.forEach((item, index) => {
  if (item.value === modelValue.value) {
    startIndex = index;
    activeObj.value = item;
  }
});
const _itemGroup = ref(startIndex); // kept for potential future use

function setValue(v: MenuItem) {
  modelValue.value = v.value ?? "";
  activeObj.value = v;
}
</script>
