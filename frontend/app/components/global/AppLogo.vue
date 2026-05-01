<template>
  <div class="icon-container">
    <hr class="icon-divider border-border" />
    <div
      class="icon-avatar rounded-full overflow-hidden border-2 border-border bg-surface flex items-center justify-center shrink-0"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <slot>
        <img src="/logo.png" :width="size" :height="size" class="object-cover w-full h-full" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 75 });
</script>

<style scoped>
.icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
  margin-top: 2.5rem;
}
.icon-divider {
  width: 100%;
  margin-bottom: -2.5rem;
}
</style>
