<template>
  <div style="height: 100%;">
    <!-- Toolbar: filter button -->
    <div class="flex justify-end items-center mb-3 mt-3 mx-4 gap-2">
      <Menu as="div" class="relative inline-block text-left">
        <MenuButton class="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-info/10 hover:bg-info/20 text-info transition-colors focus:outline-none">
          <AppIcon :path="$globals.icons.filter" size="sm" />
          <!-- Active-filter badge -->
          <span
            v-if="filterBadgeCount > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center"
          >
            {{ filterBadgeCount }}
          </span>
        </MenuButton>

        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <MenuItems class="absolute right-0 z-50 mt-1 w-52 origin-top-right rounded-lg border border-border bg-surface shadow-lg py-1 focus:outline-none">
            <!-- Sort toggle -->
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface transition-colors"
                :class="active ? 'bg-primary/10' : ''"
                @click="reverseSort"
              >
                <AppIcon
                  :path="preferences.orderDirection === 'asc' ? $globals.icons.sortCalendarDescending : $globals.icons.sortCalendarAscending"
                  size="sm"
                />
                {{ preferences.orderDirection === 'asc' ? $t('general.sort-descending') : $t('general.sort-ascending') }}
              </button>
            </MenuItem>

            <hr class="border-border my-1" />

            <!-- Event type filter checkboxes -->
            <MenuItem
              v-for="(option, idx) in eventTypeFilterState"
              :key="idx"
              v-slot="{ active }"
            >
              <label
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface transition-colors cursor-pointer"
                :class="active ? 'bg-primary/10' : ''"
              >
                <input
                  type="checkbox"
                  :checked="option.checked"
                  class="accent-primary"
                  @change="toggleEventTypeOption(option.value)"
                />
                <AppIcon :path="option.icon" size="sm" />
                {{ option.label }}
              </label>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>

    <hr class="border-border mx-2 mb-4" />

    <!-- Timeline list -->
    <div
      v-if="timelineEvents.length"
      id="timeline-container"
      class="relative px-4"
      :style="maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ''"
    >
      <!-- Vertical connecting line -->
      <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-border pointer-events-none" />

      <div class="space-y-5">
        <div
          v-for="(event, index) in timelineEvents"
          :key="event.id"
          class="relative pl-10"
        >
          <!-- Timeline dot with event-type icon -->
          <div class="absolute left-[18px] top-3 w-5 h-5 rounded-full bg-primary border-2 border-surface z-10 flex items-center justify-center">
            <AppIcon :path="getEventIcon(event)" size="xs" class="text-on-primary" />
          </div>

          <RecipeTimelineItem
            :event="event"
            :recipe="recipes.get(event.recipeId)"
            :show-recipe-cards="showRecipeCards"
            @update="updateTimelineEvent(index, $event)"
            @delete="deleteTimelineEvent(index)"
          />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading"
      class="mt-4 rounded-lg border border-border bg-surface px-6 py-10 text-center text-sm text-on-surface/60"
    >
      {{ $t("recipe.timeline-no-events-found-try-adjusting-filters") }}
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="mb-3 text-center mt-4">
      <AppLoader :loading="loading" :waiting-text="$t('general.loading-events')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn, whenever } from "@vueuse/core";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import RecipeTimelineItem from "./RecipeTimelineItem.vue";
import { useTimelinePreferences } from "~/composables/use-users/preferences";
import { useTimelineEventTypes } from "~/composables/recipes/use-recipe-timeline-events";
import { useAsyncKey } from "~/composables/use-utils";
import { alert } from "~/composables/use-toast";
import { useUserApi } from "~/composables/api";
import type { Recipe, RecipeTimelineEventOut, RecipeTimelineEventUpdate, TimelineEventType } from "~/lib/api/types/recipe";

interface Props {
  modelValue?: boolean;
  queryFilter: string;
  maxHeight?: number | string;
  showRecipeCards?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  maxHeight: undefined,
  showRecipeCards: false,
});

const api = useUserApi();
const i18n = useI18n();
const { $globals } = useNuxtApp();
const preferences = useTimelinePreferences();
const { eventTypeOptions } = useTimelineEventTypes();
const loading = ref(true);
const ready = ref(false);

const page = ref(1);
const perPage = 32;
const hasMore = ref(true);

