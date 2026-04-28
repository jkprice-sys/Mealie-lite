<template>
  <div class="icon-container">
    <v-divider class="icon-divider" />
    <v-avatar
      :class="['icon-avatar']"
      :size="size"
    >
      <slot>
        <v-img
          src="/logo.png"
          :width="size"
          :height="size"
          cover
        />
      </slot>
    </v-avatar>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 75 });
</script>

<style scoped>
.icon-white {
  fill: white;
}
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
.icon-avatar {
  border-color: rgba(0, 0, 0, 0.12);
  border: 2px;
}
</style>
