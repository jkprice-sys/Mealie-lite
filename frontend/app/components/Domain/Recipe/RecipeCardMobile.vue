<template>
  <div
    :style="`height: ${height}px;`"
    class="w-full"
  >
    <NuxtLink
      :to="$attrs.selected ? undefined : recipeRoute"
      class="flex h-full rounded-lg border border-border bg-surface
             hover:shadow-md transition-shadow no-underline overflow-hidden"
      :class="[isFlat ? 'shadow-none bg-transparent border-transparent' : '', disableHighlight ? 'pointer-events-none' : '']"
      :style="{ cursor }"
      @click="$emit('selected')"
    >
      <!-- Image — left side (hidden when vertical layout) -->
      <div v-if="!vertical" class="shrink-0" style="width: 125px;">
        <slot name="avatar">
          <RecipeCardImage
            tiny
            :icon-size="100"
            :slug="slug"
            :recipe-id="recipeId"
            :image-version="image"
            height="100%"
          />
        </slot>
      </div>

      <!-- Content — right side -->
      <div class="flex flex-col flex-1 pl-4 pr-2 py-2 min-w-0 justify-between">
        <!-- Title -->
        <p class="text-sm font-medium text-on-surface truncate mt-1 mb-0.5">
          {{ name }}
        </p>

        <!-- Description -->
        <div class="text-xs text-on-surface/60 flex-1 overflow-hidden">
          <SafeMarkdown v-if="description" :source="description" />
        </div>

        <!-- Chips -->
        <div class="mt-1 overflow-hidden whitespace-nowrap">
          <RecipeChips
            :truncate="true"
            :items="tags"
            :title="false"
            :limit="2"
            small
            url-prefix="tags"
            v-bind="$attrs"
          />
        </div>

        <!-- Actions row -->
        <slot name="actions">
          <div class="flex items-center gap-1 mt-1">
            <RecipeFavoriteBadge
              v-if="isOwnGroup && showRecipeContent"
              :recipe-id="recipeId"
              show-always
            />
            <div v-else class="px-1" />

            <RecipeCardRating
              v-if="showRecipeContent"
              :model-value="rating"
              :recipe-id="recipeId"
              :class="!isOwnGroup ? 'pb-2' : ''"
            />

            <div class="flex-1" />

            <RecipeContextMenu
              v-if="isOwnGroup && showRecipeContent"
              :slug="slug"
              :menu-icon="$globals.icons.dotsHorizontal"
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
      </div>
    </NuxtLink>

    <slot />
  </div>
</template>

<script setup lang="ts">
import RecipeFavoriteBadge from "./RecipeFavoriteBadge.vue";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu.vue";
import RecipeCardImage from "./RecipeCardImage.vue";
import RecipeCardRating from "./RecipeCardRating.vue";
import RecipeChips from "./RecipeChips.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";

interface Props {
  name: string;
  slug: string;
  description: string;
  rating?: number;
  image?: string;
  tags?: Array<any>;
  recipeId: string;
  vertical?: boolean;
  isFlat?: boolean;
  height?: number;
  disableHighlight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rating: 0,
  image: "abc123",
  tags: () => [],
  vertical: false,
  isFlat: false,
  height: 150,
  disableHighlight: false,
});

defineEmits<{
  selected: [];
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