const timelineEvents = ref([] as RecipeTimelineEventOut[]);
const recipes = new Map<string, Recipe>();
const filterBadgeCount = computed(() => eventTypeOptions.value.length - preferences.value.types.length);
const eventTypeFilterState = computed(() => {
  return eventTypeOptions.value.map((option) => ({
    ...option,
    checked: preferences.value.types.includes(option.value),
  }));
});
const screenBuffer = 4;

function getEventIcon(event: RecipeTimelineEventOut): string {
  const option = eventTypeOptions.value.find(o => o.value === event.eventType);
  return option ? option.icon : $globals.icons.informationVariant;
}

whenever(
  () => props.modelValue,
  () => { initializeTimelineEvents(); },
);

function reverseSort() {
  if (loading.value) return;
  preferences.value.orderDirection = preferences.value.orderDirection === "asc" ? "desc" : "asc";
  initializeTimelineEvents();
}

function toggleEventTypeOption(option: TimelineEventType) {
  if (loading.value) return;
  const index = preferences.value.types.indexOf(option);
  if (index === -1) preferences.value.types.push(option);
  else preferences.value.types.splice(index, 1);
  initializeTimelineEvents();
}

async function updateTimelineEvent(index: number, event: RecipeTimelineEventUpdate) {
  const eventId = timelineEvents.value[index].id;
  const { response } = await api.recipes.updateTimelineEvent(eventId, event);
  if (response?.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong") as string);
    return;
  }
  timelineEvents.value[index] = response.data;
  alert.success(i18n.t("events.event-updated") as string);
}

async function deleteTimelineEvent(index: number) {
  const { response } = await api.recipes.deleteTimelineEvent(timelineEvents.value[index].id);
  if (response?.status !== 200) {
    alert.error(i18n.t("events.something-went-wrong") as string);
    return;
  }
  timelineEvents.value.splice(index, 1);
  alert.success(i18n.t("events.event-deleted") as string);
}

async function getRecipes(recipeIds: string[]): Promise<Recipe[]> {
  const qf = "id IN [" + recipeIds.map(id => `"${id}"`).join(", ") + "]";
  const { data } = await api.recipes.getAll(1, -1, { queryFilter: qf });
  return data?.items || [];
}

async function updateRecipes(events: RecipeTimelineEventOut[]) {
  const recipeIds: string[] = [];
  events.forEach((event) => {
    if (recipeIds.includes(event.recipeId) || recipes.has(event.recipeId)) return;
    recipeIds.push(event.recipeId);
  });
  const results = await getRecipes(recipeIds);
  results.forEach((result) => {
    if (!result?.id) return;
    recipes.set(result.id, result);
  });
}

async function scrollTimelineEvents() {
  const orderBy = "timestamp";
  const orderDirection = preferences.value.orderDirection === "asc" ? "asc" : "desc";
  const eventTypeValue = `["${preferences.value.types.join("\", \"")}"]`;
  const queryFilter = `(${props.queryFilter}) AND eventType IN ${eventTypeValue}`;

  const response = await api.recipes.getAllTimelineEvents(page.value, perPage, { orderBy, orderDirection, queryFilter });
  page.value += 1;
  if (!response?.data) return;

  const events = response.data.items;
  if (events.length < perPage) {
    hasMore.value = false;
    if (!events.length) return;
  }

  if (props.showRecipeCards) await updateRecipes(events);
  timelineEvents.value.push(...events);
}

async function initializeTimelineEvents() {
  loading.value = true;
  ready.value = false;
  page.value = 1;
  hasMore.value = true;
  timelineEvents.value = [];
  await scrollTimelineEvents();
  ready.value = true;
  loading.value = false;
}

const infiniteScroll = useThrottleFn(() => {
  useAsyncData(useAsyncKey(), async () => {
    if (!hasMore.value || loading.value) return;
    loading.value = true;
    await scrollTimelineEvents();
    loading.value = false;
  });
}, 500);

initializeTimelineEvents();

onMounted(() => {
  document.onscroll = () => {
    const timelineContainerElement = document.getElementById("timeline-container");
    if (timelineContainerElement) {
      const { clientHeight, scrollHeight } = timelineContainerElement;
      if (scrollHeight > clientHeight) return;
    }
    const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight - (window.innerHeight * screenBuffer);
    if (bottomOfWindow) infiniteScroll();
  };
});
</script>
