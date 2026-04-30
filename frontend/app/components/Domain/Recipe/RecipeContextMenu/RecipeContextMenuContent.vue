<template>
  <!-- Dialogs teleport to body via BaseDialog — safe to include here -->
  <RecipeDialogShare v-model="shareDialog" :recipe-id="recipeId" :name="name" />
  <RecipeDialogPrintPreferences v-model="printPreferencesDialog" :recipe="recipeRef" />

  <!-- Delete confirmation -->
  <BaseDialog
    v-model="recipeDeleteDialog"
    :title="$t('recipe.delete-recipe')"
    color="error"
    :icon="$globals.icons.alertCircle"
    can-confirm
    @confirm="deleteRecipe()"
  >
    <div class="px-4 py-3 text-on-surface">
      <template v-if="isAdminAndNotOwner">
        {{ $t("recipe.admin-delete-confirmation") }}
      </template>
      <template v-else>
        {{ $t("recipe.delete-confirmation") }}
      </template>
    </div>
  </BaseDialog>

  <!-- Duplicate -->
  <BaseDialog
    v-model="recipeDuplicateDialog"
    :title="$t('recipe.duplicate')"
    color="primary"
    :icon="$globals.icons.duplicate"
    can-confirm
    @confirm="duplicateRecipe()"
  >
    <div class="px-4 py-3">
      <label class="block text-sm font-medium text-on-surface/70 mb-1">
        {{ $t('recipe.recipe-name') }}
      </label>
      <input
        v-model="recipeName"
        type="text"
        autofocus
        class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
               text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
               focus:border-primary transition-colors"
      />
    </div>
  </BaseDialog>

  <!-- Add to meal plan -->
  <BaseDialog
    v-model="mealplannerDialog"
    :title="$t('recipe.add-recipe-to-mealplan')"
    color="primary"
    :icon="$globals.icons.calendar"
    can-confirm
    @confirm="addRecipeToPlan()"
  >
    <div class="px-4 py-3 flex flex-col gap-3">
      <div>
        <label class="block text-sm font-medium text-on-surface/70 mb-1">
          {{ $t('general.date') }}
        </label>
        <input
          v-model="newMealdateString"
          type="date"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                 focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-on-surface/70 mb-1">
          {{ $t('recipe.entry-type') }}
        </label>
        <select
          v-model="newMealType"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                 focus:border-primary transition-colors"
        >
          <option v-for="opt in planTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.text }}
          </option>
        </select>
      </div>
    </div>
  </BaseDialog>

  <!-- Add to shopping list -->
  <RecipeDialogAddToShoppingList
    v-if="shoppingLists && recipeRefWithScale"
    v-model="shoppingListDialog"
    :recipes="[recipeRefWithScale]"
    :shopping-lists="shoppingLists"
  />

  <!-- Menu items list -->
  <div class="py-1">
    <button
      v-for="(item, index) in menuItems"
      :key="index"
      type="button"
      class="flex items-center gap-3 w-full px-3 py-2 text-sm text-on-surface
             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      @click="contextMenuEventHandler(item.event)"
    >
      <AppIcon
        :path="item.icon"
        size="sm"
        :class="item.color ? `text-${item.color}` : 'text-on-surface/60'"
      />
      {{ item.title }}
    </button>

    <!-- Recipe actions (custom group actions) -->
    <template v-if="useItems.recipeActions && recipeActions && recipeActions.length">
      <hr class="my-1 border-t border-border" />
      <button
        v-for="(action, index) in recipeActions"
        :key="index"
        type="button"
        class="flex items-center gap-3 w-full px-3 py-2 text-sm text-on-surface
               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
        @click="executeRecipeAction(action)"
      >
        <AppIcon :path="$globals.icons.linkVariantPlus" size="sm" class="text-on-surface/60" />
        {{ action.title }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import RecipeDialogAddToShoppingList from "~/components/Domain/Recipe/RecipeDialogAddToShoppingList.vue";
import RecipeDialogPrintPreferences from "~/components/Domain/Recipe/RecipeDialogPrintPreferences.vue";
import RecipeDialogShare from "~/components/Domain/Recipe/RecipeDialogShare.vue";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { useUserApi } from "~/composables/api";
import { useLiteMode } from "~/composables/use-lite-mode";
import { useGroupRecipeActions } from "~/composables/use-group-recipe-actions";
import { useHouseholdSelf } from "~/composables/use-households";
import { alert } from "~/composables/use-toast";
import { usePlanTypeOptions } from "~/composables/use-group-mealplan";
import type { Recipe } from "~/lib/api/types/recipe";
import type { GroupRecipeActionOut, ShoppingListSummary } from "~/lib/api/types/household";
import type { PlanEntryType } from "~/lib/api/types/meal-plan";
import { useDownloader } from "~/composables/api/use-downloader";

export interface ContextMenuIncludes {
  delete: boolean;
  edit: boolean;
  download: boolean;
  duplicate: boolean;
  mealplanner: boolean;
  shoppingList: boolean;
  print: boolean;
  printPreferences: boolean;
  share: boolean;
  recipeActions: boolean;
}

export interface ContextMenuItem {
  title: string;
  icon: string;
  color: string | undefined;
  event: string;
  isPublic: boolean;
}

interface Props {
  useItems?: ContextMenuIncludes;
  appendItems?: ContextMenuItem[];
  leadingItems?: ContextMenuItem[];
  menuTop?: boolean;
  fab?: boolean;
  color?: string;
  slug: string;
  menuIcon?: string | null;
  name: string;
  recipe?: Recipe;
  recipeId: string;
  recipeScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  useItems: () => ({
    delete: true,
    edit: true,
    download: true,
    duplicate: false,
    mealplanner: true,
    shoppingList: true,
    print: true,
    printPreferences: true,
    share: true,
    recipeActions: true,
  }),
  appendItems: () => [],
  leadingItems: () => [],
  menuTop: true,
  fab: false,
  color: "primary",
  menuIcon: null,
  recipe: undefined,
  recipeScale: 1,
});

