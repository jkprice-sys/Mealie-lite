<template>
  <div class="flex flex-wrap items-start justify-start gap-2 my-2">
    <RecipeImageUploadBtn
      :slug="recipe.slug"
      @upload="uploadImage"
      @refresh="imageKey++"
      @delete="deleteImage"
    />
    <RecipeSettingsMenu
      v-model="recipe.settings"
      :is-owner="recipe.userId == user.id"
    />

    <!-- spacer + owner select pushed to right -->
    <div class="ml-auto flex items-center gap-2">
      <UserAvatar :user-id="recipe.userId" :tooltip="false" class="shrink-0" />
      <select
        v-model="recipe.userId"
        :disabled="!canEditOwner"
        class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
               focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
               transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[220px]"
      >
        <option
          v-for="u in allUsers"
          :key="u.id"
          :value="u.id"
        >
          {{ u.fullName }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePageState, usePageUser } from "~/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import type { Recipe } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";
import RecipeImageUploadBtn from "~/components/Domain/Recipe/RecipeImageUploadBtn.vue";
import RecipeSettingsMenu from "~/components/Domain/Recipe/RecipeSettingsMenu.vue";
import { useUserStore } from "~/composables/store/use-user-store";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

const { user }    = usePageUser();
const api         = useUserApi();
const { imageKey } = usePageState(recipe.value.slug);

const canEditOwner = computed(() => user.id === recipe.value.userId || user.admin);

const { store: allUsers } = useUserStore();

async function uploadImage(fileObject: File) {
  if (!recipe.value?.slug) return;
  const newVersion = await api.recipes.updateImage(recipe.value.slug, fileObject);
  if (newVersion?.data?.image) {
    recipe.value.image = newVersion.data.image;
  }
  imageKey.value++;
}

async function deleteImage() {
  recipe.value.image = "";
  imageKey.value++;
}
</script>
