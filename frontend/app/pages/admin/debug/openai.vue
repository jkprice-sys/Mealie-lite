<template>
  <div class="px-4 py-4">
    <div>
      <BaseCardSectionTitle :title="$t('admin.debug-openai-services')">
        {{ $t('admin.debug-openai-services-description') }}
        <br />
        <DocLink class="mt-2" link="/documentation/getting-started/installation/open-ai" />
      </BaseCardSectionTitle>
    </div>

    <form @submit.prevent="testOpenAI">
      <div class="space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <AppButtonUpload
            v-if="!uploadedImage"
            url="none"
            file-name="image"
            accept="image/*"
            :text="$t('recipe.upload-image')"
            :text-btn="false"
            :post="false"
            @uploaded="uploadImage"
          />
          <button
            v-if="!!uploadedImage"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-error px-3 py-2 text-sm font-medium text-white hover:bg-error/90 transition-colors"
            @click="clearImage"
          >
            <AppIcon :path="$globals.icons.close" size="sm" />
            {{ $t("recipe.remove-image") }}
          </button>
        </div>

        <div v-if="uploadedImage && uploadedImagePreviewUrl" class="max-w-xs">
          <img :src="uploadedImagePreviewUrl" class="rounded-lg border border-border object-contain max-h-48" />
        </div>

        <div class="flex justify-end">
          <BaseButton
            type="submit"
            :text="$t('admin.run-test')"
            :icon="$globals.icons.check"
            :loading="loading"
          />
        </div>
      </div>
    </form>

    <template v-if="response">
      <hr class="border-border mt-4" />
      <div class="mt-4">
        <h3 class="text-base font-semibold text-on-surface mb-2">{{ $t('admin.test-results') }}</h3>
        <p class="text-sm text-on-surface/80 whitespace-pre-wrap">{{ response }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAdminApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";

definePageMeta({
  layout: "admin",
});

const api = useAdminApi();
const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("admin.debug-openai-services"),
});

const loading = ref(false);
const response = ref("");

const uploadedImage = ref<Blob | File>();
const uploadedImageName = ref<string>("");
const uploadedImagePreviewUrl = ref<string>();

function uploadImage(fileObject: File) {
  uploadedImage.value = fileObject;
  uploadedImageName.value = fileObject.name;
  uploadedImagePreviewUrl.value = URL.createObjectURL(fileObject);
}

function clearImage() {
  uploadedImage.value = undefined;
  uploadedImageName.value = "";
  uploadedImagePreviewUrl.value = undefined;
}

async function testOpenAI() {
  response.value = "";

  loading.value = true;
  const { data } = await api.debug.debugOpenAI(uploadedImage.value);
  loading.value = false;

  if (!data) {
    alert.error("Unable to test OpenAI services");
  }
  else {
    response.value = data.response || (data.success ? "Test Successful" : "Test Failed");
  }
}

// suppress unused
void uploadedImageName;
</script>