const emit = defineEmits<{
  [key: string]: any;
  deleted: [slug: string];
  print: [];
}>();

const api = useUserApi();
const liteMode = useLiteMode();
const i18n = useI18n();
const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const { household } = useHouseholdSelf();
const { isOwnGroup } = useLoggedInState();
const router = useRouter();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");

// ── Dialog state ────────────────────────────────────────────────────────────
const printPreferencesDialog = ref(false);
const shareDialog            = ref(false);
const recipeDeleteDialog     = ref(false);
const mealplannerDialog      = ref(false);
const shoppingListDialog     = ref(false);
const recipeDuplicateDialog  = ref(false);
const recipeName             = ref(props.name);
const loading                = ref(false);
const menuItems              = ref<ContextMenuItem[]>([]);

// ── Meal plan date ───────────────────────────────────────────────────────────
const today = new Date();
const newMealdateString = ref(
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
);
const newMealType = ref<PlanEntryType>("dinner");

// ── Recipe ref ───────────────────────────────────────────────────────────────
const recipeRef = ref<Recipe | undefined>(props.recipe);
const recipeRefWithScale = computed(() =>
  recipeRef.value ? { scale: props.recipeScale, ...recipeRef.value } : undefined
);

const isAdminAndNotOwner = computed(() =>
  auth.user.value?.admin && auth.user.value?.id !== recipeRef.value?.userId
);
const canDelete = computed(() => {
  const user = auth.user.value;
  const recipe = recipeRef.value;
  return user && recipe && (user.admin || user.id === recipe.userId);
});

// ── Build menu items ─────────────────────────────────────────────────────────
const defaultItems: { [key: string]: ContextMenuItem } = {
  edit:             { title: i18n.t("general.edit"),             icon: $globals.icons.edit,            color: undefined, event: "edit",             isPublic: false },
  delete:           { title: i18n.t("general.delete"),           icon: $globals.icons.delete,          color: undefined, event: "delete",           isPublic: false },
  download:         { title: i18n.t("general.download"),         icon: $globals.icons.download,        color: undefined, event: "download",         isPublic: false },
  duplicate:        { title: i18n.t("general.duplicate"),        icon: $globals.icons.duplicate,       color: undefined, event: "duplicate",        isPublic: false },
  mealplanner:      { title: i18n.t("recipe.add-to-plan"),       icon: $globals.icons.calendar,        color: undefined, event: "mealplanner",      isPublic: false },
  shoppingList:     { title: i18n.t("recipe.add-to-list"),       icon: $globals.icons.cartCheck,       color: undefined, event: "shoppingList",     isPublic: false },
  print:            { title: i18n.t("general.print"),            icon: $globals.icons.printer,         color: undefined, event: "print",            isPublic: true  },
  printPreferences: { title: i18n.t("general.print-preferences"),icon: $globals.icons.printerSettings, color: undefined, event: "printPreferences", isPublic: true  },
  share:            { title: i18n.t("general.share"),            icon: $globals.icons.shareVariant,    color: undefined, event: "share",            isPublic: false },
};

