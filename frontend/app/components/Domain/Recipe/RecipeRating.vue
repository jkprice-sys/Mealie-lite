<template>
  <div @click.prevent>
    <!-- Interactive user rating (shown for own group members) -->
    <div
      v-if="isOwnGroup"
      class="flex items-center gap-0.5"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false; hoverVal = 0"
    >
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="focus:outline-none"
        :class="small ? 'p-px' : 'p-0.5'"
        @mouseenter="hoverVal = star"
        @click="updateRating(star)"
      >
        <svg
          viewBox="0 0 24 24"
          :class="[
            small ? 'w-3.5 h-3.5' : 'w-5 h-5',
            (hoverVal || userRating || modelValue || 0) >= star ? 'text-amber-400' : 'text-on-surface/25',
          ]"
        >
          <path
            fill="currentColor"
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      </button>
    </div>

    <!-- Group rating (read-only, supports half increments) -->
    <div
      v-else
      class="flex items-center gap-0.5"
    >
      <div
        v-for="pos in 5"
        :key="pos"
        class="relative"
        :class="small ? 'w-3.5 h-3.5' : 'w-5 h-5'"
      >
        <!-- Empty star (base layer) -->
        <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full text-on-surface/25">
          <path
            fill="currentColor"
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
        <!-- Filled star (clipped to fraction) -->
        <svg
          viewBox="0 0 24 24"
          class="absolute inset-0 w-full h-full text-amber-400"
          :style="{ clipPath: getClipPath(pos, groupRating) }"
        >
          <path
            fill="currentColor"
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useUserSelfRatings } from "~/composables/use-users";

interface Props {
  emitOnly?: boolean;
  recipeId?: string;
  slug?: string;
  small?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  emitOnly: false,
  recipeId: "",
  slug: "",
  small: false,
});

const modelValue = defineModel<number>({ default: 0 });

const { isOwnGroup } = useLoggedInState();
const { userRatings, setRating, ready: ratingsLoaded } = useUserSelfRatings();

const isHovering = ref(false);
const hoverVal = ref(0);

const userRating = computed(() => {
  return userRatings.value.find(r => r.recipeId === props.recipeId)?.rating ?? undefined;
});

// Once user sets a rating, hide group rating (it's stale until reload)
const hideGroupRating = ref(!!userRating.value);
watch(
  () => userRating.value,
  () => {
    if (userRating.value) hideGroupRating.value = true;
  },
);

const groupRating = computed(() => {
  return hideGroupRating.value ? 0 : modelValue.value;
});

function updateRating(val?: number) {
  if (!isOwnGroup.value) return;
  if (val === userRating.value) val = 0;
  if (!props.emitOnly) {
    setRating(props.slug, val || 0, null);
  }
  modelValue.value = val ?? 0;
}

/**
 * Returns a CSS clip-path that fills `pos` star based on `rating`.
 * Supports half-star increments.
 */
function getClipPath(pos: number, rating: number): string {
  const floor = Math.floor(rating);
  if (pos <= floor) {
    return "none"; // fully filled
  }
  const frac = rating - floor;
  if (pos === floor + 1 && frac >= 0.25) {
    // partial fill: clip right portion
    const pct = Math.round(frac * 100);
    return `inset(0 ${100 - pct}% 0 0)`;
  }
  return "inset(0 100% 0 0)"; // fully empty
}
</script>
