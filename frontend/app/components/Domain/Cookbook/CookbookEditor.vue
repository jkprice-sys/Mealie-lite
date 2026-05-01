<template>
  <div v-if="cookbook" class="space-y-3">
    <!-- Name -->
    <div>
      <label class="block text-xs text-on-surface/60 mb-1">{{ $t('cookbook.cookbook-name') }}</label>
      <input
        v-model="cookbook.name"
        type="text"
        class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
               focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      />
    </div>

    <!-- Description -->
    <div>
      <label class="block text-xs text-on-surface/60 mb-1">{{ $t('recipe.description') }}</label>
      <textarea
        v-model="cookbook.description"
        rows="2"
        class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
               focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-y"
      />
    </div>

    <!-- Query filter builder -->
    <QueryFilterBuilder
      :field-defs="fieldDefs"
      :initial-query-filter="cookbook.queryFilter"
      @input="handleInput"
    />

    <!-- Public toggle -->
    <label class="flex items-center gap-3 cursor-pointer pt-1">
      <button
        type="button"
        role="switch"
        :aria-checked="cookbook.public"
        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0"
        :class="cookbook.public ? 'bg-primary' : 'bg-on-surface/20'"
        @click="cookbook.public = !cookbook.public"
      >
        <span
          class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
          :class="cookbook.public ? 'translate-x-4' : 'translate-x-0.5'"
        />
      </button>
      <span class="text-sm text-on-surface">{{ $t('cookbook.public-cookbook') }}</span>
      <HelpIcon size="small" class="ml-1">
        {{ $t('cookbook.public-cookbook-description') }}
      </HelpIcon>
    </label>
  </div>
</template>

<script setup lang="ts">
import { Organizer } from "~/lib/api/types/non-generated";
import QueryFilterBuilder from "~/components/Domain/QueryFilterBuilder.vue";
import type { FieldDefinition } from "~/composables/use-query-filter-builder";
import type { ReadCookBook } from "~/lib/api/types/cookbook";

const modelValue = defineModel<ReadCookBook>({ required: true });
const i18n = useI18n();
const cookbook = toRef(modelValue);
function handleInput(value: string | undefined) {
  cookbook.value.queryFilterString = value || "";
}

const fieldDefs: FieldDefinition[] = [
  {
    name: "recipe_category.id",
    label: i18n.t("category.categories"),
    type: Organizer.Category,
  },
  {
    name: "tags.id",
    label: i18n.t("tag.tags"),
    type: Organizer.Tag,
  },
  {
    name: "recipe_ingredient.food.id",
    label: i18n.t("recipe.ingredients"),
    type: Organizer.Food,
  },
  {
    name: "tools.id",
    label: i18n.t("tool.tools"),
    type: Organizer.Tool,
  },
  {
    name: "household_id",
    label: i18n.t("household.households"),
    type: Organizer.Household,
  },
  {
    name: "user_id",
    label: i18n.t("user.users"),
    type: Organizer.User,
  },
  {
    name: "created_at",
    label: i18n.t("general.date-created"),
    type: "date",
  },
  {
    name: "updated_at",
    label: i18n.t("general.date-updated"),
    type: "date",
  },
];
</script>
