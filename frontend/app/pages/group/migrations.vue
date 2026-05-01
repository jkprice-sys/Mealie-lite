<template>
  <div class="px-4 py-4">
    <BasePageTitle divider>
      <template #header>
        <img width="200" height="200" class="mb-2 object-contain" src="/svgs/manage-data-migrations.svg" />
      </template>
      <template #title>
        {{ $t('migration.recipe-data-migrations') }}
      </template>
      {{ $t('migration.recipe-data-migrations-explanation') }}
    </BasePageTitle>

    <div class="mt-6">
      <BaseCardSectionTitle :title="$t('migration.new-migration')" />

      <!-- New migration card -->
      <div class="rounded-xl border border-border bg-surface overflow-hidden relative">
        <!-- Loading bar -->
        <div v-if="state.loading" class="absolute top-0 left-0 right-0 h-1 bg-primary/20">
          <div class="h-full bg-primary animate-pulse w-full" />
        </div>

        <div class="px-4 pt-4 pb-2">
          <h2 class="text-base font-semibold text-on-surface">{{ $t('migration.choose-migration-type') }}</h2>
        </div>

        <div v-if="content" class="px-4 pb-3">
          <div class="mb-2">
            <BaseOverflowButton
              v-model="state.migrationType"
              mode="model"
              :items="items"
            />
          </div>
          <p class="text-sm text-on-surface/70 mb-2">{{ content.text }}</p>

          <!-- Flat file tree -->
          <div v-if="flatTree.length" class="mt-2 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-on-surface/80">
            <div
              v-for="node in flatTree"
              :key="node.id"
              class="flex items-center gap-1.5 py-0.5"
              :style="{ paddingLeft: `${node.depth * 16}px` }"
            >
              <AppIcon :path="node.icon" size="xs" class="flex-shrink-0 text-on-surface/60" />
              <span>{{ node.title }}</span>
            </div>
          </div>
        </div>

        <div class="px-4 pb-1 pt-2">
          <h2 class="text-base font-semibold text-on-surface">{{ $t('general.upload-file') }}</h2>
        </div>
        <div class="px-4 pb-3">
          <AppButtonUpload
            :accept="content.acceptedFileType || '.zip'"
            class="mb-2"
            :post="false"
            file-name="file"
            :text-btn="false"
            @uploaded="setFileObject"
          />
          <p class="text-sm text-on-surface/70">{{ state.fileObject.name || $t('migration.no-file-selected') }}</p>
        </div>

        <div class="px-4 pb-3">
          <label class="flex items-start gap-2 cursor-pointer">
            <input
              v-model="state.addMigrationTag"
              type="checkbox"
              class="mt-0.5 accent-primary"
            />
            <span class="text-sm text-on-surface">
              <i18n-t keypath="migration.tag-all-recipes">
                <template #tag-name>
                  <b class="mx-1">{{ state.migrationType }}</b>
                </template>
              </i18n-t>
            </span>
          </label>
        </div>

        <div class="flex justify-end px-4 pb-4">
          <BaseButton
            :disabled="!state.fileObject.name"
            submit
            @click="startMigration"
          >
            {{ $t("general.submit") }}
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="mt-10">
      <BaseCardSectionTitle :title="$t('migration.previous-migrations')" />
      <ReportTable
        :items="state.reports"
        @delete="deleteReport"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportSummary } from "~/lib/api/types/reports";
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";
import { useUserApi } from "~/composables/api";
import type { SupportedMigrations } from "~/lib/api/types/group";

interface TreeNode {
  id?: number;
  icon: string;
  title: string;
  children?: TreeNode[];
}

interface FlatTreeNode {
  id: number;
  title: string;
  icon: string;
  depth: number;
}

interface MigrationContent {
  text: string;
  acceptedFileType: string;
  tree: TreeNode[] | false;
}

const MIGRATIONS = {
  mealie: "mealie_alpha",
  chowdown: "chowdown",
  copymethat: "copymethat",
  myrecipebox: "myrecipebox",
  nextcloud: "nextcloud",
  paprika: "paprika",
  plantoeat: "plantoeat",
  recipekeeper: "recipekeeper",
  tandoor: "tandoor",
  cookn: "cookn",
};

definePageMeta({
  middleware: ["advanced-only", "lite-mode"],
});

const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("settings.migrations"),
});

const api = useUserApi();

const state = reactive({
  addMigrationTag: false,
  loading: false,
  treeState: true,
  migrationType: MIGRATIONS.mealie as SupportedMigrations,
  fileObject: {} as File,
  reports: [] as ReportSummary[],
});

