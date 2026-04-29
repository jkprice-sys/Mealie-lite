<template>
  <!--
    AppIcon — renders an MDI SVG path string directly, no Vuetify required.
    Pass the SVG path from $globals.icons (or any @mdi/js export) as `path`.
    Size matches Vuetify's icon size vocabulary for easy migration.

    Usage:
      <AppIcon :path="$globals.icons.delete" size="md" />
  -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="[sizeClass, 'shrink-0']"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path :d="path" />
  </svg>
</template>

<script setup lang="ts">
type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const props = withDefaults(
  defineProps<{ path: string; size?: IconSize }>(),
  { size: "md" },
);

const sizeClass = computed(() => ({
  "w-3 h-3": props.size === "xs",
  "w-4 h-4": props.size === "sm",
  "w-5 h-5": props.size === "md",
  "w-6 h-6": props.size === "lg",
  "w-7 h-7": props.size === "xl",
  "w-8 h-8": props.size === "2xl",
}));
</script>
