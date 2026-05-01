<template>
  <div>
    <!-- ── "Made This" dialog ────────────────────────────────────────────── -->
    <BaseDialog
      v-model="madeThisDialog"
      :loading="madeThisFormLoading"
      :icon="$globals.icons.chefHat"
      :title="$t('recipe.made-this')"
      :submit-text="$t('recipe.add-to-timeline')"
      can-submit
      disable-submit-on-enter
      @submit="createTimelineEvent"
    >
      <div class="space-y-4">
        <!-- Comment textarea -->
        <div>
          <textarea
            v-model="newTimelineEvent.eventMessage"
            autofocus
            rows="4"
            :placeholder="$t('recipe.comment')"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                   text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                   focus:ring-primary focus:border-primary transition-colors resize-y"
          />
          <p class="text-xs text-on-surface/50 mt-1">{{ $t('recipe.how-did-it-turn-out') }}</p>
        </div>

        <!-- Linked recipe checkboxes -->
        <div v-if="childRecipes?.length">
          <p class="text-sm text-on-surface/70 mb-2">{{ $t('recipe.include-linked-recipes') }}</p>
          <div class="space-y-1">
            <label
              v-for="(childRecipe, i) in childRecipes"
              :key="childRecipe.recipeId + i"
              class="flex items-center gap-2 cursor-pointer text-sm text-on-surface"
            >
              <input
                v-model="childRecipe.checked"
                type="checkbox"
                class="w-4 h-4 rounded border-border accent-primary"
              />
              {{ childRecipe.name }}
            </label>
          </div>
        </div>

        <!-- Date + image upload row -->
        <div class="flex flex-wrap items-center gap-4">
          <!-- Native date input -->
          <div class="flex items-center gap-2">
            <AppIcon :path="$globals.icons.calendar" size="sm" class="text-on-surface/50 shrink-0" />
            <input
              v-model="dateInputValue"
              type="date"
              class="border-b border-border bg-transparent text-sm text-on-surface
                     focus:outline-none focus:border-primary transition-colors py-1"
            />
          </div>

          <!-- Image upload / remove -->
          <div class="ml-auto">
            <AppButtonUpload
              v-if="!newTimelineEventImage"
              url="none"
              file-name="image"
              accept="image/*"
              :post="false"
              @uploaded="uploadImage"
            >
              <template #default="{ isSelecting, onButtonClick }">
                <button
                  type="button"
                  class="bs-btn bs-btn-sm bs-btn-outline"
                  :disabled="isSelecting"
                  @click="onButtonClick"
                >
                  <AppIcon :path="$globals.icons.fileImage" size="sm" />
                  {{ $t('recipe.upload-image') }}
                </button>
              </template>
            </AppButtonUpload>
            <button
              v-if="newTimelineEventImage"
              type="button"
              class="bs-btn bs-btn-sm bs-btn-error"
              @click="clearImage"
            >
              <AppIcon :path="$globals.icons.close" size="sm" />
              {{ $t("recipe.remove-image") }}
            </button>
          </div>
        </div>

        <!-- Image cropper -->
        <div v-if="newTimelineEventImage && newTimelineEventImagePreviewUrl">
          <ImageCropper
            :img="newTimelineEventImagePreviewUrl"
            cropper-height="20vh"
            cropper-width="100%"
            @save="updateUploadedImage"
          />
        </div>
      </div>
    </BaseDialog>

    <!-- ── "Last Made" trigger button ───────────────────────────────────── -->
    <div v-if="lastMadeReady" class="flex justify-center">
      <button
        type="button"
        :title="$t('recipe.made-this')"
        class="flex items-center gap-3 rounded-lg border border-primary px-4 py-2.5
               hover:bg-primary/5 transition-colors"
        @click="madeThisDialog = true"
      >
        <AppIcon :path="$globals.icons.calendar" size="lg" class="text-primary" />
        <span class="text-sm opacity-80 text-left">
          <strong>{{ $t("general.last-made") }}</strong><br>
          {{ lastMade ? $d(new Date(lastMade)) : $t("general.never") }}
        </span>
        <AppIcon :path="$globals.icons.createAlt" size="lg" class="text-primary" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { whenever } from "@vueuse/core";
import { formatISO, parseISO } from "date-fns";
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import { useHouseholdSelf } from "~/composables/use-households";
import type { Recipe, RecipeTimelineEventIn, RecipeTimelineEventOut } from "~/lib/api/types/recipe";

const { $globals } = useNuxtApp();

const props = defineProps<{ recipe: Recipe }>();
const emit = defineEmits<{
  eventCreated: [event: RecipeTimelineEventOut];
}>();

const madeThisDialog = ref(false);
const userApi = useUserApi();
const { household } = useHouseholdSelf();
const i18n = useI18n();
const auth = useMealieAuth();

const newTimelineEvent = ref<RecipeTimelineEventIn>({
  subject: "",
  eventType: "comment",
  eventMessage: "",
  timestamp: undefined,
  recipeId: props.recipe?.id || "",
});

const newTimelineEventImage       = ref<Blob | File>();
const newTimelineEventImageName   = ref<string>("");
const newTimelineEventImagePreviewUrl = ref<string>();

