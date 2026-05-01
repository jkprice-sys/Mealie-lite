<template>
  <div>
    <button
      type="button"
      class="focus:outline-none transition-colors"
      :class="buttonStyle
        ? 'w-10 h-10 rounded-full bg-info flex items-center justify-center hover:bg-info/80'
        : 'p-1 rounded hover:bg-primary/10 text-on-surface/50 hover:text-on-surface'"
      :title="$t('recipe.open-timeline')"
      @click.prevent="toggleTimeline"
    >
      <AppIcon
        :path="$globals.icons.timelineText"
        :size="buttonStyle ? 'lg' : 'sm'"
        :class="buttonStyle ? 'text-white' : ''"
      />
    </button>

    <BaseDialog
      v-model="showTimeline"
      :title="$t('recipe.timeline')"
      :icon="$globals.icons.timelineText"
    >
      <RecipeTimeline
        v-model="showTimeline"
        :query-filter="timelineAttrs.queryFilter"
        max-height="60vh"
      />
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import RecipeTimeline from "./RecipeTimeline.vue";

interface Props {
  buttonStyle?: boolean;
  slug?: string;
  recipeName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  buttonStyle: false,
  slug: "",
  recipeName: "",
});

const { $globals } = useNuxtApp();
const showTimeline = ref(false);

function toggleTimeline() {
  showTimeline.value = !showTimeline.value;
}

const timelineAttrs = computed(() => ({
  queryFilter: `recipe.slug="${props.slug}"`,
}));
</script>
