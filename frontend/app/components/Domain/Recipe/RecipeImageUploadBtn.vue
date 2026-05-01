<template>
  <div class="text-center">
    <!-- Delete image confirmation dialog -->
    <BaseDialog
      v-model="dialogDeleteImage"
      :title="$t('recipe.delete-image')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteImage"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t("recipe.delete-image-confirmation") }}
      </div>
    </BaseDialog>

    <!-- Popover trigger + panel -->
    <div ref="containerRef" class="relative inline-block">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
        @click="menu = !menu"
      >
        <AppIcon :path="$globals.icons.fileImage" size="sm" />
        {{ $t("general.image") }}
      </button>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="menu"
          class="absolute bottom-full mb-2 right-0 z-50 w-96 rounded-lg border border-border bg-surface shadow-lg"
        >
          <!-- Header row -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <span class="font-semibold text-sm text-on-surface">{{ $t("recipe.recipe-image") }}</span>
            <div class="flex items-center gap-2">
              <AppButtonUpload
                url="none"
                file-name="image"
                :text-btn="false"
                :post="false"
                @uploaded="uploadImage"
              />
              <BaseButton delete @click="dialogDeleteImage = true" />
            </div>
          </div>

          <!-- URL input -->
          <div class="px-4 py-3">
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.url') }}</label>
            <div class="flex gap-2">
              <input
                v-model="url"
                type="text"
                class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                       focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary
                       hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!slug || loading"
                @click="getImageFromURL"
              >
                <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full inline-block" />
                <span v-else>{{ $t("general.get") }}</span>
              </button>
            </div>
            <p v-if="!slug" class="mt-1 text-xs text-on-surface/50">
              {{ $t("recipe.save-recipe-before-use") }}
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { alert } from "~/composables/use-toast";
import { useUserApi } from "~/composables/api";

const UPLOAD_EVENT = "upload";
const DELETE_EVENT = "delete";

const props = defineProps<{ slug: string }>();

const emit = defineEmits<{
  refresh: [];
  upload: [fileObject: File];
  delete: [];
}>();

const i18n = useI18n();
const api = useUserApi();

const url = ref("");
const loading = ref(false);
const menu = ref(false);
const dialogDeleteImage = ref(false);
const containerRef = ref<HTMLElement | null>(null);

onClickOutside(containerRef, () => { menu.value = false; });

function uploadImage(fileObject: File) {
  emit(UPLOAD_EVENT, fileObject);
  menu.value = false;
}

async function deleteImage() {
  loading.value = true;
  try {
    await api.recipes.deleteImage(props.slug);
    emit(DELETE_EVENT);
    menu.value = false;
  }
  catch (e) {
    alert.error(i18n.t("events.something-went-wrong"));
    console.error("Failed to delete image", e);
  }
  finally {
    loading.value = false;
  }
}

async function getImageFromURL() {
  loading.value = true;
  if (await api.recipes.updateImagebyURL(props.slug, url.value)) {
    emit(DELETE_EVENT);
  }
  loading.value = false;
  menu.value = false;
}
</script>
