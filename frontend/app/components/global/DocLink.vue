<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-on-primary hover:bg-primary/90 transition-colors"
  >
    <AppIcon :path="$globals.icons.folderOutline" size="xs" />
    {{ $t("about.docs") }}
  </a>
</template>

<script setup lang="ts">
const { $globals } = useNuxtApp();

const props = defineProps({
  link: {
    type: String,
    required: true,
  },
});

const href = computed(() => `https://docs.mealie.io${props.link}`);
</script>
