<template>
  <div>
    <Menu as="div" class="relative inline-block text-left">
      <MenuButton class="bs-btn bs-btn-md bs-btn-outline">
        <AppIcon :path="$globals.icons.cog" size="sm" />
        {{ $t("general.settings") }}
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
          static
          class="absolute left-0 bottom-full mb-2 z-50 w-64 rounded-lg border border-border
                 bg-surface shadow-xl p-4 focus:outline-none"
        >
          <p class="text-sm font-semibold text-on-surface mb-2">{{ $t("recipe.recipe-settings") }}</p>
          <hr class="border-border mb-3" />
          <RecipeSettingsSwitches v-model="value" :is-owner="isOwner" />
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import RecipeSettingsSwitches from "./RecipeSettingsSwitches.vue";

const { $globals } = useNuxtApp();

const value = defineModel<object>({ required: true });
defineProps<{ isOwner?: boolean }>();
</script>
