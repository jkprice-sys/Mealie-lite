<template v-if="_showCards">
  <div class="text-center" :class="small ? 'text-sm' : 'text-base'">

    <!-- Total Time -->
    <div v-if="validateTotalTime" class="flex flex-nowrap items-center justify-center gap-2 mx-auto w-fit">
      <AppIcon
        :path="$globals.icons.clockOutline"
        :size="small ? 'sm' : 'lg'"
        class="text-primary shrink-0"
      />
      <p class="my-0 text-left">
        <span class="font-semibold opacity-80">{{ validateTotalTime.name }}</span><br>
        {{ validateTotalTime.value }}
      </p>
    </div>

    <hr
      v-if="validateTotalTime && (validatePrepTime || validatePerformTime)"
      class="my-2 border-border"
    />

    <!-- Prep & Perform Times -->
    <div
      v-if="validatePrepTime || validatePerformTime"
      class="flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 mx-auto"
    >
      <div v-if="validatePrepTime" class="flex flex-nowrap items-center gap-2">
        <AppIcon
          :path="$globals.icons.knife"
          :size="small ? 'sm' : 'lg'"
          class="text-primary shrink-0"
        />
        <p class="my-0 text-left">
          <span class="font-semibold opacity-80">{{ validatePrepTime.name }}</span><br>
          {{ validatePrepTime.value }}
        </p>
      </div>

      <div
        v-if="validatePrepTime && validatePerformTime"
        class="hidden sm:block w-px h-8 bg-border"
      />

      <div v-if="validatePerformTime" class="flex flex-nowrap items-center gap-2">
        <AppIcon
          :path="$globals.icons.potSteam"
          :size="small ? 'sm' : 'lg'"
          class="text-primary shrink-0"
        />
        <p class="my-0 text-left">
          <span class="font-semibold opacity-80">{{ validatePerformTime.name }}</span><br>
          {{ validatePerformTime.value }}
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const { $globals } = useNuxtApp();

interface Props {
  prepTime?: string | null;
  totalTime?: string | null;
  performTime?: string | null;
  color?: string;
  small?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  prepTime: null,
  totalTime: null,
  performTime: null,
  color: "accent custom-transparent",
  small: false,
});

const i18n = useI18n();

function isEmpty(str: string | null) {
  return !str || str.length === 0;
}

const _showCards = computed(() =>
  [props.prepTime, props.totalTime, props.performTime].some(x => !isEmpty(x)),
);

const validateTotalTime = computed(() =>
  !isEmpty(props.totalTime) ? { name: i18n.t("recipe.total-time"), value: props.totalTime } : null,
);

const validatePrepTime = computed(() =>
  !isEmpty(props.prepTime) ? { name: i18n.t("recipe.prep-time"), value: props.prepTime } : null,
);

const validatePerformTime = computed(() =>
  !isEmpty(props.performTime) ? { name: i18n.t("recipe.perform-time"), value: props.performTime } : null,
);
</script>
