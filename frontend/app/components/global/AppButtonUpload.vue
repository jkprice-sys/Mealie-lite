<template>
  <div>
    <input
      ref="uploader"
      class="hidden"
      type="file"
      :accept="accept"
      :multiple="multiple"
      @change="onFileChanged"
    />
    <slot v-bind="{ isSelecting, onButtonClick }">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-on-surface hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="textBtn ? 'bg-transparent' : 'bg-surface shadow-sm'"
        :disabled="disabled || isSelecting"
        @click="onButtonClick"
      >
        <span v-if="isSelecting" class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full inline-block" />
        <AppIcon v-else :path="effIcon" size="sm" />
        {{ text || defaultText }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";

const UPLOAD_EVENT = "uploaded";

const props = defineProps({
  small: { type: Boolean, default: false },
  post: { type: Boolean, default: true },
  url: { type: String, default: "" },
  text: { type: String, default: "" },
  icon: { type: String, default: null },
  fileName: { type: String, default: "archive" },
  textBtn: { type: Boolean, default: true },
  accept: { type: String, default: "" },
  color: { type: String, default: "info" },
  disabled: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (e: "uploaded", payload: File | File[] | unknown | null): void;
}>();

const selectedFiles = ref<File[]>([]);
const uploader = ref<HTMLInputElement | null>(null);
const isSelecting = ref(false);

const i18n = useI18n();
const { $globals } = useNuxtApp();
const effIcon = props.icon ? props.icon : $globals.icons.upload;
const defaultText = i18n.t("general.upload");

const api = useUserApi();

async function upload() {
  if (selectedFiles.value.length === 0) return;
  isSelecting.value = true;

  if (!props.post) {
    emit(UPLOAD_EVENT, props.multiple ? selectedFiles.value : selectedFiles.value[0]);
    isSelecting.value = false;
    return;
  }

  if (props.multiple && selectedFiles.value.length > 1) {
    console.warn("Multiple file uploads are not supported by the API.");
    return;
  }

  const file = selectedFiles.value[0];
  const formData = new FormData();
  formData.append(props.fileName, file);

  try {
    const response = await api.upload.file(props.url, formData);
    if (response) emit(UPLOAD_EVENT, response);
  }
  catch (e) {
    console.error(e);
    emit(UPLOAD_EVENT, null);
  }

  isSelecting.value = false;
}

function onFileChanged(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files !== null && target.files.length > 0) {
    selectedFiles.value = Array.from(target.files);
    upload();
  }
}

function onButtonClick() {
  isSelecting.value = true;
  window.addEventListener("focus", () => { isSelecting.value = false; }, { once: true });
  uploader.value?.click();
}
</script>
