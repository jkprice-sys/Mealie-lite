<template>
  <div>
    <slot v-bind="{ open, close }" />

    <Teleport to="body">
      <TransitionRoot :show="dialog" as="template">
        <Dialog as="div" class="relative z-[2020]" @close="close">

          <!-- Backdrop -->
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          </TransitionChild>

          <!-- Dialog panel — positioned near the top like a command palette -->
          <div class="fixed inset-0 flex items-start justify-center pt-16 px-4">
            <TransitionChild
              as="template"
              enter="duration-200 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-150 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-[988px] rounded-xl shadow-2xl overflow-hidden bg-surface">

                <!-- Search bar header -->
                <div class="flex items-center gap-2 px-4 py-3 bg-primary/90">
                  <AppIcon :path="$globals.icons.search" size="md" class="text-white/70 shrink-0" />
                  <input
                    id="arrow-search"
                    v-model="search.query.value"
                    type="text"
                    autofocus
                    autocomplete="off"
                    :placeholder="$t('search.search')"
                    class="flex-1 bg-transparent text-white placeholder-white/60 text-base
                           border-none outline-none focus:outline-none"
                  />
                  <!-- Loading indicator -->
                  <div v-if="loading" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                  <!-- Close button (always shown for clarity) -->
                  <button
                    type="button"
                    class="bs-btn p-1 rounded-full text-white/70 hover:bg-white/20 transition-colors shrink-0"
                    @click="close"
                  >
                    <AppIcon :path="$globals.icons.close" size="sm" />
                  </button>
                </div>

                <!-- Results count -->
                <div class="px-4 py-2 border-b border-border text-xs text-on-surface/50">
                  {{ $t("search.results") }}
                </div>

                <!-- Results list -->
                <div class="overflow-y-auto p-2" style="max-height: 60vh;">
                  <RecipeCardMobile
                    v-for="(recipe, index) in search.data.value"
                    :key="index"
                    :tabindex="index"
                    class="mb-1 arrow-nav"
                    :name="recipe.name ?? ''"
                    :description="recipe.description ?? ''"
                    :slug="recipe.slug ?? ''"
                    :rating="recipe.rating ?? 0"
                    :image="recipe.image"
                    :recipe-id="recipe.id ?? ''"
                    v-bind="$attrs.selected ? { selected: () => handleSelect(recipe) } : {}"
                  />

                  <!-- Empty state -->
                  <div
                    v-if="search.data.value.length === 0 && search.query.value"
                    class="py-8 text-center text-sm text-on-surface/50"
                  >
                    {{ $t("search.no-results") }}
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>

        </Dialog>
      </TransitionRoot>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import RecipeCardMobile from "./RecipeCardMobile.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type { RecipeSummary } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";
import { useRecipeSearch } from "~/composables/recipes/use-recipe-search";
import { usePublicExploreApi } from "~/composables/api/api-client";

const SELECTED_EVENT = "selected";

const emit = defineEmits<{
  selected: [recipe: RecipeSummary];
}>();

const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const loading = ref(false);
const selectedIndex = ref(-1);

// ── Dialog state ─────────────────────────────────────────────────────────────
const dialog = ref(false);

watch(dialog, (val) => {
  if (!val) {
    search.query.value = "";
    selectedIndex.value = -1;
    search.data.value = [];
  }
});

// ── Keyboard arrow navigation ─────────────────────────────────────────────────
function selectRecipe() {
  const recipeCards = document.getElementsByClassName("arrow-nav");
  if (!recipeCards) return;

  if (selectedIndex.value < 0) {
    selectedIndex.value = -1;
    document.getElementById("arrow-search")?.focus();
    return;
  }
  if (selectedIndex.value >= recipeCards.length) {
    selectedIndex.value = recipeCards.length - 1;
  }
  (recipeCards[selectedIndex.value] as HTMLElement).focus();
}

function onUpDown(e: KeyboardEvent) {
  if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value--;
  }
  else if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value++;
  }
  else {
    return;
  }
  selectRecipe();
}

watch(dialog, (val) => {
  if (!val) document.removeEventListener("keyup", onUpDown);
  else      document.addEventListener("keyup", onUpDown);
});

// Close on route change
const route = useRoute();
watch(route, close);

function open()  { dialog.value = true; }
function close() { dialog.value = false; }

// ── Search ────────────────────────────────────────────────────────────────────
const { isOwnGroup } = useLoggedInState();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");
const api = isOwnGroup.value ? useUserApi() : usePublicExploreApi(groupSlug.value).explore;
const search = useRecipeSearch(api);

function handleSelect(recipe: RecipeSummary) {
  close();
  emit(SELECTED_EVENT, recipe);
}

defineExpose({ open, close });
</script>
