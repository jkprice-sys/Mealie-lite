<template>
  <div>
    <!-- Section title -->
    <h2 class="text-xl font-medium pb-3 flex items-center gap-2 text-on-surface">
      <AppIcon :path="$globals.icons.commentTextMultipleOutline" size="md" class="text-on-surface/60" />
      {{ $t("recipe.comments") }}
    </h2>
    <hr class="mx-2 border-t border-border" />

    <!-- New comment form (logged-in users only) -->
    <div v-if="user.id" class="flex flex-col mt-3">
      <div class="flex gap-3">
        <UserAvatar
          :tooltip="false"
          size="40"
          :user-id="user.id"
        />
        <textarea
          v-model="comment"
          rows="2"
          :placeholder="$t('recipe.join-the-conversation')"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary
                 focus:border-primary transition-colors"
        />
      </div>
      <div class="ml-auto mt-1">
        <BaseButton
          size="small"
          :disabled="!comment"
          @click="submitComment"
        >
          <template #icon>
            {{ $globals.icons.check }}
          </template>
          {{ $t("general.submit") }}
        </BaseButton>
      </div>
    </div>

    <!-- Comment list -->
    <div
      v-for="recipeComment in recipe.comments"
      :key="recipeComment.id"
      class="flex gap-3 my-2"
    >
      <UserAvatar
        :tooltip="false"
        size="40"
        :user-id="recipeComment.userId"
      />
      <div class="flex-1 border border-border rounded-lg overflow-hidden">
        <div class="px-3 pt-3 pb-1">
          <p class="text-sm font-medium text-on-surface/70 mb-1">
            {{ recipeComment.user.fullName }}
            <span class="font-normal">•</span>
            {{ $d(Date.parse(recipeComment.createdAt), "medium") }}
          </p>
          <SafeMarkdown :source="recipeComment.text" />
        </div>
        <div
          v-if="user.id == recipeComment.user.id || user.admin"
          class="flex justify-end px-3 pb-2"
        >
          <button
            type="button"
            class="text-xs text-error hover:underline transition-colors"
            @click="deleteComment(recipeComment.id)"
          >
            {{ $t("general.delete") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { Recipe } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import { usePageUser } from "~/composables/recipe-page/shared-state";
import SafeMarkdown from "~/components/global/SafeMarkdown.vue";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const api = useUserApi();
const { user } = usePageUser();
const comment = ref("");

async function submitComment() {
  const { data } = await api.recipes.comments.createOne({
    recipeId: recipe.value.id,
    text: comment.value,
  });

  if (data) {
    recipe.value.comments.push(data);
  }

  comment.value = "";
}

async function deleteComment(id: string) {
  const { response } = await api.recipes.comments.deleteOne(id);

  if (response?.status === 200) {
    recipe.value.comments = recipe.value.comments.filter(comment => comment.id !== id);
  }
}
</script>
