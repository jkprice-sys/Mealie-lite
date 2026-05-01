<template>
  <img
    v-if="!hideImage"
    :key="imageKey"
    :src="recipeImageUrl"
    loading="lazy"
    class="w-full print:hidden block object-cover"
    :style="{ height: imageHeight, maxWidth: maxWidth || undefined }"
    @error="hideImage = true"
  />
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { useStaticRoutes, useUserApi } from "~/composables/api";
import type { HouseholdSummary } from "~/lib/api/types/household";
import { usePageState, usePageUser } from "~/composables/recipe-page/shared-state";
import type { Recipe } from "~/lib/api/types/recipe";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  maxWidth?: string;
}
const props = withDefaults(defineProps<Props>(), {
  maxWidth: undefined,
});

const bp = useBreakpoints(breakpointsTailwind);
const isMobile = bp.smaller("md");

const { recipeImage, recipeSmallImage } = useStaticRoutes();
const { imageKey } = usePageState(props.recipe.slug);
const { user } = usePageUser();

const recipeHousehold = ref<HouseholdSummary>();
if (user) {
  const userApi = useUserApi();
  userApi.households.getOne(props.recipe.householdId).then(({ data }) => {
    recipeHousehold.value = data || undefined;
  });
}

const hideImage = ref(false);

const imageHeight = computed(() => isMobile.value ? "200px" : "400px");

const recipeImageUrl = computed(() => {
  return isMobile.value
    ? recipeSmallImage(props.recipe.id, props.recipe.image, imageKey.value)
    : recipeImage(props.recipe.id, props.recipe.image, imageKey.value);
});

watch(
  () => recipeImageUrl.value,
  () => { hideImage.value = false; },
);
</script>
