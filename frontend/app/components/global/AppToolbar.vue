<template>
  <div class="flex items-center gap-2 py-2">
    <BaseButton secondary @click="$router.go(-1)">
      <template #icon>
        {{ $globals.icons.arrowLeftBold }}
      </template>
      {{ $t('general.back') }}
    </BaseButton>
    <slot />
  </div>
</template>

<script setup lang="ts">
const { $globals } = useNuxtApp();

defineProps({
  back: {
    type: Boolean,
    default: false,
  },
});
</script>
