<template>
  <div v-if="model.length > 0 || edit" class="mt-4">
    <div class="bs-card overflow-hidden">
      <!-- Header -->
      <div class="bs-card-header flex items-center">
        <span class="text-base">{{ $t("asset.assets") }}</span>
        <button
          v-if="edit"
          type="button"
          class="bs-btn bs-btn-sm bs-btn-ghost ml-auto"
          @click="state.newAssetDialog = true"
        >
          <AppIcon :path="$globals.icons.create" size="sm" />
        </button>
      </div>

      <!-- Asset list -->
      <ul v-if="model.length > 0" class="divide-y divide-border">
        <li
          v-for="(item, i) in model"
          :key="i"
          class="flex items-center gap-3 px-4 py-2"
        >
          <!-- Thumbnail -->
          <a
            :href="assetURL(item.fileName ?? '')"
            target="_blank"
            class="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-border flex items-center justify-center"
          >
            <img
              v-if="isImage(item.fileName)"
              :src="assetURL(item.fileName ?? '')"
              :alt="item.name"
              loading="lazy"
              class="w-full h-full object-cover"
            />
            <AppIcon
              v-else
              :path="getIconDefinition(item.icon).icon"
              size="lg"
              class="text-on-surface/50"
            />
          </a>

          <!-- Name -->
          <span class="flex-1 text-sm text-on-surface truncate">{{ item.name }}</span>

          <!-- Actions (edit mode: context menu; view mode: download link) -->
          <template v-if="edit">
            <Menu as="div" class="relative">
              <MenuButton class="bs-btn bs-btn-sm bs-btn-ghost">
                <AppIcon :path="$globals.icons.dotsVertical" size="sm" />
              </MenuButton>
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <MenuItems
                  class="absolute right-0 bottom-full mb-1 z-50 w-44 rounded-lg border border-border
                         bg-surface shadow-lg py-1 focus:outline-none"
                >
                  <MenuItem v-slot="{ active }">
                    <a
                      :href="assetURL(item.fileName ?? '')"
                      target="_blank"
                      class="flex items-center gap-2 px-3 py-2 text-sm text-on-surface"
                      :class="active ? 'bg-gray-100 dark:bg-gray-700' : ''"
                    >
                      <AppIcon :path="$globals.icons.eye" size="sm" class="text-on-surface/60" />
                      {{ $t('general.view') }}
                    </a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a
                      :href="assetURL(item.fileName ?? '')"
                      download
                      class="flex items-center gap-2 px-3 py-2 text-sm text-on-surface"
                      :class="active ? 'bg-gray-100 dark:bg-gray-700' : ''"
                    >
                      <AppIcon :path="$globals.icons.download" size="sm" class="text-on-surface/60" />
                      {{ $t('general.download') }}
                    </a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      type="button"
                      class="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface text-left"
                      :class="active ? 'bg-gray-100 dark:bg-gray-700' : ''"
                      @click="copyText(assetEmbed(item.fileName ?? ''))"
                    >
                      <AppIcon :path="$globals.icons.contentCopy" size="sm" class="text-on-surface/60" />
                      {{ $t('general.copy') }}
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      type="button"
                      class="flex items-center gap-2 w-full px-3 py-2 text-sm text-error text-left"
                      :class="active ? 'bg-gray-100 dark:bg-gray-700' : ''"
                      @click="model.splice(i, 1)"
                    >
                      <AppIcon :path="$globals.icons.delete" size="sm" />
                      {{ $t('general.delete') }}
                    </button>
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </template>
          <template v-else>
            <a
              :href="assetURL(item.fileName ?? '')"
              download
              class="bs-btn bs-btn-sm bs-btn-ghost"
            >
              <AppIcon :path="$globals.icons.download" size="sm" />
            </a>
          </template>
        </li>
      </ul>
    </div>

    <!-- ── New asset dialog ──────────────────────────────────────────────── -->
    <BaseDialog
      v-model="state.newAssetDialog"
      :title="$t('asset.new-asset')"
      :icon="getIconDefinition(state.newAsset.icon).icon"
      can-submit
      @submit="addAsset"
    >
      <div class="space-y-4 pt-2">
        <!-- Name -->
        <div class="relative">
          <input
            v-model="state.newAsset.name"
            type="text"
            :placeholder="$t('general.name')"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm
                   text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                   focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <!-- Icon picker + file upload -->
        <div class="flex items-center gap-3">
          <!-- Native select for icon type -->
          <div class="relative flex items-center gap-2 flex-1">
            <AppIcon :path="getIconDefinition(state.newAsset.icon).icon" size="sm" class="text-on-surface/50 shrink-0" />
            <select
              v-model="state.newAsset.icon"
              class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm
                     text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                     focus:border-primary transition-colors"
            >
              <option
                v-for="opt in iconOptions"
                :key="opt.name"
                :value="opt.name"
              >
                {{ opt.title }}
              </option>
            </select>
          </div>

          <!-- File upload -->
          <AppButtonUpload
            :post="false"
            file-name="file"
            @uploaded="setFileObject"
          >
            <template #default="{ isSelecting, onButtonClick }">
              <button
                type="button"
                class="bs-btn bs-btn-md bs-btn-outline shrink-0"
                :disabled="isSelecting"
                @click="onButtonClick"
              >
                <AppIcon :path="$globals.icons.fileImage" size="sm" />
                {{ $t('general.choose') }}
              </button>
            </template>
          </AppButtonUpload>
        </div>

        <!-- Selected file name -->
        <p v-if="state.fileObject?.name" class="text-xs text-on-surface/50 truncate">
          {{ state.fileObject.name }}
        </p>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { useStaticRoutes, useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import type { RecipeAsset } from "~/lib/api/types/recipe";
import { useCopy } from "~/composables/use-copy";

const { $globals } = useNuxtApp();

const props = defineProps({
  slug:     { type: String,  required: true },
  recipeId: { type: String,  required: true },
  edit:     { type: Boolean, default: true },
});

const model = defineModel<RecipeAsset[]>({ required: true });
const api = useUserApi();

const state = reactive({
  newAssetDialog: false,
  fileObject: {} as File,
  newAsset: { name: "", icon: "mdi-file" },
});

const i18n = useI18n();
const { copyText } = useCopy();

const iconOptions = [
  { name: "mdi-file",                  title: i18n.t("asset.file"),   icon: $globals.icons.file },
  { name: "mdi-file-pdf-box",          title: i18n.t("asset.pdf"),    icon: $globals.icons.filePDF },
  { name: "mdi-file-image",            title: i18n.t("asset.image"),  icon: $globals.icons.fileImage },
  { name: "mdi-code-json",             title: i18n.t("asset.code"),   icon: $globals.icons.codeJson },
  { name: "mdi-silverware-fork-knife", title: i18n.t("asset.recipe"), icon: $globals.icons.primary },
];

const serverBase = useRequestURL().origin;
const { recipeAssetPath } = useStaticRoutes();

function getIconDefinition(icon: string) {
  return iconOptions.find(item => item.name === icon) ?? iconOptions[0];
}

function isImage(fileName?: string | null) {
  if (!fileName) return false;
  return /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(fileName);
}

function assetURL(assetName: string) {
  return recipeAssetPath(props.recipeId, assetName);
}

function assetEmbed(name: string) {
  return `<img src="${serverBase}${assetURL(name)}" height="100%" width="100%" />`;
}

function setFileObject(fileObject: File) {
  state.fileObject = fileObject;
  if (!state.newAsset.name?.trim()) {
    state.newAsset.name = fileObject.name.substring(0, fileObject.name.lastIndexOf("."));
  }
}

async function addAsset() {
  if (!state.fileObject?.name) {
    alert.error(i18n.t("asset.error-submitting-form") as string);
    return;
  }
  const nameToUse = state.newAsset.name?.trim() || state.fileObject.name;
  const { data } = await api.recipes.createAsset(props.slug, {
    name: nameToUse,
    icon: state.newAsset.icon,
    file: state.fileObject,
    extension: state.fileObject.name.split(".").pop() || "",
  });
  if (data) model.value = [...model.value, data];
  state.newAsset  = { name: "", icon: "mdi-file" };
  state.fileObject = {} as File;
}
</script>
