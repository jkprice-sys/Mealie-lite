<template>
  <div class="lg-container mx-auto px-4 py-6">
    <BasePageTitle divider>
      <template #header>
        <img width="100" height="100" src="/svgs/manage-cookbooks.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('meal-plan.meal-plan-rules') }}
      </template>
      <p class="text-sm text-on-surface/70">{{ $t('meal-plan.meal-plan-rules-description') }}</p>
    </BasePageTitle>

    <!-- New rule card -->
    <div class="rounded-xl border border-border bg-surface mt-6">
      <div class="px-4 pt-4 pb-1">
        <h2 class="text-base font-semibold text-on-surface">{{ $t('meal-plan.new-rule') }}</h2>
      </div>
      <hr class="border-border mx-4" />
      <div class="px-4 py-3">
        <p class="text-sm text-on-surface/70 mb-3">{{ $t('meal-plan.new-rule-description') }}</p>
        <GroupMealPlanRuleForm
          :key="createDataFormKey"
          v-model:day="createData.day"
          v-model:entry-type="createData.entryType"
          v-model:query-filter-string="createData.queryFilterString"
          class="mt-2"
        />
      </div>
      <div class="flex justify-end px-4 pb-3">
        <BaseButton create :disabled="!createData.queryFilterString" @click="createRule" />
      </div>
    </div>

    <!-- Existing rules -->
    <section class="mt-10">
      <BaseCardSectionTitle :title="$t('meal-plan.recipe-rules')" />
      <div class="space-y-3 mt-4">
        <div
          v-for="(rule, idx) in allRules"
          :key="rule.id"
          class="rounded-xl border-l-4 border-l-primary border border-border bg-surface overflow-hidden"
        >
          <!-- Rule header -->
          <div class="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
            <p class="text-sm font-medium text-on-surface">
              {{ rule.day === "unset" ? $t('meal-plan.applies-to-all-days') : $t('meal-plan.applies-on-days', [rule.day]) }}
              {{ rule.entryType === "unset" ? $t('meal-plan.for-all-meal-types') : $t('meal-plan.for-type-meal-types', [rule.entryType]) }}
            </p>
            <BaseButtonGroup
              :buttons="[
                { icon: $globals.icons.edit, text: $t('general.edit'), event: 'edit' },
                { icon: $globals.icons.delete, text: $t('general.delete'), event: 'delete' },
              ]"
              @delete="deleteRule(rule.id)"
              @edit="toggleEditState(rule.id)"
            />
          </div>

          <!-- View mode -->
          <div v-if="!editState[rule.id]" class="px-4 pb-3 space-y-2">
            <div v-if="rule.categories">
              <h4 class="text-xs font-semibold text-on-surface/60 uppercase tracking-wide py-1">{{ $t("category.categories") }}:</h4>
              <RecipeChips v-if="rule.categories.length" :items="rule.categories" small class="pb-1" />
              <p v-else class="text-xs text-on-surface/50">{{ $t("meal-plan.any-category") }}</p>
            </div>
            <div v-if="rule.tags">
              <h4 class="text-xs font-semibold text-on-surface/60 uppercase tracking-wide py-1">{{ $t("tag.tags") }}:</h4>
              <RecipeChips v-if="rule.tags.length" :items="rule.tags" url-prefix="tags" small class="pb-1" />
              <p v-else class="text-xs text-on-surface/50">{{ $t("meal-plan.any-tag") }}</p>
            </div>
            <div v-if="rule.households">
              <h4 class="text-xs font-semibold text-on-surface/60 uppercase tracking-wide py-1">{{ $t("household.households") }}:</h4>
              <div v-if="rule.households.length" class="flex flex-wrap gap-1">
                <span
                  v-for="household in rule.households"
                  :key="household.id"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                >
                  {{ household.name }}
                </span>
              </div>
              <p v-else class="text-xs text-on-surface/50">{{ $t("meal-plan.any-household") }}</p>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="px-4 pb-3">
            <GroupMealPlanRuleForm
              v-model:day="allRules[idx].day"
              v-model:entry-type="allRules[idx].entryType"
              v-model:query-filter-string="allRules[idx].queryFilterString"
              :query-filter="allRules[idx].queryFilter"
            />
            <div class="flex justify-end mt-3">
              <BaseButton update :disabled="!allRules[idx].queryFilterString" @click="updateRule(rule)" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["lite-mode"] });
import { useUserApi } from "~/composables/api";
import type { PlanRulesCreate, PlanRulesOut } from "~/lib/api/types/meal-plan";
import GroupMealPlanRuleForm from "~/components/Domain/Household/GroupMealPlanRuleForm.vue";
import { useAsyncKey } from "~/composables/use-utils";
import RecipeChips from "~/components/Domain/Recipe/RecipeChips.vue";

const api = useUserApi();
const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("meal-plan.meal-plan-settings"),
});

const editState = ref<{ [key: string]: boolean }>({});
const allRules = ref<PlanRulesOut[]>([]);

function toggleEditState(id: string) {
  editState.value[id] = !editState.value[id];
  editState.value = { ...editState.value };
}

async function refreshAll() {
  const { data } = await api.mealplanRules.getAll();
  if (data) {
    allRules.value = data.items ?? [];
  }
}

useAsyncData(useAsyncKey(), async () => {
  await refreshAll();
});

const createDataFormKey = ref(0);
const createData = ref<PlanRulesCreate>({
  entryType: "unset",
  day: "unset",
  queryFilterString: "",
});

async function createRule() {
  const { data } = await api.mealplanRules.createOne(createData.value);
  if (data) {
    refreshAll();
    createData.value = { entryType: "unset", day: "unset", queryFilterString: "" };
    createDataFormKey.value++;
  }
}

async function deleteRule(ruleId: string) {
  const { data } = await api.mealplanRules.deleteOne(ruleId);
  if (data) { refreshAll(); }
}

async function updateRule(rule: PlanRulesOut) {
  const { data } = await api.mealplanRules.updateOne(rule.id, rule);
  if (data) {
    refreshAll();
    toggleEditState(rule.id);
  }
}
</script>
