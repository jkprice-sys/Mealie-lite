<template>
  <div v-if="shoppingList" class="container mx-auto px-4 py-4">
    <!-- Confirm: check all -->
    <BaseDialog
      v-model="state.checkAllDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.checkboxOutline"
      can-confirm
      @confirm="checkAll"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t('shopping-list.are-you-sure-you-want-to-check-all-items') }}
      </div>
    </BaseDialog>

    <!-- Confirm: uncheck all -->
    <BaseDialog
      v-model="state.uncheckAllDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.checkboxBlankOutline"
      can-confirm
      @confirm="uncheckAll"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t('shopping-list.are-you-sure-you-want-to-uncheck-all-items') }}
      </div>
    </BaseDialog>

    <!-- Confirm: delete checked -->
    <BaseDialog
      v-model="state.deleteCheckedDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="deleteChecked"
    >
      <div class="px-4 py-3 text-sm text-on-surface">
        {{ $t('shopping-list.are-you-sure-you-want-to-delete-checked-items') }}
      </div>
    </BaseDialog>

    <!-- Reorder Labels dialog -->
    <BaseDialog
      v-model="reorderLabelsDialog"
      :icon="$globals.icons.tagArrowUp"
      :title="$t('shopping-list.reorder-labels')"
      :submit-icon="$globals.icons.save"
      :submit-text="$t('general.save')"
      can-submit
      @submit="saveLabelOrder"
      @close="cancelLabelOrder"
    >
      <div class="px-4 py-3 max-h-[70vh] overflow-y-auto">
        <VueDraggable
          v-if="localLabels"
          v-model="localLabels"
          handle=".handle"
          :delay="250"
          :delay-on-touch-only="true"
          class="space-y-1"
          @update:model-value="updateLabelOrder"
        >
          <div v-for="(labelSetting, index) in localLabels" :key="labelSetting.id">
            <MultiPurposeLabelSection v-model="localLabels[index]" use-color />
          </div>
        </VueDraggable>
      </div>
    </BaseDialog>

    <!-- ── Page header ──────────────────────────────────────────── -->
    <BasePageTitle divider>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <!-- Back link -->
          <ButtonLink
            :to="`/shopping-lists?disableRedirect=true`"
            :text="$t('shopping-list.all-lists')"
            :icon="$globals.icons.backArrow"
          />

          <!-- Center illustration (md+) -->
          <img
            v-if="mdAndUp"
            src="/svgs/shopping-cart.svg"
            class="h-24 w-24 object-contain hidden md:block"
            alt=""
          />

          <!-- Action buttons -->
          <BaseButtonGroup
            :buttons="[
              {
                icon: $globals.icons.contentCopy,
                text: '',
                event: 'edit',
                children: [
                  {
                    icon: $globals.icons.contentCopy,
                    text: $t('shopping-list.copy-as-text'),
                    event: 'copy-plain',
                  },
                  {
                    icon: $globals.icons.contentCopy,
                    text: $t('shopping-list.copy-as-markdown'),
                    event: 'copy-markdown',
                  },
                ],
              },
              {
                icon: $globals.icons.checkboxOutline,
                text: $t('shopping-list.check-all-items'),
                event: 'check',
              },
              {
                icon: $globals.icons.dotsVertical,
                text: '',
                event: 'three-dot',
                children: [
                  {
                    icon: $globals.icons.tags,
                    text: $t('shopping-list.reorder-labels'),
                    event: 'reorder-labels',
                  },
                  {
                    icon: $globals.icons.tags,
                    text: $t('shopping-list.manage-labels'),
                    event: 'manage-labels',
                  },
                ],
              },
            ]"
            @edit="edit = true"
            @three-dot="threeDot = true"
            @check="openCheckAll"
            @copy-plain="copyListItems('plain')"
            @copy-markdown="copyListItems('markdown')"
            @reorder-labels="toggleReorderLabelsDialog()"
            @manage-labels="$router.push('/group/data/labels')"
          />
        </div>
      </template>
      <template #title>
        {{ shoppingList.name }}
      </template>
    </BasePageTitle>

    <BannerWarning
      v-if="isOffline"
      :title="$t('shopping-list.you-are-offline')"
      :description="$t('shopping-list.you-are-offline-description')"
    />

    <!-- ── Viewer ───────────────────────────────────────────────── -->
    <section v-if="!edit" class="py-2 flex flex-col gap-4">
      <!-- Create item -->
      <div v-if="createEditorOpen">
        <ShoppingListItemEditor
          v-model="createListItemData"
          class="my-4"
          :labels="allLabels || []"
          :units="allUnits || []"
          :foods="allFoods || []"
          :allow-delete="false"
          @delete="createEditorOpen = false"
          @cancel="createEditorOpen = false"
          @save="createListItem"
        />
      </div>
      <div v-else class="flex justify-end">
        <BaseButton create @click="createEditorOpen = true">
          {{ $t('general.add') }}
        </BaseButton>
      </div>

      <!-- Label sections (accordion per label group) -->
      <TransitionGroup name="list-fade">
        <div
          v-for="(value, key) in itemsByLabel"
          :key="key"
          class="rounded-lg border border-border overflow-hidden"
        >
          <!-- Section header -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-primary/5 transition-colors text-left font-semibold text-sm"
            :style="getLabelColor(key) ? `border-left: 4px solid ${getLabelColor(key)}` : ''"
            @click="toggleLabelSection(String(key))"
          >
            <span>{{ key }}</span>
            <AppIcon
              :path="$globals.icons.chevronDown"
              size="sm"
              class="shrink-0 text-on-surface/40 transition-transform duration-200"
              :class="openLabelSections.has(String(key)) ? '' : '-rotate-90'"
            />
          </button>

          <!-- Section body with draggable items -->
          <div v-show="openLabelSections.has(String(key))" class="border-t border-border">
            <VueDraggable
              :model-value="value"
              handle=".handle"
              :delay="250"
              :delay-on-touch-only="true"
              @start="loadingCounter += 1"
              @end="loadingCounter -= 1"
              @update:model-value="updateIndexUncheckedByLabel(key.toString(), $event)"
            >
              <div
                v-for="(item, index) in value"
                :key="item.id"
                class="px-4 py-2 border-b border-border/50 last:border-0"
              >
                <ShoppingListItem
                  v-model="value[index]"
                  :labels="allLabels || []"
                  :units="allUnits || []"
                  :foods="allFoods || []"
                  :recipes="recipeMap"
                  @checked="saveListItem"
                  @save="saveListItem"
                  @delete="deleteListItem(item)"
                />
              </div>
            </VueDraggable>
          </div>
        </div>
      </TransitionGroup>

      <!-- Checked items accordion -->
      <div
        v-if="listItems.checked && listItems.checked.length > 0"
        class="rounded-lg border border-border overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-2 bg-surface hover:bg-primary/5 transition-colors text-left"
          @click="checkedOpen = !checkedOpen"
        >
          <span class="text-sm font-medium text-on-surface/70">
            {{ $t('shopping-list.items-checked-count', listItems.checked ? listItems.checked.length : 0) }}
          </span>
          <div class="flex items-center gap-2">
            <BaseButtonGroup
              :buttons="[
                {
                  icon: $globals.icons.checkboxBlankOutline,
                  text: $t('shopping-list.uncheck-all-items'),
                  event: 'uncheck',
                },
                {
                  icon: $globals.icons.delete,
                  text: $t('shopping-list.delete-checked'),
                  event: 'delete',
                },
              ]"
              @uncheck="openUncheckAll"
              @delete="openDeleteChecked"
            />
            <AppIcon
              :path="$globals.icons.chevronDown"
              size="sm"
              class="shrink-0 text-on-surface/40 transition-transform duration-200"
              :class="checkedOpen ? '' : '-rotate-90'"
            />
          </div>
        </button>

        <div v-show="checkedOpen" class="border-t border-border">
          <div
            v-for="(item, idx) in listItems.checked"
            :key="item.id"
            class="px-4 py-2 border-b border-border/50 last:border-0"
          >
            <ShoppingListItem
              v-model="listItems.checked[idx]"
              class="opacity-60"
              :labels="allLabels || []"
              :units="allUnits || []"
              :foods="allFoods || []"
              @checked="saveListItem"
              @save="saveListItem"
              @delete="deleteListItem(item)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ── Recipe references ────────────────────────────────────── -->
    <section
      v-if="shoppingList.recipeReferences && shoppingList.recipeReferences.length > 0"
      class="mt-6"
    >
      <div class="flex items-center gap-2 mb-2 text-sm text-on-surface font-medium">
        <AppIcon :path="$globals.icons.primary" size="sm" />
        {{ $t('shopping-list.linked-recipes-count', shoppingList.recipeReferences?.length ?? 0) }}
      </div>
      <hr class="border-border mb-3" />
      <RecipeList
        :recipes="recipeList"
        show-description
        :disabled="isOffline"
      >
        <template
          v-for="(recipe, index) in recipeList"
          #[`actions-${recipe.id}`]
          :key="'item-actions-decrease' + recipe.id"
        >
          <button
            v-if="recipe"
            type="button"
            class="p-1 rounded text-on-surface/40 hover:text-error transition-colors"
            :disabled="isOffline"
            @click.prevent="removeRecipeReferenceToList(recipe.id!)"
          >
            <AppIcon :path="$globals.icons.minus" size="sm" />
          </button>
          <div class="px-1 text-xs text-on-surface/60">
            {{ shoppingList.recipeReferences[index].recipeQuantity }}
          </div>
          <button
            type="button"
            class="p-1 rounded text-on-surface/40 hover:text-primary transition-colors"
            :disabled="isOffline"
            @click.prevent="addRecipeReferenceToList(recipe.id!)"
          >
            <AppIcon :path="$globals.icons.createAlt" size="sm" />
          </button>
        </template>
      </RecipeList>
    </section>

    <WakelockSwitch />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["lite-mode"] });
