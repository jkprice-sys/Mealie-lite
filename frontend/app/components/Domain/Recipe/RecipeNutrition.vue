<template>
  <div v-if="valueNotNull || edit" class="mt-2">
    <div class="bs-card overflow-hidden">
      <div class="bs-card-header text-base">
        {{ $t("recipe.nutrition") }}
      </div>

      <!-- Edit mode: number inputs per nutrient -->
      <div v-if="edit" class="bs-card-body space-y-2">
        <div
          v-for="(item, key, index) in modelValue"
          :key="index"
          class="flex items-center gap-3"
        >
          <label class="w-40 shrink-0 text-sm text-on-surface/70">
            {{ labels[key]?.label }}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            :value="modelValue[key] ?? ''"
            :placeholder="labels[key]?.label"
            autocomplete="off"
            class="flex-1 border-b border-border bg-transparent text-sm text-on-surface
                   focus:outline-none focus:border-primary transition-colors py-1"
            @input="updateValue(key, ($event.target as HTMLInputElement).value)"
          />
          <span class="text-xs text-on-surface/50 shrink-0 w-8">{{ labels[key]?.suffix }}</span>
        </div>
      </div>

      <!-- View mode: compact list -->
      <ul v-if="showViewer" class="divide-y divide-border">
        <li
          v-for="(item, key, index) in renderedList"
          :key="index"
          class="flex items-center px-4 py-1 text-sm"
        >
          <span class="text-on-surface/80">{{ item.label }}</span>
          <span class="ml-auto mr-1 font-medium text-on-surface">{{ item.value }}</span>
          <span class="text-on-surface/50 w-6">{{ item.suffix }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNutritionLabels } from "~/composables/recipes";
import type { Nutrition } from "~/lib/api/types/recipe";
import type { NutritionLabelType } from "~/composables/recipes/use-recipe-nutrition";

interface Props {
  edit?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  edit: true,
});

const modelValue = defineModel<Nutrition>({ required: true });

const { labels } = useNutritionLabels();

const valueNotNull = computed(() => {
  let key: keyof Nutrition;
  for (key in modelValue.value) {
    if (modelValue.value[key] !== null) return true;
  }
  return false;
});

const showViewer = computed(() => !props.edit && valueNotNull.value);

function updateValue(key: number | string, value: string) {
  modelValue.value = { ...modelValue.value, [key]: value || null };
}

const renderedList = computed(() => {
  return Object.entries(labels).reduce((item: NutritionLabelType, [key, label]) => {
    if (modelValue.value[key]?.trim()) {
      item[key] = { ...label, value: modelValue.value[key] };
    }
    return item;
  }, {});
});
</script>
