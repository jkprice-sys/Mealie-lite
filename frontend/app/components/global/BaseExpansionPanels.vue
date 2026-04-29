<template>
  <!--
    BaseExpansionPanels — Phase 1 holdover.
    The slot content (shopping-lists/[id].vue) uses Vuetify v-expansion-panel
    children, so this wrapper must keep using v-expansion-panels until those
    children are migrated in Phase 3.
    TODO Phase 3: replace with Headless UI <Disclosure> + migrate call site.
  -->
  <v-expansion-panels v-model="open">
    <slot />
  </v-expansion-panels>
</template>

<script setup lang="ts">
interface Props {
  startOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  startOpen: false,
});

const open = ref(props.startOpen ? [0] : []);
</script>
