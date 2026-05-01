<template>
  <div>
    <h2 class="text-lg font-semibold text-on-surface mb-1">
      {{ $t('recipe.create-recipe') }}
    </h2>
    <p class="text-sm text-on-surface/70 mb-4">
      {{ $t('recipe.create-a-recipe-by-providing-the-name-all-recipes-must-have-unique-names') }}
    </p>

    <form @submit.prevent="createByName(newRecipeName)">
      <!-- Name input -->
      <div class="relative mb-1">
        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <AppIcon :path="$globals.icons.primary" size="sm" class="text-on-surface/40" />
        </div>
        <input
          v-model="newRecipeName"
          type="text"
          autofocus
          required
          :placeholder="$t('recipe.recipe-name')"
          class="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2.5 text-sm
                 text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
      <p class="text-xs text-on-surface/50 mb-6 ml-1">
        {{ $t('recipe.new-recipe-names-must-be-unique') }}
      </p>

      <!-- Submit -->
      <div class="flex flex-col items-center">
        <BaseButton
          type="submit"
          :disabled="newRecipeName.trim() === ''"
          :loading="state.loading"
          class="w-64"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { AxiosResponse } from "axios";
import { useUserApi } from "~/composables/api";

const { $globals } = useNuxtApp();

const state = reactive({
  error: false,
  loading: false,
});

const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const api = useUserApi();
const router = useRouter();

function handleResponse(response: AxiosResponse<string> | null, edit = false) {
  if (response?.status !== 201) {
    state.error = true;
    state.loading = false;
    return;
  }
  router.push(`/g/${groupSlug.value}/r/${response.data}?edit=${edit.toString()}`);
}

const newRecipeName = ref("");

async function createByName(name: string) {
  if (name.trim() === "") return;
  state.loading = true;
  const { response } = await api.recipes.createOne({ name });
  handleResponse(response as any, true);
}
</script>
