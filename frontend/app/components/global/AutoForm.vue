<template>
  <form class="my-2" :style="width !== 'max' ? `width: ${width}` : ''" @submit.prevent>
    <template v-for="(inputField, index) in items" :key="index">
      <!-- Section header -->
      <template v-if="inputField.section">
        <hr class="my-3 border-border" />
        <h3 class="text-base font-semibold text-on-surface mb-0.5">{{ inputField.section }}</h3>
        <p v-if="inputField.sectionDetails" class="text-sm text-on-surface/60 mb-2">{{ inputField.sectionDetails }}</p>
      </template>

      <!-- Field container -->
      <div class="mb-3 px-0.5">
        <!-- Boolean checkbox -->
        <template v-if="inputField.type === fieldTypes.BOOLEAN">
          <label class="flex items-start gap-2 cursor-pointer">
            <input
              v-model="(model as Record<string, any>)[inputField.varName]"
              type="checkbox"
              class="accent-primary mt-0.5 shrink-0"
              :name="inputField.varName"
              :readonly="fieldState[inputField.varName]?.readonly"
              :disabled="fieldState[inputField.varName]?.disabled"
            />
            <div>
              <span class="text-sm text-on-surface">{{ inputField.label }}</span>
              <p v-if="inputField.hint" class="text-xs text-on-surface/60 mt-0.5">{{ inputField.hint }}</p>
            </div>
          </label>
        </template>

        <!-- Text / Password field -->
        <template v-else-if="inputField.type === fieldTypes.TEXT || inputField.type === fieldTypes.PASSWORD">
          <label class="block text-xs text-on-surface/60 mb-1">{{ inputField.label }}</label>
          <input
            v-model="(model as Record<string, any>)[inputField.varName]"
            :type="inputField.type === fieldTypes.PASSWORD ? 'password' : 'text'"
            :name="inputField.varName"
            :readonly="fieldState[inputField.varName]?.readonly"
            :disabled="fieldState[inputField.varName]?.disabled"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors
                   disabled:opacity-50 read-only:opacity-70"
          />
          <p v-if="inputField.hint" class="mt-1 text-xs text-on-surface/60">{{ inputField.hint }}</p>
        </template>

        <!-- Textarea -->
        <template v-else-if="inputField.type === fieldTypes.TEXT_AREA">
          <label class="block text-xs text-on-surface/60 mb-1">{{ inputField.label }}</label>
          <textarea
            v-model="(model as Record<string, any>)[inputField.varName]"
            :name="inputField.varName"
            :readonly="fieldState[inputField.varName]?.readonly"
            :disabled="fieldState[inputField.varName]?.disabled"
            rows="3"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-y
                   disabled:opacity-50"
          />
          <p v-if="inputField.hint" class="mt-1 text-xs text-on-surface/60">{{ inputField.hint }}</p>
        </template>

        <!-- Number input -->
        <template v-else-if="inputField.type === fieldTypes.NUMBER">
          <label class="block text-xs text-on-surface/60 mb-1">{{ inputField.label }}</label>
          <input
            v-model.number="(model as Record<string, any>)[inputField.varName]"
            type="number"
            :name="inputField.varName"
            :min="inputField.numberInputConfig?.min"
            :max="inputField.numberInputConfig?.max"
            :step="inputField.numberInputConfig?.precision ? Math.pow(10, -inputField.numberInputConfig.precision) : 1"
            :disabled="fieldState[inputField.varName]?.disabled"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors
                   disabled:opacity-50"
          />
          <p v-if="inputField.hint" class="mt-1 text-xs text-on-surface/60">{{ inputField.hint }}</p>
        </template>

        <!-- Select -->
        <template v-else-if="inputField.type === fieldTypes.SELECT">
          <label class="block text-xs text-on-surface/60 mb-1">{{ inputField.label }}</label>
          <select
            v-model="(model as Record<string, any>)[inputField.varName]"
            :name="inputField.varName"
            :disabled="fieldState[inputField.varName]?.disabled"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors
                   disabled:opacity-50"
          >
            <option v-for="opt in inputField.options" :key="opt.value ?? opt.text" :value="inputField.selectReturnValue === 'value' ? opt.value : opt.text">
              {{ opt.text }}
            </option>
          </select>
          <p v-if="inputField.hint" class="mt-1 text-xs text-on-surface/60">{{ inputField.hint }}</p>
        </template>

        <!-- Color picker -->
        <template v-else-if="inputField.type === fieldTypes.COLOR">
          <InputColor v-model="(model as Record<string, any>)[inputField.varName]" />
        </template>
      </div>
    </template>
  </form>
</template>

<script lang="ts" setup>
import { fieldTypes } from "@/composables/forms";
import type { AutoFormItems } from "~/types/auto-forms";

const model = defineModel<Record<string, any> | any[]>({
  type: [Object, Array],
  required: true,
});
// isValid: kept for API compatibility; always true with native form
const isValid = defineModel("isValid", { type: Boolean, default: true });
isValid.value = true;

const props = defineProps({
  updateMode: {
    default: false,
    type: Boolean,
  },
  items: {
    default: null,
    type: Array as () => AutoFormItems,
  },
  width: {
    type: [Number, String],
    default: "max",
  },
  color: {
    default: null,
    type: String,
  },
  dark: {
    default: false,
    type: Boolean,
  },
  disabledFields: {
    default: null,
    type: Array as () => string[],
  },
  readonlyFields: {
    default: null,
    type: Array as () => string[],
  },
});

const fieldState = computed<Record<string, { readonly: boolean; disabled: boolean }>>(() => {
  const map: Record<string, { readonly: boolean; disabled: boolean }> = {};
  (props.items || []).forEach((field: any) => {
    const base = (field.disableUpdate && props.updateMode) || (!props.updateMode && field.disableCreate);
    map[field.varName] = {
      readonly: base || !!props.readonlyFields?.includes(field.varName),
      disabled: base || !!props.disabledFields?.includes(field.varName),
    };
  });
  return map;
});
</script>
