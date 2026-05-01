<template>
  <button
    v-if="isFavorite || showAlways"
    type="button"
    :title="isFavorite ? $t('recipe.remove-from-favorites') : $t('recipe.add-to-favorites')"
    :class="[
      'bs-btn rounded-full transition-colors',
      buttonStyle
        ? 'bs-btn-sm bg-info text-white hover:brightness-90'
        : 'p-1 text-accent hover:bg-accent/10',
    ]"
    @click.prevent="toggleFavorite"
  >
    <AppIcon
      :path="isFavorite ? $globals.icons.heart : $globals.icons.heartOutline"
      :size="buttonStyle ? 'lg' : 'md'"
    />
  </button>
</template>

<script setup lang="ts">
import { useUserSelfRatings } from "~/composables/use-users";

interface Props {
  recipeId?:   string;
  slug?:       string;
  showAlways?: boolean;
  buttonStyle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  recipeId: "",
  slug: "",
  showAlways: false,
  buttonStyle: false,
});

const { $globals } = useNuxtApp();
const { userRatings, setRating } = useUserSelfRatings();

const isFavorite = computed(() =>
  userRatings.value.find(r => r.recipeId === props.recipeId)?.isFavorite ?? false
);

async function toggleFavorite() {
  if (!props.slug) return;
  await setRating(props.slug, null, !isFavorite.value);
}
</script>