import { VueDraggable } from "vue-draggable-plus";
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import RecipeList from "~/components/Domain/Recipe/RecipeList.vue";
import MultiPurposeLabelSection from "~/components/Domain/ShoppingList/MultiPurposeLabelSection.vue";
import ShoppingListItem from "~/components/Domain/ShoppingList/ShoppingListItem.vue";
import ShoppingListItemEditor from "~/components/Domain/ShoppingList/ShoppingListItemEditor.vue";
import { useShoppingListPage } from "~/composables/shopping-list-page/use-shopping-list-page";
import { useFoodStore, useLabelStore, useUnitStore } from "~/composables/store";

const bp     = useBreakpoints(breakpointsTailwind);
const mdAndUp = bp.greaterOrEqual("md");

const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({ title: i18n.t("shopping-list.shopping-list") });

const route = useRoute();
const id = route.params.id as string;

const shoppingListPage = useShoppingListPage(id);
const { store: allLabels } = useLabelStore();
const { store: allUnits }  = useUnitStore();
const { store: allFoods }  = useFoodStore();

const {
  shoppingList,
  state,
  checkAll,
  uncheckAll,
  deleteChecked,
  reorderLabelsDialog,
  localLabels,
  saveLabelOrder,
  cancelLabelOrder,
  updateLabelOrder,
  edit,
  threeDot,
  openCheckAll,
  copyListItems,
  toggleReorderLabelsDialog,
  isOffline,
  createEditorOpen,
  createListItemData,
  createListItem,
  itemsByLabel,
  getLabelColor,
  loadingCounter,
  updateIndexUncheckedByLabel,
  recipeMap,
  saveListItem,
  deleteListItem,
  listItems,
  openUncheckAll,
  openDeleteChecked,
  recipeList,
  removeRecipeReferenceToList,
  addRecipeReferenceToList,
} = shoppingListPage;

// ── Label section accordion state ─────────────────────────────
const openLabelSections = reactive(new Set<string>());

// Open all sections by default when itemsByLabel changes
watch(
  itemsByLabel,
  (labels) => {
    Object.keys(labels).forEach(key => openLabelSections.add(key));
  },
  { immediate: true },
);

function toggleLabelSection(key: string) {
  if (openLabelSections.has(key)) openLabelSections.delete(key);
  else openLabelSections.add(key);
}

// Checked items accordion state
const checkedOpen = ref(false);
</script>

<style>
.list-fade-enter-active,
.list-fade-leave-active {
  transition: opacity 0.2s ease;
}
.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
}
</style>
