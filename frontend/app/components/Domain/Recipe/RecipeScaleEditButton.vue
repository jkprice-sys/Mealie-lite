<template>
  <div v-if="yieldDisplay" class="flex items-center gap-2">

    <!-- Servings badge — click opens popover when editable -->
    <div class="relative">
      <button
        type="button"
        :title="canEditScale ? $t('recipe.edit-scale') : undefined"
        class="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium
               bg-secondary/20 text-on-surface transition-colors"
        :class="canEditScale ? 'cursor-pointer hover:bg-secondary/30' : 'cursor-default'"
        @click="canEditScale && (menuOpen = !menuOpen)"
      >
        <AppIcon v-if="canEditScale" :path="$globals.icons.edit" size="sm" class="text-on-surface/50" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="yieldDisplay" />
      </button>

      <!-- Servings popover -->
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="menuOpen"
          ref="popoverRef"
          class="absolute bottom-full mb-2 left-0 z-30 w-64 bg-surface border border-border
                 rounded-lg shadow-xl p-4"
        >
          <p class="text-sm font-semibold text-on-surface mb-3">{{ $t("recipe.servings") }}</p>
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="yieldQuantity"
              min="1"
              step="1"
              class="flex-1 border-b border-border bg-transparent text-sm text-on-surface
                     focus:outline-none focus:border-primary transition-colors py-1 text-center"
              @input="onServingsInput"
            />
            <button
              type="button"
              :title="$t('recipe.reset-servings-count')"
              class="bs-btn bs-btn-sm bs-btn-ghost"
              @click="scale = 1"
            >
              <AppIcon :path="$globals.icons.undo" size="sm" />
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Increment / decrement buttons -->
    <BaseButtonGroup
      v-if="canEditScale"
      :large="false"
      :buttons="[
        {
          icon: $globals.icons.minus,
          text: $t('recipe.decrease-scale-label'),
          event: 'decrement',
          disabled: disableDecrement,
        },
        {
          icon: $globals.icons.createAlt,
          text: $t('recipe.increase-scale-label'),
          event: 'increment',
        },
      ]"
      @decrement="recalculateScale(yieldQuantity - 1)"
      @increment="recalculateScale(yieldQuantity + 1)"
    />

  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { useScaledAmount } from "~/composables/recipes/use-scaled-amount";

const { $globals } = useNuxtApp();

interface Props {
  recipeServings?: number;
  editScale?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  recipeServings: 0,
  editScale: false,
});

const scale = defineModel<number>({ required: true });
const menuOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
onClickOutside(popoverRef, () => { menuOpen.value = false; });

const i18n = useI18n();
const canEditScale = computed(() => props.editScale && props.recipeServings > 0);

function recalculateScale(newYield: number) {
  if (isNaN(newYield) || newYield <= 0) return;
  scale.value = props.recipeServings <= 0 ? 1 : newYield / props.recipeServings;
}

function onServingsInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  if (!isNaN(val)) recalculateScale(val);
}

const recipeYieldAmount = computed(() => useScaledAmount(props.recipeServings, scale.value));
const yieldQuantity = computed(() => recipeYieldAmount.value.scaledAmount);
const yieldDisplay = computed(() =>
  yieldQuantity.value
    ? i18n.t("recipe.serves-amount", { amount: recipeYieldAmount.value.scaledAmountDisplay }) as string
    : "",
);
const disableDecrement = computed(() => yieldQuantity.value <= 1);
</script>
