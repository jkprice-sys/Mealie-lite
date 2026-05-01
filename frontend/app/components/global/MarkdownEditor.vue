<template>
  <div>
    <div v-if="displayPreview" class="flex justify-end mb-2">
      <BaseButtonGroup
        :buttons="[
          {
            icon: previewState ? $globals.icons.edit : $globals.icons.eye,
            text: previewState ? $t('general.edit') : $t('markdown-editor.preview-markdown-button-label'),
            event: 'toggle',
          },
        ]"
        @toggle="previewState = !previewState"
      />
    </div>
    <textarea
      v-if="!previewState"
      v-model="modelValue"
      v-bind="textarea"
      rows="4"
      class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
             focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-y"
      :class="label ? 'mt-5' : ''"
      :placeholder="label"
    />
    <SafeMarkdown
      v-else
      :source="modelValue"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  preview: {
    type: Boolean,
    default: undefined,
  },
  displayPreview: {
    type: Boolean,
    default: true,
  },
  textarea: {
    type: Object as () => unknown,
    default: () => ({}),
  },
});

const { $globals } = useNuxtApp();

const emit = defineEmits<{
  (e: "input:preview", value: boolean): void;
}>();

const modelValue = defineModel<string>("modelValue");

const fallbackPreview = ref(false);
const previewState = computed({
  get: () => props.preview ?? fallbackPreview.value,
  set: (val: boolean) => {
    if (props.preview) {
      emit("input:preview", val);
    }
    else {
      fallbackPreview.value = val;
    }
  },
});
</script>
