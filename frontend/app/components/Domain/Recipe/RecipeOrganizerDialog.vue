<template>
  <div>
    <BaseDialog
      v-model="dialog"
      width="500"
      :title="properties.title"
      :icon="properties.icon"
      can-submit
      :submit-disabled="!name"
      @submit="select"
    >
      <div class="px-4 py-3 space-y-3">
        <div>
          <label class="block text-xs text-on-surface/60 mb-1">{{ properties.label }}</label>
          <input
            v-model="name"
            type="text"
            autofocus
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                   focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
        <label v-if="itemType === Organizer.Tool" class="flex items-center gap-2 cursor-pointer">
          <input v-model="onHand" type="checkbox" class="accent-primary" />
          <span class="text-sm text-on-surface">{{ $t('tool.on-hand') }}</span>
        </label>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { useCategoryStore, useTagStore, useToolStore } from "~/composables/store";
import { type RecipeOrganizer, Organizer } from "~/lib/api/types/non-generated";

const { $globals } = useNuxtApp();

const CREATED_ITEM_EVENT = "created-item";

interface Props {
  color?: string | null;
  tagDialog?: boolean;
  itemType?: RecipeOrganizer;
}
const props = withDefaults(defineProps<Props>(), {
  color: null,
  tagDialog: true,
  itemType: "category" as RecipeOrganizer,
});

const emit = defineEmits<{
  "created-item": [item: any];
}>();

const dialog = defineModel<boolean>({ default: false });

const i18n = useI18n();

const name = ref("");
const onHand = ref(false);

watch(
  dialog,
  (val: boolean) => {
    if (!val) name.value = "";
  },
);

const userApi = useUserApi();

const store = (() => {
  switch (props.itemType) {
    case Organizer.Tag:
      return useTagStore();
    case Organizer.Tool:
      return useToolStore();
    default:
      return useCategoryStore();
  }
})();

const properties = computed(() => {
  switch (props.itemType) {
    case Organizer.Tag:
      return {
        title: i18n.t("tag.create-a-tag"),
        label: i18n.t("tag.tag-name"),
        icon: $globals.icons.tags,
        api: userApi.tags,
      };
    case Organizer.Tool:
      return {
        title: i18n.t("tool.create-a-tool"),
        label: i18n.t("tool.tool-name"),
        icon: $globals.icons.potSteam,
        api: userApi.tools,
      };
    default:
      return {
        title: i18n.t("category.create-a-category"),
        label: i18n.t("category.category-name"),
        icon: $globals.icons.categories,
        api: userApi.categories,
      };
  }
});

const rules = {
  required: (val: string) => !!val || (i18n.t("general.a-name-is-required") as string),
};

async function select() {
  if (store) {
    // @ts-expect-error the same state is used for different organizer types, which have different requirements
    const newItem = await store.actions.createOne({ name: name.value, onHand: onHand.value });
    emit(CREATED_ITEM_EVENT, newItem);
  }
  dialog.value = false;
}
</script>

<style></style>
