<template>
  <div class="pb-6 mt-1 ml-10" style="max-width: 500px">
    <strong class="text-sm text-on-surface">
      {{ $t("user.password-strength", { strength: pwStrength.strength.value }) }}
    </strong>
    <div class="mt-1 h-3 w-full rounded-full bg-on-surface/10 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="barColorClass"
        :style="{ width: `${pwStrength.score.value}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePasswordStrength } from "~/composables/use-passwords";

const modelValue = defineModel<string>({ default: "" });
const i18n = useI18n();

const pwStrength = usePasswordStrength(modelValue, i18n);

const barColorClass = computed(() => {
  switch (pwStrength.color.value) {
    case "error": return "bg-error";
    case "warning": return "bg-warning";
    case "info": return "bg-info";
    case "success": return "bg-success";
    default: return "bg-on-surface/30";
  }
});
</script>
