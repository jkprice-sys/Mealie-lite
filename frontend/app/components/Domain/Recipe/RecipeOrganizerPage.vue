<template>
  <div v-if="items">
    <!-- Create organizer dialog -->
    <RecipeOrganizerDialog
      v-model="dialogs.organizer"
      :item-type="itemType"
    />

    <!-- Delete confirmation dialog -->
    <BaseDialog
      v-if="deleteTarget"
      v-model="dialogs.delete"
      :title="$t('general.delete-with-name', { name: $t(translationKey) })"
      color="error"
      :icon="$globals.icons.alertCircle"
      can-confirm
      @confirm="deleteOne()"
    >
      <div class="px-1 py-2">
        <p>{{ $t("general.confirm-delete-generic-with-name", { name: $t(translationKey) }) }}</p>
        <p class="mt-4 mb-0 ml-4 font-medium">{{ deleteTarget.name }}</p>
      </div>
    </BaseDialog>

    <!-- Update dialog -->
    <BaseDialog
      v-if="updateTarget"
      v-model="dialogs.update"
      :title="$t('general.update')"
      :icon="$globals.icons.edit"
      can-confirm
      @confirm="updateOne()"
    >
      <div class="px-1 py-3 flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium text-on-surface/70 mb-1">
            {{ $t('general.name') }}
          </label>
          <input
            v-model="updateTarget.name"
            type="text"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
                   text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                   focus:border-primary transition-colors"
          />
        </div>
        <label
          v-if="itemType === Organizer.Tool"
          class="flex items-center gap-2 cursor-pointer text-sm text-on-surface"
        >
          <input
            v-model="updateTarget.onHand"
            type="checkbox"
            class="w-4 h-4 rounded border-border accent-primary"
          />
          {{ $t('tool.on-hand') }}
        </label>
      </div>
    </BaseDialog>

    <!-- Search bar -->
    <div class="mb-4">
      <div class="relative">
        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <AppIcon :path="$globals.icons.search" size="sm" class="text-on-surface/40" />
        </div>
        <input
          v-model="searchString"
          type="text"
          autofocus
          :placeholder="$t('search.search-placeholder')"
          class="w-full rounded-lg border border-border bg-surface pl-9 pr-9 py-2.5 text-sm
                 text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                 focus:ring-primary focus:border-primary transition-colors"
        />
        <!-- Clear button -->
        <button
          v-if="searchString"
          type="button"
          class="absolute inset-y-0 right-3 flex items-center text-on-surface/40
                 hover:text-on-surface/70 transition-colors"
          @click="searchString = ''"
        >
          <AppIcon :path="$globals.icons.close" size="sm" />
        </button>
      </div>
    </div>

    <!-- Toolbar: title slot + create button -->
    <div class="flex items-center gap-2 mb-2">
      <AppIcon :path="icon" size="lg" class="text-on-surface/60 shrink-0" />
      <span class="text-lg font-medium text-on-surface">
        <slot name="title" />
      </span>
      <div class="flex-1" />
      <BaseButton create @click="dialogs.organizer = true" />
    </div>

    <!-- Alphabetically grouped item grid -->
    <section
      v-for="(itms, key, idx) in itemsSorted"
      :key="'header' + idx"
      :class="idx === 1 ? null : 'my-4'"
    >
      <BaseCardSectionTitle
        v-if="isTitle(key)"
        :title="key"
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-2">
        <NuxtLink
          v-for="(item, index) in itms"
          :key="'cat' + index"
          v-if="item"
          :to="`/g/${groupSlug}?${itemType}=${item.id}`"
          class="bs-card border-l-4 border-l-primary flex items-center gap-2 px-3 py-2
                 hover:shadow-md transition-shadow no-underline"
        >
          <AppIcon :path="icon" size="md" class="text-primary shrink-0" />
          <span class="flex-1 truncate text-sm font-medium text-on-surface py-1">
            {{ item.name }}
          </span>
          <ContextMenu
            :items="[presets.delete, presets.edit]"
            @delete="confirmDelete(item)"
            @edit="openUpdateDialog(item)"
          />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Fuse from "fuse.js";
import { useContextPresets } from "~/composables/use-context-presents";
import RecipeOrganizerDialog from "~/components/Domain/Recipe/RecipeOrganizerDialog.vue";
import { Organizer, type RecipeOrganizer } from "~/lib/api/types/non-generated";
import { useRouteQuery } from "~/composables/use-router";
import { deepCopy } from "~/composables/use-utils";

interface GenericItem {
  id: string;
  name: string;
  slug: string;
  onHand: boolean;
}

const props = defineProps<{
  items: GenericItem[];
  icon: string;
  itemType: RecipeOrganizer;
}>();

const emit = defineEmits<{
  update: [item: GenericItem];
  delete: [id: string];
}>();

const state = reactive({
  options: {
    ignoreLocation: true,
    shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 20,
    findAllMatches: true,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["name"],
  },
});

const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user?.value?.groupSlug || "");

// =================================================================
// Context Menu

const dialogs = ref({
  organizer: false,
  update: false,
  delete: false,
});

const presets = useContextPresets();

const translationKey = computed<string>(() => {
  const typeMap = {
    categories: "category.category",
    tags: "tag.tag",
    tools: "tool.tool",
    foods: "shopping-list.food",
    households: "household.household",
  };
  return typeMap[props.itemType] || "";
});

const deleteTarget = ref<GenericItem | null>(null);
const updateTarget = ref<GenericItem | null>(null);

function confirmDelete(item: GenericItem) {
  deleteTarget.value = item;
  dialogs.value.delete = true;
}

function deleteOne() {
  if (!deleteTarget.value) {
    return;
  }
  emit("delete", deleteTarget.value.id);
}

function openUpdateDialog(item: GenericItem) {
  updateTarget.value = deepCopy(item);
  dialogs.value.update = true;
}

function updateOne() {
  if (!updateTarget.value) {
    return;
  }
  emit("update", updateTarget.value);
}

// ================================================================
// Search

const searchString = useRouteQuery("q", "");

const fuse = computed(() => {
  return new Fuse(props.items, state.options);
});

const fuzzyItems = computed<GenericItem[]>(() => {
  if (searchString.value.trim() === "") {
    return props.items;
  }
  const result = fuse.value.search(searchString.value.trim() as string);
  return result.map(x => x.item);
});

// =================================================================
// Sorted Items

const itemsSorted = computed(() => {
  const byLetter: { [key: string]: Array<GenericItem> } = {};

  if (!fuzzyItems.value) {
    return byLetter;
  }

  [...fuzzyItems.value]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((item) => {
      const letter = item.name[0].toUpperCase();
      if (!byLetter[letter]) {
        byLetter[letter] = [];
      }
      byLetter[letter].push(item);
    });

  return byLetter;
});

function isTitle(str: number | string) {
  return typeof str === "string" && str.length === 1;
}
</script>
