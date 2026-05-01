<template>
  <div
    class="rounded-lg border border-border bg-surface shadow-sm overflow-hidden"
    :class="[$attrs.class]"
    @click="handleCardClick"
  >
    <!-- Card header: avatar + date chip + subject (desktop) + context menu -->
    <div class="px-4 py-3 flex items-center gap-3 flex-wrap">
      <!-- Avatar -->
      <UserAvatar
        :user-id="event.userId"
        :size="smAndDown ? '30px' : '42px'"
        class="shrink-0"
      />

      <!-- Date chip -->
      <span
        v-if="event.timestamp"
        class="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-on-surface/70 shrink-0"
      >
        <AppIcon :path="$globals.icons.calendar" size="xs" />
        {{ $d(new Date(event.timestamp)) }}
      </span>

      <!-- Subject (desktop) -->
      <span v-if="!smAndDown" class="flex-1 text-sm font-medium text-on-surface text-center">
        {{ event.subject }}
      </span>

      <!-- Context menu (stop propagation so card click doesn't fire) -->
      <div
        v-if="currentUser && currentUser.id == event.userId && event.eventType != 'system'"
        class="ml-auto shrink-0"
        @click.stop
      >
        <RecipeTimelineContextMenu
          :menu-top="false"
          :event="event"
          :menu-icon="$globals.icons.dotsVertical"
          :use-items="{ edit: true, delete: true }"
          @update="$emit('update', $event)"
          @delete="$emit('delete')"
        />
      </div>
    </div>

    <!-- Recipe card section -->
    <div v-if="showRecipeCards && recipe" class="px-4 py-3 border-t border-border">
      <RecipeCardMobile
        disable-highlight
        :vertical="smAndDown"
        :name="recipe.name"
        :slug="recipe.slug"
        :description="recipe.description"
        :rating="recipe.rating"
        :image="recipe.image"
        :recipe-id="recipe.id"
        :is-flat="true"
      />
    </div>

    <!-- Body: subject (mobile), image, message -->
    <div
      v-if="smAndDown || (eventImageUrl && !hideImage) || event.eventMessage"
      class="px-4 py-3 border-t border-border"
    >
      <!-- Subject (mobile only) -->
      <strong v-if="smAndDown" class="block mb-2 text-sm">{{ event.subject }}</strong>

      <!-- Event image -->
      <img
        v-if="eventImageUrl && !hideImage"
        :src="eventImageUrl"
        class="w-full rounded object-contain mb-3"
        :class="smAndDown ? 'max-h-64' : 'max-h-80'"
        alt=""
        @error="hideImage = true"
      />

      <!-- Event message (markdown) -->
      <div v-if="event.eventMessage" :class="smAndDown ? 'text-xs' : 'text-sm'">
        <SafeMarkdown :source="event.eventMessage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import RecipeCardMobile from "./RecipeCardMobile.vue";
import RecipeTimelineContextMenu from "./RecipeTimelineContextMenu.vue";
import { useStaticRoutes } from "~/composables/api";
import { useTimelineEventTypes } from "~/composables/recipes/use-recipe-timeline-events";
import type { Recipe, RecipeTimelineEventOut, RecipeTimelineEventUpdate } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import SafeMarkdown from "~/components/global/SafeMarkdown.vue";

interface Props {
  event: RecipeTimelineEventOut;
  recipe?: Recipe;
  showRecipeCards?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  recipe: undefined,
  showRecipeCards: false,
});

const emit = defineEmits<{
  selected: [];
  update: [event: RecipeTimelineEventUpdate];
  delete: [];
}>();

const { $globals } = useNuxtApp();
const bp = useBreakpoints(breakpointsTailwind);
const smAndDown = bp.smallerOrEqual("sm");

const { recipeTimelineEventSmallImage } = useStaticRoutes();
const { eventTypeOptions } = useTimelineEventTypes();
const { user: currentUser } = useMealieAuth();

const route = useRoute();
const groupSlug = computed(() => (route.params.groupSlug as string) || currentUser?.value?.groupSlug || "");

const router = useRouter();

function handleCardClick() {
  emit("selected");
  if (props.recipe && groupSlug.value) {
    router.push(`/g/${groupSlug.value}/r/${props.recipe.slug}`);
  }
}

const icon = computed(() => {
  const option = eventTypeOptions.value.find(o => o.value === props.event.eventType);
  return option ? option.icon : $globals.icons.informationVariant;
});

const hideImage = ref(false);
const eventImageUrl = computed<string>(() => {
  if (props.event.image !== "has image") return "";
  return recipeTimelineEventSmallImage(props.event.recipeId, props.event.id);
});
</script>
