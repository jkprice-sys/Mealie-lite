<template>
  <ul
    class="space-y-1"
    :class="tile ? 'flex flex-wrap gap-1' : ''"
    style="background-color: transparent;"
  >
    <li
      v-for="(recipe, index) in recipes"
      :key="recipe.id"
      class="rounded-lg shadow-sm border border-border bg-surface"
      :class="tile ? 'w-fit' : 'w-full'"
    >
      <component
        :is="disabled ? 'div' : 'NuxtLink'"
        :to="disabled ? undefined : '/g/' + groupSlug + '/r/' + recipe.slug"
        class="flex items-center gap-3 px-3 py-2 no-underline text-on-surface hover:bg-primary/5 rounded-lg transition-colors"
      >
        <!-- Avatar icon -->
        <div
          class="shrink-0 rounded-full bg-primary flex items-center justify-center"
          :class="small ? 'w-7 h-7' : 'w-9 h-9'"
        >
          <AppIcon
            :path="$globals.icons.primary"
            size="sm"
            class="text-white"
          />
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <p
            class="font-medium text-on-surface truncate"
            :class="small ? 'text-xs' : 'text-sm'"
            :style="listItem && listItemDescriptions[index] ? '' : 'padding-right: 1rem'"
          >
            {{ recipe.name }}
          </p>
          <p v-if="showDescription && recipe.description" class="text-xs text-on-surface/60 truncate mt-0.5">
            {{ recipe.description }}
          </p>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p
            v-if="listItem && listItemDescriptions[index]"
            class="text-on-surface/60 mt-0.5"
            :class="small ? 'text-[10px]' : 'text-xs'"
            v-html="listItemDescriptions[index]"
          />
        </div>

        <!-- Actions slot -->
        <div class="flex items-center gap-1 shrink-0">
          <slot :name="'actions-' + recipe.id" :v-bind="{ item: recipe }" />
        </div>
      </component>
    </li>
  </ul>
</template>

<script setup lang="ts">
import DOMPurify from "dompurify";
import { useFraction } from "~/composables/recipes/use-fraction";
import type { ShoppingListItemOut } from "~/lib/api/types/household";
import type { RecipeSummary } from "~/lib/api/types/recipe";

interface Props {
  recipes: RecipeSummary[];
  listItem?: ShoppingListItemOut;
  small?: boolean;
  tile?: boolean;
  showDescription?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  listItem: undefined,
  small: false,
  tile: false,
  showDescription: false,
  disabled: false,
});

const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const { frac } = useFraction();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || auth.user?.value?.groupSlug || "");

function sanitizeHTML(rawHtml: string) {
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ["strong", "sup", "sub"],
  });
}

const listItemDescriptions = computed<string[]>(() => {
  if (
    props.recipes.length === 1
    || !props.listItem?.recipeReferences
    || props.listItem.recipeReferences.length !== props.recipes.length
  ) {
    return props.recipes.map(_ => "");
  }

  const descriptions: string[] = [];
  for (let i = 0; i < props.recipes.length; i++) {
    const itemRef = props.listItem.recipeReferences[i];
    const quantity = (itemRef.recipeQuantity || 1) * (itemRef.recipeScale || 1);

    let desc = "";
    if (props.listItem.unit?.fraction) {
      const fraction = frac(quantity, 10, true);
      if (fraction[0] !== undefined && fraction[0] > 0) desc += fraction[0];
      if (fraction[1] > 0) desc += ` <sup>${fraction[1]}</sup>&frasl;<sub>${fraction[2]}</sub>`;
      else desc = quantity.toString();
    }
    else {
      desc = (Math.round(quantity * 100) / 100).toString();
    }

    if (props.listItem.unit) {
      const unitDisplay = props.listItem.unit.useAbbreviation && props.listItem.unit.abbreviation
        ? props.listItem.unit.abbreviation
        : props.listItem.unit.name;
      desc += ` ${unitDisplay}`;
    }

    if (itemRef.recipeNote) desc += `, ${itemRef.recipeNote}`;

    descriptions.push(sanitizeHTML(desc));
  }

  return descriptions;
});
</script>
