<template>
  <div
    v-if="userId"
    class="relative inline-flex items-center justify-center rounded-full overflow-hidden bg-surface border border-border shrink-0"
    :style="{ width: sizeStr, height: sizeStr }"
    :title="tooltip && user ? user.fullName : undefined"
  >
    <img
      v-if="!error"
      :src="imageURL"
      :alt="userId"
      class="w-full h-full object-cover"
      @load="error = false"
      @error="error = true"
    />
    <!-- Fallback: initial letter -->
    <span v-else class="text-xs font-medium text-on-surface/60 select-none">
      {{ user?.fullName?.[0]?.toUpperCase() || '?' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "~/composables/store/use-user-store";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  list: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "42px",
  },
  tooltip: {
    type: Boolean,
    default: true,
  },
});

const error = ref(false);

const auth = useMealieAuth();
const { store: users } = useUserStore();
const user = computed(() => users.value.find(u => u.id === props.userId));

// Normalize size to include px if numeric
const sizeStr = computed(() => {
  const s = String(props.size);
  return /^\d+$/.test(s) ? `${s}px` : s;
});

const imageURL = computed(() => {
  const authUser = auth.user.value;
  const key = authUser?.cacheKey ?? "";
  return `/api/media/users/${props.userId}/profile.webp?cacheKey=${key}`;
});
</script>
