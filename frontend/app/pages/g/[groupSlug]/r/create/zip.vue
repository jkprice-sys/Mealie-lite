<template>
  <div>
    <h2 class="text-lg font-semibold text-on-surface mb-1">
      {{ $t('recipe.import-from-zip') }}
    </h2>
    <p class="text-sm text-on-surface/70 mb-4">
      {{ $t('recipe.import-from-zip-description') }}
    </p>

    <!-- File picker -->
    <label
      class="flex items-center gap-3 w-full rounded-lg border border-border bg-surface
             px-4 py-3 cursor-pointer hover:border-primary transition-colors mb-1"
    >
      <AppIcon :path="$globals.icons.zip" size="sm" class="text-on-surface/40 shrink-0" />
      <span class="text-sm flex-1 truncate" :class="newRecipeZip ? 'text-on-surface' : 'text-on-surface/40'">
        {{ newRecipeZip ? newRecipeZip.name : '.zip' }}
      </span>
      <input
        type="file"
        accept=".zip"
        class="sr-only"
        @change="onFileChange"
      />
    </label>
    <p class="text-xs text-on-surface/50 mb-6 ml-1">
      {{ $t('recipe.zip-files-must-have-been-exported-from-mealie') }}
    </p>

    <!-- Submit -->
    <div class="flex flex-col items-center">
      <BaseButton
        :disabled="newRecipeZip === null"
        :loading="state.loading"
        class="w-64"
        @click="createByZip"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { useGlobalI18n } from "~/composables/use-global-i18n";
import { alert } from "~/composables/use-toast";

const { $globals } = useNuxtApp();

const state = reactive({
  loading: false,
});

const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const api = useUserApi();
const router = useRouter();

const newRecipeZip = ref<File | null>(null);
const newRecipeZipFileName = "archive";

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  newRecipeZip.value = input.files?.[0] ?? null;
}

async function createByZip() {
  if (!newRecipeZip.value) return;

  state.loading = true;
  const formData = new FormData();
  formData.append(newRecipeZipFileName, newRecipeZip.value);

  try {
    const response = await api.upload.file("/api/recipes/create/zip", formData);
    if (response?.status !== 201) throw new Error("Failed to upload zip");
    router.push(`/g/${groupSlug.value}/r/${response.data}`);
  }
  catch (error) {
    console.error(error);
    const i18n = useGlobalI18n();
    alert.error(i18n.t("events.something-went-wrong"));
  }
  finally {
    state.loading = false;
  }
}
</script>