// ── Date: keep as YYYY-MM-DD string for native input ─────────────────────────
const dateInputValue = ref(formatISO(new Date(), { representation: "date" }));

const lastMade      = ref(props.recipe.lastMade);
const lastMadeReady = ref(false);

onMounted(async () => {
  if (!auth.user?.value?.householdSlug) {
    lastMade.value = props.recipe.lastMade;
  }
  else {
    const { data } = await userApi.households.getCurrentUserHouseholdRecipe(props.recipe.slug || "");
    lastMade.value = data?.lastMade;
  }
  lastMadeReady.value = true;
});

const childRecipes = computed(() =>
  props.recipe.recipeIngredient
    ?.map((ingredient) => {
      if (ingredient.referencedRecipe) {
        return { checked: false, recipeId: ingredient.referencedRecipe.id || "", ...ingredient.referencedRecipe };
      }
      return undefined;
    })
    .filter(r => r !== undefined),
);

// Reset timestamp to today each time dialog opens
whenever(() => madeThisDialog.value, () => {
  dateInputValue.value = formatISO(new Date(), { representation: "date" });
});

const firstDayOfWeek = computed(() => household.value?.preferences?.firstDayOfWeek || 0);

function clearImage() {
  newTimelineEventImage.value       = undefined;
  newTimelineEventImageName.value   = "";
  newTimelineEventImagePreviewUrl.value = undefined;
}

function uploadImage(fileObject: File) {
  newTimelineEventImage.value           = fileObject;
  newTimelineEventImageName.value       = fileObject.name;
  newTimelineEventImagePreviewUrl.value = URL.createObjectURL(fileObject);
}

function updateUploadedImage(fileObject: Blob) {
  newTimelineEventImage.value           = fileObject;
  newTimelineEventImagePreviewUrl.value = URL.createObjectURL(fileObject);
}

const madeThisFormLoading = ref(false);

function resetMadeThisForm() {
  madeThisFormLoading.value                 = false;
  newTimelineEvent.value.eventMessage       = "";
  newTimelineEvent.value.timestamp          = undefined;
  clearImage();
  madeThisDialog.value = false;
}

async function createTimelineEvent() {
  if (!(dateInputValue.value && props.recipe?.id && props.recipe?.slug)) return;

  madeThisFormLoading.value       = true;
  newTimelineEvent.value.recipeId = props.recipe.id;
  newTimelineEvent.value.subject  = i18n.t("recipe.user-made-this", { user: auth.user.value?.fullName });
  // End of selected day in local time
  newTimelineEvent.value.timestamp = new Date(dateInputValue.value + "T23:59:59").toISOString();

  let newEvent: RecipeTimelineEventOut | null = null;
  try {
    const resp = await userApi.recipes.createTimelineEvent(newTimelineEvent.value);
    newEvent = resp.data;
    if (!newEvent) throw new Error("No event created");
  }
  catch (error) {
    console.error("Failed to create timeline event:", error);
    alert.error(i18n.t("recipe.failed-to-add-to-timeline"));
    resetMadeThisForm();
    return;
  }

  if (!lastMade.value || newTimelineEvent.value.timestamp > lastMade.value) {
    try {
      lastMade.value = newTimelineEvent.value.timestamp;
      await userApi.recipes.updateLastMade(props.recipe.slug, newTimelineEvent.value.timestamp);
    }
    catch (error) {
      console.error("Failed to update last made date:", error);
      alert.error(i18n.t("recipe.failed-to-update-recipe"));
    }
  }

  for (const childRecipe of childRecipes.value || []) {
    if (!childRecipe.checked) continue;
    try {
      await userApi.recipes.createTimelineEvent({
        ...newTimelineEvent.value,
        recipeId: childRecipe.recipeId,
        eventMessage: i18n.t("recipe.made-for-recipe", { recipe: childRecipe.name }),
        image: undefined,
      });
    }
    catch (error) {
      console.error(`Failed to create timeline event for child recipe ${childRecipe.slug}:`, error);
    }
    if (newTimelineEvent.value.timestamp && (!childRecipe.lastMade || newTimelineEvent.value.timestamp > childRecipe.lastMade)) {
      try {
        await userApi.recipes.updateLastMade(childRecipe.slug || "", newTimelineEvent.value.timestamp);
      }
      catch (error) {
        console.error(`Failed to update last made for child recipe ${childRecipe.slug}:`, error);
      }
    }
  }

  let imageError = false;
  if (newTimelineEventImage.value) {
    try {
      const imageResp = await userApi.recipes.updateTimelineEventImage(
        newEvent.id,
        newTimelineEventImage.value,
        newTimelineEventImageName.value,
      );
      if (imageResp.data) newEvent.image = imageResp.data.image;
    }
    catch (error) {
      imageError = true;
      console.error("Failed to upload image for timeline event:", error);
    }
  }

  if (imageError) alert.error(i18n.t("recipe.added-to-timeline-but-failed-to-add-image"));
  else            alert.success(i18n.t("recipe.added-to-timeline"));

  resetMadeThisForm();
  emit("eventCreated", newEvent);
}
</script>
