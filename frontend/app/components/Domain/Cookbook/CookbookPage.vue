<template>
  <div>
    <!-- Edit Dialog -->
    <BaseDialog
      v-if="editTarget"
      v-model="dialogStates.edit"
      width="100%"
      max-width="1100px"
      :icon="$globals.icons.pages"
      :title="$t('general.edit')"
      :submit-icon="$globals.icons.save"
      :submit-text="$t('general.save')"
      :submit-disabled="!editTarget.queryFilterString"
      can-submit
      @submit="editCookbook"
    >
      <div class="px-4 py-3">
        <CookbookEditor v-model="editTarget" />
      </div>
    </BaseDialog>

    <div v-if="book" class="my-0 px-4">
      <div class="flex flex-col w-full">
        <!-- Title row -->
        <div class="flex items-center w-full mb-2">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <AppIcon :path="$globals.icons.pages" size="lg" class="text-on-surface shrink-0" />
            <h1 class="text-xl font-semibold text-on-surface truncate">{{ book.name }}</h1>
          </div>
          <BaseButton
            v-if="canEdit"
            class="ml-2 shrink-0"
            :edit="true"
            @click="handleEditCookbook"
          />
        </div>

        <!-- Description -->
        <p v-if="book.description" class="text-sm text-on-surface/60 mb-4">
          {{ book.description }}
        </p>
      </div>

      <!-- Recipe cards -->
      <RecipeCardSection
        class="mb-5"
        :recipes="recipes"
        :query="{ cookbook: slug }"
        @sort-recipes="assignSorted"
        @replace-recipes="replaceRecipes"
        @append-recipes="appendRecipes"
        @delete="removeRecipe"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLazyRecipes } from "~/composables/recipes";
import RecipeCardSection from "@/components/Domain/Recipe/RecipeCardSection.vue";
import { useCookbookStore } from "~/composables/store/use-cookbook-store";
import { useCookbook } from "~/composables/use-group-cookbooks";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import type { ReadCookBook } from "~/lib/api/types/cookbook";
import CookbookEditor from "~/components/Domain/Cookbook/CookbookEditor.vue";

const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const { isOwnGroup } = useLoggedInState();

const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const { recipes, appendRecipes, assignSorted, removeRecipe, replaceRecipes } = useLazyRecipes(isOwnGroup.value ? null : groupSlug.value);
const slug = route.params.slug as string;
const { getOne } = useCookbook(isOwnGroup.value ? null : groupSlug.value);
const { actions } = useCookbookStore();
const router = useRouter();

const book = getOne(slug);

const isOwnHousehold = computed(() => {
  if (!(auth.user.value && book.value?.householdId)) {
    return false;
  }

  return auth.user.value.householdId === book.value.householdId;
});
const canEdit = computed(() => isOwnGroup.value && isOwnHousehold.value);

const dialogStates = reactive({
  edit: false,
});

const editTarget = ref<ReadCookBook | null>(null);
function handleEditCookbook() {
  dialogStates.edit = true;
  editTarget.value = book.value;
}

async function editCookbook() {
  if (!editTarget.value) {
    return;
  }
  const response = await actions.updateOne(editTarget.value);

  if (response?.slug && book.value?.slug !== response?.slug) {
    // if name changed, redirect to new slug
    router.push(`/g/${route.params.groupSlug}/cookbooks/${response?.slug}`);
  }
  else {
    // otherwise reload the page, since the recipe criteria changed
    router.go(0);
  }
  dialogStates.edit = false;
  editTarget.value = null;
}

useSeoMeta({
  title: book?.value?.name || "Cookbook",
});
</script>
