<template>
  <div class="mx-0 my-3">
    <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div
        v-for="(day, index) in plan"
        :key="index"
        class="flex flex-col"
      >
        <!-- Day header card -->
        <div class="mb-2 border-l-4 border-l-primary rounded-lg border border-border bg-surface px-3 py-2 flex items-center justify-between">
          <p class="text-sm font-medium my-1" :class="{ 'text-primary': isToday(day.date) }">
            {{ $d(day.date, "short") }}
          </p>
          <GroupMealPlanDayContextMenu v-if="day.recipes.length" :recipes="day.recipes" />
        </div>

        <!-- Meal sections -->
        <div v-for="section in day.sections" :key="section.title">
          <div class="py-2 flex flex-col">
            <div class="bg-primary h-0.5 w-12" />
            <p class="text-xs uppercase tracking-wide font-medium text-on-surface/60 mt-0.5">
              {{ section.title }}
            </p>
          </div>
          <RecipeCardMobile
            v-for="mealplan in section.meals"
            :key="mealplan.id"
            :recipe-id="mealplan.recipe ? mealplan.recipe.id! : ''"
            class="mb-2"
            :rating="mealplan.recipe ? mealplan.recipe.rating! : 0"
            :slug="mealplan.recipe ? mealplan.recipe.slug! : mealplan.title!"
            :description="mealplan.recipe ? mealplan.recipe.description! : mealplan.text!"
            :name="mealplan.recipe ? mealplan.recipe.name! : mealplan.title!"
            :tags="mealplan.recipe ? mealplan.recipe.tags! : []"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isSameDay } from "date-fns";
import type { ReadPlanEntry } from "~/lib/api/types/meal-plan";
import GroupMealPlanDayContextMenu from "~/components/Domain/Household/GroupMealPlanDayContextMenu.vue";
import RecipeCardMobile from "~/components/Domain/Recipe/RecipeCardMobile.vue";
import type { RecipeSummary } from "~/lib/api/types/recipe";

export type MealsByDate = {
  date: Date;
  meals: ReadPlanEntry[];
};

const props = defineProps<{
  mealplans: MealsByDate[];
}>();

type DaySection = { title: string; meals: ReadPlanEntry[] };
type Days = { date: Date; sections: DaySection[]; recipes: RecipeSummary[] };

const i18n = useI18n();

const plan = computed<Days[]>(() => {
  return props.mealplans.reduce((acc, day) => {
    const out: Days = {
      date: day.date,
      sections: [
        { title: i18n.t("meal-plan.breakfast"), meals: [] },
        { title: i18n.t("meal-plan.lunch"), meals: [] },
        { title: i18n.t("meal-plan.dinner"), meals: [] },
        { title: i18n.t("meal-plan.side"), meals: [] },
        { title: i18n.t("meal-plan.snack"), meals: [] },
        { title: i18n.t("meal-plan.drink"), meals: [] },
        { title: i18n.t("meal-plan.dessert"), meals: [] },
      ],
      recipes: [],
    };

    for (const meal of day.meals) {
      if (meal.entryType === "breakfast") out.sections[0].meals.push(meal);
      else if (meal.entryType === "lunch") out.sections[1].meals.push(meal);
      else if (meal.entryType === "dinner") out.sections[2].meals.push(meal);
      else if (meal.entryType === "side") out.sections[3].meals.push(meal);
      else if (meal.entryType === "snack") out.sections[4].meals.push(meal);
      else if (meal.entryType === "drink") out.sections[5].meals.push(meal);
      else if (meal.entryType === "dessert") out.sections[6].meals.push(meal);

      if (meal.recipe) out.recipes.push(meal.recipe);
    }

    out.sections = out.sections.filter(section => section.meals.length > 0);
    acc.push(out);
    return acc;
  }, [] as Days[]);
});

const isToday = (date: Date) => isSameDay(date, new Date());
</script>
