<template>
  <div>
    <form @submit.prevent="createRecipe">
      <h2 class="text-lg font-semibold text-on-surface mb-1">
        {{ $t("recipe.create-recipe-from-an-image") }}
      </h2>
      <p class="text-sm text-on-surface/70 mb-4">
        {{ $t("recipe.create-recipe-from-an-image-description") }}
      </p>

      <!-- Upload button (uses slot to avoid Vuetify v-btn inside AppButtonUpload) -->
      <AppButtonUpload
        url="none"
        file-name="images"
        accept="image/*"
        :post="false"
        :multiple="true"
        @uploaded="uploadImages"
      >
        <template #default="{ isSelecting, onButtonClick }">
          <button
            type="button"
            class="bs-btn bs-btn-md bs-btn-primary"
            :disabled="isSelecting"
            @click="onButtonClick"
          >
            <AppIcon :path="$globals.icons.fileImage" size="sm" />
            {{ uploadedImages.length ? $t('recipe.upload-more-images') : $t('recipe.upload-images') }}
          </button>
        </template>
      </AppButtonUpload>

      <!-- Image croppers -->
      <div v-if="uploadedImages.length" class="mt-4">
        <p class="text-sm text-on-surface/70 mb-3">
          {{ $t("recipe.crop-and-rotate-the-image") }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="(imageUrl, index) in uploadedImagesPreviewUrls"
            :key="index"
            class="flex flex-col gap-2"
          >
            <ImageCropper
              :img="imageUrl"
              cropper-height="100%"
              cropper-width="100%"
              :submitted="state.loading"
              @save="(croppedImage) => updateUploadedImage(index, croppedImage)"
              @delete="clearImage(index)"
            />
            <button
              v-if="uploadedImages.length > 1"
              type="button"
              :disabled="state.loading || index === 0"
              class="bs-btn bs-btn-sm w-full"
              :class="index === 0 ? 'bs-btn-primary' : 'bs-btn-outline'"
              @click="() => setCoverImage(index)"
            >
              <AppIcon
                :path="index === 0 ? $globals.icons.check : $globals.icons.fileImage"
                size="sm"
              />
              {{ index === 0 ? $t("recipe.cover-image") : $t("recipe.set-as-cover-image") }}
            </button>
          </div>
        </div>

        <!-- Options -->
        <div class="flex flex-col gap-2 mt-4">
          <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
            <input
              v-model="shouldTranslate"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
              :disabled="state.loading"
            />
            {{ $t('recipe.should-translate-description') }}
          </label>
          <label v-if="!liteMode" class="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
            <input
              v-model="parseRecipe"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-primary"
              :disabled="state.loading"
            />
            {{ $t('recipe.parse-recipe-ingredients-after-import') }}
          </label>
        </div>

        <!-- Submit -->
        <div class="flex flex-col items-center gap-2 mt-4">
          <BaseButton
            type="submit"
            :loading="state.loading"
            class="w-64"
          />
          <p v-if="state.loading" class="text-xs text-on-surface/50">
            {{
              uploadedImages.length > 1
                ? $t("recipe.please-wait-images-processing")
                : $t("recipe.please-wait-image-procesing")
            }}
          </p>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useNewRecipeOptions } from "~/composables/use-new-recipe-options";
import { useLiteMode } from "~/composables/use-lite-mode";

const liteMode = useLiteMode();
const { $globals } = useNuxtApp();

const state = reactive({
  loading: false,
});

const i18n = useI18n();
const api = useUserApi();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || "");

const uploadedImages = ref<(Blob | File)[]>([]);
const uploadedImageNames = ref<string[]>([]);
const uploadedImagesPreviewUrls = ref<string[]>([]);
const shouldTranslate = ref(true);

const { parseRecipe, navigateToRecipe } = useNewRecipeOptions({ enableParseRecipe: !liteMode });

function uploadImages(files: File[]) {
  uploadedImages.value = [...uploadedImages.value, ...files];
  uploadedImageNames.value = [...uploadedImageNames.value, ...files.map(file => file.name)];
  uploadedImagesPreviewUrls.value = [
    ...uploadedImagesPreviewUrls.value,
    ...files.map(file => URL.createObjectURL(file)),
  ];
}

function clearImage(index: number) {
  URL.revokeObjectURL(uploadedImagesPreviewUrls.value[index]);
  uploadedImages.value.splice(index, 1);
  uploadedImageNames.value.splice(index, 1);
  uploadedImagesPreviewUrls.value.splice(index, 1);
}

async function createRecipe() {
  if (uploadedImages.value.length === 0) return;
  state.loading = true;
  const translateLanguage = shouldTranslate.value ? i18n.locale : undefined;
  const { data, error } = await api.recipes.createOneFromImages(uploadedImages.value, translateLanguage?.value);
  if (error || !data) {
    alert.error(i18n.t("events.something-went-wrong"));
    state.loading = false;
  }
  else {
    navigateToRecipe(data, groupSlug.value, `/g/${groupSlug.value}/r/create/image`);
  }
}

function updateUploadedImage(index: number, croppedImage: Blob) {
  uploadedImages.value[index] = croppedImage;
  uploadedImagesPreviewUrls.value[index] = URL.createObjectURL(croppedImage);
}

function swapItem(array: any[], i: number, j: number) {
  if (i < 0 || j < 0 || i >= array.length || j >= array.length) return;
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
}

function swapImages(i: number, j: number) {
  swapItem(uploadedImages.value, i, j);
  swapItem(uploadedImageNames.value, i, j);
  swapItem(uploadedImagesPreviewUrls.value, i, j);
}

function setCoverImage(index: number) {
  if (index <= 0 || index >= uploadedImages.value.length) return;
  swapImages(0, index);
}
</script>