const items: MenuItem[] = [
  {
    text: i18n.t("migration.mealie-pre-v1.title"),
    value: MIGRATIONS.mealie,
    divider: true,
  },
  {
    text: i18n.t("migration.chowdown.title"),
    value: MIGRATIONS.chowdown,
  },
  {
    text: i18n.t("migration.copymethat.title"),
    value: MIGRATIONS.copymethat,
  },
  {
    text: i18n.t("migration.myrecipebox.title"),
    value: MIGRATIONS.myrecipebox,
  },
  {
    text: i18n.t("migration.nextcloud.title"),
    value: MIGRATIONS.nextcloud,
  },
  {
    text: i18n.t("migration.paprika.title"),
    value: MIGRATIONS.paprika,
  },
  {
    text: i18n.t("migration.plantoeat.title"),
    value: MIGRATIONS.plantoeat,
  },
  {
    text: i18n.t("migration.recipekeeper.title"),
    value: MIGRATIONS.recipekeeper,
  },
  {
    text: i18n.t("migration.tandoor.title"),
    value: MIGRATIONS.tandoor,
  },
  {
    text: i18n.t("migration.cookn.title"),
    value: MIGRATIONS.cookn,
  },
];

const _content: Record<string, MigrationContent> = {
  [MIGRATIONS.mealie]: {
    text: i18n.t("migration.mealie-pre-v1.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "mealie.zip",
        children: [
          {
            title: "recipes",
            icon: $globals.icons.folderOutline,
            children: [
              {
                title: "recipe-name",
                icon: $globals.icons.folderOutline,
                children: [
                  { title: "recipe-name.json", icon: $globals.icons.codeJson },
                  {
                    title: "images",
                    icon: $globals.icons.folderOutline,
                    children: [
                      { title: "original.webp", icon: $globals.icons.codeJson },
                      { title: "full.jpg", icon: $globals.icons.fileImage },
                      { title: "thumb.jpg", icon: $globals.icons.fileImage },
                    ],
                  },
                ],
              },
              {
                title: "recipe-name-1",
                icon: $globals.icons.folderOutline,
                children: [
                  { title: "recipe-name-1.json", icon: $globals.icons.codeJson },
                  {
                    title: "images",
                    icon: $globals.icons.folderOutline,
                    children: [
                      { title: "original.webp", icon: $globals.icons.codeJson },
                      { title: "full.jpg", icon: $globals.icons.fileImage },
                      { title: "thumb.jpg", icon: $globals.icons.fileImage },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  [MIGRATIONS.chowdown]: {
    text: i18n.t("migration.chowdown.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "nextcloud.zip",
        children: [
          {
            title: i18n.t("migration.recipe-1"),
            icon: $globals.icons.folderOutline,
            children: [
              { title: "recipe.json", icon: $globals.icons.codeJson },
              { title: "full.jpg", icon: $globals.icons.fileImage },
              { title: "thumb.jpg", icon: $globals.icons.fileImage },
            ],
          },
          {
            title: i18n.t("migration.recipe-2"),
            icon: $globals.icons.folderOutline,
            children: [
              { title: "recipe.json", icon: $globals.icons.codeJson },
              { title: "full.jpg", icon: $globals.icons.fileImage },
              { title: "thumb.jpg", icon: $globals.icons.fileImage },
            ],
          },
        ],
      },
    ],
  },
  [MIGRATIONS.copymethat]: {
    text: i18n.t("migration.copymethat.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "Copy_Me_That_20230306.zip",
        children: [
          {
            title: "images",
            icon: $globals.icons.folderOutline,
            children: [
              { title: "recipe_1_an5zy.jpg", icon: $globals.icons.fileImage },
              { title: "recipe_2_82el8.jpg", icon: $globals.icons.fileImage },
              { title: "recipe_3_j75qg.jpg", icon: $globals.icons.fileImage },
            ],
          },
          { title: "recipes.html", icon: $globals.icons.codeJson },
        ],
      },
    ],
  },
  [MIGRATIONS.myrecipebox]: {
    text: i18n.t("migration.myrecipebox.description-long"),
    acceptedFileType: ".csv",
    tree: false,
  },
  [MIGRATIONS.nextcloud]: {
    text: i18n.t("migration.nextcloud.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "nextcloud.zip",
        children: [
          {
            title: i18n.t("migration.recipe-1"),
            icon: $globals.icons.folderOutline,
            children: [
              { title: "recipe.json", icon: $globals.icons.codeJson },
              { title: "full.jpg", icon: $globals.icons.fileImage },
              { title: "thumb.jpg", icon: $globals.icons.fileImage },
            ],
          },
          {
            title: i18n.t("migration.recipe-2"),
            icon: $globals.icons.folderOutline,
            children: [
              { title: "recipe.json", icon: $globals.icons.codeJson },
              { title: "full.jpg", icon: $globals.icons.fileImage },
              { title: "thumb.jpg", icon: $globals.icons.fileImage },
            ],
          },
        ],
      },
    ],
  },
  [MIGRATIONS.paprika]: {
    text: i18n.t("migration.paprika.description-long"),
    acceptedFileType: ".zip",
    tree: false,
  },
  [MIGRATIONS.plantoeat]: {
    text: i18n.t("migration.plantoeat.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "plantoeat-recipes-508318_10-13-2023.zip",
        children: [
          { title: "plantoeat-recipes-508318_10-13-2023.csv", icon: $globals.icons.codeJson },
        ],
      },
    ],
  },
  [MIGRATIONS.recipekeeper]: {
    text: i18n.t("migration.recipekeeper.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "recipekeeperhtml.zip",
        children: [
          { title: "recipes.html", icon: $globals.icons.codeJson },
          {
            title: "images",
            icon: $globals.icons.folderOutline,
            children: [
              { title: "image1.jpg", icon: $globals.icons.fileImage },
              { title: "image2.jpg", icon: $globals.icons.fileImage },
            ],
          },
        ],
      },
    ],
  },
  [MIGRATIONS.tandoor]: {
    text: i18n.t("migration.tandoor.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "tandoor_default_export_full_2023-06-29.zip",
        children: [
          {
            title: "1.zip",
            icon: $globals.icons.zip,
            children: [
              { title: "image.jpeg", icon: $globals.icons.fileImage },
              { title: "recipe.json", icon: $globals.icons.codeJson },
            ],
          },
          {
            title: "2.zip",
            icon: $globals.icons.zip,
            children: [
              { title: "image.jpeg", icon: $globals.icons.fileImage },
              { title: "recipe.json", icon: $globals.icons.codeJson },
            ],
          },
          {
            title: "3.zip",
            icon: $globals.icons.zip,
            children: [
              { title: "image.jpeg", icon: $globals.icons.fileImage },
              { title: "recipe.json", icon: $globals.icons.codeJson },
            ],
          },
        ],
      },
    ],
  },
  [MIGRATIONS.cookn]: {
    text: i18n.t("migration.cookn.description-long"),
    acceptedFileType: ".zip",
    tree: [
      {
        icon: $globals.icons.zip,
        title: "cookn.zip",
        children: [
          { title: "temp_brand.dsv", icon: $globals.icons.codeJson },
          { title: "temp_chapter_desc.dsv", icon: $globals.icons.codeJson },
          { title: "temp_chapter.dsv", icon: $globals.icons.codeJson },
          { title: "temp_cookBook_desc.dsv", icon: $globals.icons.codeJson },
          { title: "temp_cookBook.dsv", icon: $globals.icons.codeJson },
          { title: "temp_food_brand.dsv", icon: $globals.icons.codeJson },
          { title: "temp_food_group.dsv", icon: $globals.icons.codeJson },
          { title: "temp_food.dsv", icon: $globals.icons.codeJson },
          { title: "temp_ingredient.dsv", icon: $globals.icons.codeJson },
          { title: "temp_media.dsv", icon: $globals.icons.codeJson },
          { title: "temp_nutrient.dsv", icon: $globals.icons.codeJson },
          { title: "temp_recipe_desc.dsv", icon: $globals.icons.codeJson },
          { title: "temp_recipe.dsv", icon: $globals.icons.codeJson },
          { title: "temp_unit_equivalent.dsv", icon: $globals.icons.codeJson },
          { title: "temp_unit.dsv", icon: $globals.icons.codeJson },
          { title: "images", icon: $globals.icons.fileImage },
        ],
      },
    ],
  },
};

function addIdToNode(counter: number, node: TreeNode): number {
  node.id = counter;
  counter += 1;
  if (node.children) {
    node.children.forEach((child: TreeNode) => {
      counter = addIdToNode(counter, child);
    });
  }
  return counter;
}

for (const key in _content) {
  const migration = _content[key];
  if (migration.tree && Array.isArray(migration.tree)) {
    let counter = 1;
    migration.tree.forEach((node: TreeNode) => {
      counter = addIdToNode(counter, node);
    });
  }
}

function flattenTree(nodes: TreeNode[], depth = 0): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];
  for (const node of nodes) {
    result.push({ id: node.id ?? 0, title: node.title, icon: node.icon, depth });
    if (node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

function setFileObject(fileObject: File) {
  state.fileObject = fileObject;
}

async function startMigration() {
  state.loading = true;
  const payload = {
    addMigrationTag: state.addMigrationTag,
    migrationType: state.migrationType,
    archive: state.fileObject,
  };

  const { data } = await api.groupMigration.startMigration(payload);

  state.loading = false;

  if (data) {
    state.reports.unshift(data);
  }
}

async function getMigrationReports() {
  const { data } = await api.groupReports.getAll("migration");

  if (data) {
    state.reports = data;
  }
}

async function deleteReport(id: string) {
  await api.groupReports.deleteOne(id);
  getMigrationReports();
}

onMounted(() => {
  getMigrationReports();
});

const content = computed(() => {
  const data = _content[state.migrationType];

  if (data) {
    return data;
  }
  else {
    return {
      text: "",
      acceptedFileType: ".zip",
      tree: false as false,
    };
  }
});

const flatTree = computed<FlatTreeNode[]>(() => {
  if (content.value.tree && Array.isArray(content.value.tree)) {
    return flattenTree(content.value.tree);
  }
  return [];
});
</script>
