<template>
  <NuxtLink
    :to="recipeRoute"
    class="group bs-card overflow-hidden flex flex-col no-underline transition-shadow duration-150 hover:shadow-lg"
    :style="{ minHeight: `${imageHeight + 75}px`, cursor }"
    @click.self="$emit('click')"
  >
    <!-- Image + hover description overlay -->
    <div class="relative shrink-0">
      <RecipeCardImage
        small
        :icon-size="imageHeight"
        :height="imageHeight"
        :slug="slug"
        :recipe-id="recipeId"
        :image-version="image"
      />

      <!-- Description revealed on hover -->
      <div
        v-if="description"
        class="absolute inset-0 bg-secondary/80 opacity-0 group-hover:opacity-100
               transition-opacity duration-200 flex items-start justify-center p-4 overflow-hidden"
      >
        <div class="text-white text-sm line-clamp-8">
          <SafeMarkdown :source="description" />
        </div>
      </div>
    </div>

    <!-- Recipe name -->
    <h3 class="px-4 pt-3 pb-1 text-lg font-normal text-on-surface truncate">
      {{ name }}
    </h3>

    <!-- Actions row -->
    <slot name="actions">
      <div
        v-if="showRecipeContent"
        class="flex items-center px-1 pb-1 gap-1 mt-auto flex-wrap"
      >
        <RecipeFavoriteBadge
          v-if="isOwnGroup"
          :recipe-id="recipeId"
          :slug="slug"
          show-always
        />
        <div v-else class="px-1" />

        <RecipeCardRating
          :model-value="rating"
          :recipe-id="recipeId"
        />

        <div class="flex-1" />

        <RecipeChips
          :truncate="true"
          :items="tags"
          :title="false"
          :limit="2"
          small
          url-prefix="tags"
          v-bind="$attrs"
        />

        <RecipeContextMenu
          v-if="isOwnGroup"
          color="grey-darken-2"
          :slug="slug"
          :menu-icon="$globals.icons.dotsVertical"
          :name="name"
          :recipe-id="recipeId"
          :use-items="{
            delete: false,
            edit: false,
            download: true,
            mealplanner: true,
            shoppingList: true,
            print: false,
            printPreferences: false,
            share: true,
          }"
          @deleted="$emit('delete', slug)"
        />
      </div>
    </slot>

    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import RecipeFavoriteBadge from "./RecipeFavoriteBadge.vue";
import RecipeChips from "./RecipeChips.vue";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu.vue";
import RecipeCardImage from "./RecipeCardImage.vue";
import RecipeCardRating from "./RecipeCardRating.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";

interface Props {
  name: string;
  slug: string;
  description?: string | null;
  rating?: number;
  ratingColor?: string;
  image?: string;
  tags?: Array<any>;
  recipeId: string;
  imageHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  description: null,
  rating: 0,
  ratingColor: "secondary",
  image: "abc123",
  tags: () => [],
  imageHeight: 200,
});

defineEmits<{
  click: [];
  delete: [slug: string];
}>();

const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const { isOwnGroup } = useLoggedInState();

const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");
const showRecipeContent = computed(() => !!props.recipeId && !!props.slug);
const recipeRoute = computed<string>(() =>
  showRecipeContent.value ? `/g/${groupSlug.value}/r/${props.slug}` : ""
);
const cursor = computed(() => showRecipeContent.value ? "pointer" : "auto");
</script>
