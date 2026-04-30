<template>
  <div class="rating-display">
    <span
      v-for="(star, index) in ratingDisplay"
      :key="index"
      class="star"
      :class="[
        'star',
        star === 'half' ? 'star-half' : '',
        useGroupStyle ? 'text-on-surface/40' : 'text-accent',
      ]"
    >
      <!-- Empty star (shown for empty and half) -->
      <span v-if="star === 'empty' || star === 'half'" class="star-empty">☆</span>
      <!-- Full star (shown for full and half; half is clipped to 50% width) -->
      <span v-if="star === 'full' || star === 'half'" class="star-full">★</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useUserSelfRatings } from "~/composables/use-users";

type Star = "full" | "half" | "empty";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  recipeId:   { type: String, default: "" },
});

const { isOwnGroup } = useLoggedInState();
const { userRatings } = useUserSelfRatings();

const userRating = computed(() =>
  userRatings.value.find(r => r.recipeId === props.recipeId)?.rating ?? undefined
);

const ratingValue    = computed(() => userRating.value || props.modelValue || 0);
const useGroupStyle  = computed(() => isOwnGroup.value && !userRating.value && props.modelValue);

const ratingDisplay = computed<Star[]>(() => {
  const stars: Star[] = [];
  for (let i = 0; i < 5; i++) {
    const diff = ratingValue.value - i;
    if (diff >= 1)    stars.push("full");
    else if (diff >= 0.25) stars.push("half");
    else              stars.push("empty");
  }
  return stars;
});
</script>

<style scoped>
.rating-display {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}

.star {
  font-size: 18px;
  transition: color 0.2s ease;
  user-select: none;
  position: relative;
  display: inline-block;
}

/* Half-star: overlay the full ★ clipped to 50% on top of the empty ☆ */
.star.star-half .star-full {
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  overflow: hidden;
}
</style>
