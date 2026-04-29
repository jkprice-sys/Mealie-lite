<template>
  <!-- BaseDivider — replaces v-divider, same props retained for compatibility -->
  <hr
    :style="{
      width,
      borderTopWidth: thickness,
      borderColor: resolvedColor,
    }"
    class="border-0 border-t my-1"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  width:     { type: String, default: "100%" },
  thickness: { type: String, default: "1px" },
  // color accepts a CSS color or one of the ByteSized token names
  color:     { type: String, default: "border" },
});

const tokenMap: Record<string, string> = {
  accent:    "var(--bs-accent)",
  primary:   "var(--bs-primary)",
  secondary: "var(--bs-secondary)",
  border:    "var(--bs-border)",
  success:   "var(--bs-success)",
  error:     "var(--bs-error)",
  warning:   "var(--bs-warning)",
};

const resolvedColor = computed(() => tokenMap[props.color] ?? props.color);
</script>
