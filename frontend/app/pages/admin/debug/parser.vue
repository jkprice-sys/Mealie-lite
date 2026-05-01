<template>
  <div class="px-4 py-4">
    <div>
      <BaseCardSectionTitle :title="$t('admin.ingredients-natural-language-processor')">
        {{ $t('admin.ingredients-natural-language-processor-explanation') }}
        <p class="pt-3">
          {{ $t('admin.ingredients-natural-language-processor-explanation-2') }}
        </p>
      </BaseCardSectionTitle>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <!-- Parser toggle button group -->
        <div class="inline-flex rounded-lg border border-border overflow-hidden">
          <button
            v-for="p in ['nlp', 'brute', 'openai']"
            :key="p"
            type="button"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="state.parser === p ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-primary/10'"
            @click="state.parser = p as typeof state.parser; processIngredient()"
          >
            {{ $t(`admin.${p}`) }}
          </button>
        </div>

        <label class="flex items-center gap-2 cursor-pointer ml-2">
          <input v-model="showConfidence" type="checkbox" class="accent-primary" />
          <span class="text-sm text-on-surface">{{ $t('admin.show-individual-confidence') }}</span>
        </label>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ $t('admin.ingredient-text') }}</label>
          <input
            v-model="state.ingredient"
            type="text"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div class="flex justify-end">
          <BaseButton @click="processIngredient">
            <template #icon>
              {{ $globals.icons.check }}
            </template>
            {{ $t("general.submit") }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="state.results" class="mt-6">
      <div
        v-if="state.parser !== 'brute' && getConfidence('average')"
        class="flex justify-center mb-4"
      >
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
          :class="`bg-${getColor('average')}`"
        >
          {{ $t('admin.average-confident', [getConfidence("average")]) }}
        </span>
      </div>

      <div class="flex flex-wrap justify-center gap-6">
        <template v-for="(prop, index) in properties" :key="index">
          <div v-if="prop.value" class="flex-grow min-w-[200px] max-w-[280px]">
            <div class="rounded-xl border border-border bg-surface p-4">
              <p class="text-base font-semibold text-on-surface">{{ prop.value }}</p>
              <p class="text-sm text-on-surface/60 mt-1">{{ prop.subtitle }}</p>
            </div>
            <div v-if="prop.confidence && showConfidence" class="mt-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                :class="`bg-${prop.color}`"
              >
                {{ $t('admin.average-confident', [prop.confidence]) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Try an example -->
    <div class="mt-6 max-w-2xl mx-auto">
      <h3 class="text-base font-semibold text-on-surface mb-3">{{ $t('admin.try-an-example') }}</h3>
      <div class="space-y-2">
        <div
          v-for="(text, idx) in tryText"
          :key="idx"
          class="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-on-surface cursor-pointer hover:bg-primary/5 transition-colors"
          @click="processTryText(text)"
        >
          {{ text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { alert } from "~/composables/use-toast";
import { useUserApi } from "~/composables/api";
import type { IngredientConfidence } from "~/lib/api/types/recipe";
import type { Parser } from "~/lib/api/user/recipes/recipe";

type ConfidenceAttribute = "average" | "comment" | "name" | "unit" | "quantity" | "food";

definePageMeta({
  layout: "admin",
});

const api = useUserApi();
const { $globals } = useNuxtApp();

const state = reactive({
  loading: false,
  ingredient: "",
  results: false,
  parser: "nlp" as Parser,
});

const i18n = useI18n();

useSeoMeta({
  title: i18n.t("admin.parser"),
});

const confidence = ref<IngredientConfidence>({});

function getColor(attribute: ConfidenceAttribute) {
  const percentage = getConfidence(attribute);
  if (percentage === undefined) return "warning";

  const p_as_num = parseFloat(percentage.replace("%", ""));

  if (p_as_num > 75) return "success";
  else if (p_as_num > 60) return "warning";
  else return "error";
}

function getConfidence(attribute: ConfidenceAttribute) {
  if (!confidence.value) return;

  const property = confidence.value[attribute];
  if (property !== undefined && property !== null) {
    return `${(+property * 100).toFixed(0)}%`;
  }
  return undefined;
}

const tryText = [
  "2 tbsp minced cilantro, leaves and stems",
  "1 large yellow onion, coarsely chopped",
  "1 1/2 tsp garam masala",
  "1 inch piece fresh ginger, (peeled and minced)",
  "2 cups mango chunks, (2 large mangoes) (fresh or frozen)",
];

function processTryText(str: string) {
  state.ingredient = str;
  processIngredient();
}

async function processIngredient() {
  if (state.ingredient === "") return;

  state.loading = true;

  const { data } = await api.recipes.parseIngredient(state.parser, state.ingredient);

  if (data) {
    state.results = true;

    if (data.confidence) confidence.value = data.confidence;

    properties.comment.value = data.ingredient.note || "";
    properties.quantity.value = data.ingredient.quantity || "";
    properties.unit.value = data.ingredient?.unit?.name || "";
    properties.food.value = data.ingredient?.food?.name || "";

    (["comment", "quantity", "unit", "food"] as ConfidenceAttribute[]).forEach((property) => {
      const color = getColor(property);
      const conf = getConfidence(property);
      if (color) properties[property].color = color;
      if (conf) properties[property].confidence = conf;
    });
  }
  else {
    alert.error(i18n.t("events.something-went-wrong") as string);
    state.results = false;
  }
  state.loading = false;
}

const properties = reactive({
  quantity: {
    subtitle: i18n.t("recipe.quantity"),
    value: "" as string | number,
    color: null as string | null,
    confidence: null as string | null,
  },
  unit: {
    subtitle: i18n.t("recipe.unit"),
    value: "",
    color: null as string | null,
    confidence: null as string | null,
  },
  food: {
    subtitle: i18n.t("shopping-list.food"),
    value: "",
    color: null as string | null,
    confidence: null as string | null,
  },
  comment: {
    subtitle: i18n.t("recipe.comment"),
    value: "",
    color: null as string | null,
    confidence: null as string | null,
  },
});

const showConfidence = ref(false);
</script>
