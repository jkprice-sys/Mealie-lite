<template>
  <div
    class="relative overflow-hidden bg-gray-100 dark:bg-gray-800 w-full"
    :style="containerStyle"
    @click="$emit('click')"
  >
    <!-- Recipe image -->
    <img
      v-if="!fallBackImage"
      :src="getImage(recipeId)"
      :alt="slug || ''"
      class="w-full h-full object-cover"
      @load="fallBackImage = false"
      @error="fallBackImage = true"
    />

    <!-- Fallback: centered app icon when image fails or is missing -->
    <div
      v-else
      class="w-full h-full flex items-center justify-center"
    >
      <svg
        viewBox="0 0 24 24"
        class="text-primary opacity-70 fill-current"
        :style="`width: ${iconSize}px; height: ${iconSize}px;`"
        aria-hidden="true"
      >
        <path :d="$globals.icons.primary" />
      </svg>
    </div>

    <!-- Overlay content (e.g. hover description from RecipeCard) -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useStaticRoutes } from "~/composables/api";

interface Props {
  tiny?: boolean | null;
  small?: boolean | null;
  large?: boolean | null;
  iconSize?: number | string;
  slug?: string | null;
  recipeId: string;
  imageVersion?: string | null;
  height?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  tiny: null,
  small: null,
  large: null,
  iconSize: 100,
  slug: null,
  imageVersion: null,
  height: "100%",
});

defineEmits<{ click: [] }>();

const { $globals } = useNuxtApp();
const { recipeImage, recipeSmallImage, recipeTinyImage } = useStaticRoutes();

const fallBackImage = ref(false);

const containerStyle = computed(() => {
  const h = props.height;
  if (h === "100%") return { height: "100%" };
  return { height: typeof h === "number" ? `${h}px` : h, minHeight: "125px" };
});

const imageSize = computed(() => {
  if (props.tiny)  return "tiny";
  if (props.small) return "small";
  return "large";
});

// Reset fallback when recipe changes
watch(() => props.recipeId, () => {
  fallBackImage.value = false;
});

function getImage(recipeId: string) {
  switch (imageSize.value) {
    case "tiny":  return recipeTinyImage(recipeId, props.imageVersion);
    case "small": return recipeSmallImage(recipeId, props.imageVersion);
    default:      return recipeImage(recipeId, props.imageVersion);
  }
}
</script>
