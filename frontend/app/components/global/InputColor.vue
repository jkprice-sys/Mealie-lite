<template>
  <div class="space-y-2">
    <label class="block text-xs text-on-surface/60">{{ $t('general.color') }}</label>
    <div class="flex items-center gap-2">
      <!-- Random hex button (color preview) -->
      <button
        type="button"
        class="w-8 h-8 rounded-lg border border-border flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
        :style="{ backgroundColor: modelValue || '#6b7280' }"
        @click="setRandomHex"
        :title="$t('general.random')"
      >
        <AppIcon :path="$globals.icons.refreshCircle" size="xs" class="text-white drop-shadow" />
      </button>

      <!-- Hex text input -->
      <input
        v-model="modelValue"
        type="text"
        :placeholder="'#rrggbb'"
        class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
               focus:outline-none focus:ring-2 focus:ring-primary transition-colors font-mono"
      />

      <!-- Native color picker -->
      <input
        v-model="modelValue"
        type="color"
        class="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5 bg-surface"
        :title="$t('general.color')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const modelValue = defineModel({
  type: String,
  required: true,
});

const { $globals } = useNuxtApp();

function getRandomHex() {
  return "#000000".replace(/0/g, () => (~~(Math.random() * 16)).toString(16));
}

function setRandomHex() {
  modelValue.value = getRandomHex();
}
</script>