menuItems.value = [...props.leadingItems, ...props.appendItems];

const liteHiddenItems = ["shoppingList", "mealplanner"];
for (const [key, value] of Object.entries(props.useItems)) {
  if (!value) continue;
  if (key === "delete" && !canDelete.value) continue;
  if (liteMode && liteHiddenItems.includes(key)) continue;
  const item = defaultItems[key];
  if (item && (item.isPublic || isOwnGroup.value)) {
    menuItems.value.push(item);
  }
}

// ── Shopping lists ───────────────────────────────────────────────────────────
const shoppingLists = ref<ShoppingListSummary[]>();

async function getShoppingLists() {
  const { data } = await api.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });
  if (data) shoppingLists.value = data.items ?? [];
}

async function refreshRecipe() {
  const { data } = await api.recipes.getOne(props.slug);
  if (data) recipeRef.value = data;
}

// ── Recipe actions ───────────────────────────────────────────────────────────
const groupRecipeActionsStore = useGroupRecipeActions();
const recipeActions = groupRecipeActionsStore.recipeActions;

async function executeRecipeAction(action: GroupRecipeActionOut) {
  if (!props.recipe) return;
  const response = await groupRecipeActionsStore.execute(action, props.recipe, props.recipeScale);
  if (action.actionType === "post") {
    if (!response?.error) alert.success(i18n.t("events.message-sent"));
    else                  alert.error(i18n.t("events.something-went-wrong"));
  }
}

// ── Event handlers ───────────────────────────────────────────────────────────
async function deleteRecipe() {
  const { data } = await api.recipes.deleteOne(props.slug);
  if (data?.slug) router.push(`/g/${groupSlug.value}`);
  emit("deleted", props.slug);
}

const download = useDownloader();

async function handleDownloadEvent() {
  const { data: shareToken } = await api.recipes.share.createOne({ recipeId: props.recipeId });
  if (!shareToken) {
    alert.error(i18n.t("events.something-went-wrong"));
    return;
  }
  download(api.recipes.share.getZipRedirectUrl(shareToken.id), `${props.slug}.zip`);
}

async function addRecipeToPlan() {
  const { response } = await api.mealplans.createOne({
    date: newMealdateString.value,
    entryType: newMealType.value,
    title: "",
    text: "",
    recipeId: props.recipeId,
  });
  if (response?.status === 201) alert.success(i18n.t("recipe.recipe-added-to-mealplan") as string);
  else                          alert.error(i18n.t("recipe.failed-to-add-recipe-to-mealplan") as string);
}

async function duplicateRecipe() {
  const { data } = await api.recipes.duplicateOne(props.slug, recipeName.value);
  if (data?.slug) router.push(`/g/${groupSlug.value}/r/${data.slug}`);
}

const planTypeOptions = usePlanTypeOptions();

const eventHandlers: { [key: string]: () => void | Promise<any> } = {
  delete:           () => { recipeDeleteDialog.value = true; },
  edit:             () => router.push(`/g/${groupSlug.value}/r/${props.slug}?edit=true`),
  download:         handleDownloadEvent,
  duplicate:        () => { recipeDuplicateDialog.value = true; },
  mealplanner:      () => { mealplannerDialog.value = true; },
  printPreferences: async () => {
    if (!recipeRef.value) await refreshRecipe();
    printPreferencesDialog.value = true;
  },
  shoppingList: () => {
    const promises: Promise<void>[] = [getShoppingLists()];
    if (!recipeRef.value) promises.push(refreshRecipe());
    Promise.allSettled(promises).then(() => { shoppingListDialog.value = true; });
  },
  share: () => { shareDialog.value = true; },
};

function contextMenuEventHandler(eventKey: string) {
  const handler = eventHandlers[eventKey];
  if (handler && typeof handler === "function") {
    handler();
    loading.value = false;
    return;
  }
  emit(eventKey);
  loading.value = false;
}
</script>
