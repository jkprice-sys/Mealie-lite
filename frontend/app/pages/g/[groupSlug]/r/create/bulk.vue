<template>
  <div>
    <h2 class="text-lg font-semibold text-on-surface mb-1">
      {{ $t('recipe.recipe-bulk-importer') }}
    </h2>
    <p class="text-sm text-on-surface/70 mb-4">
      {{ $t('recipe.recipe-bulk-importer-description') }}
    </p>

    <section>
      <!-- URL rows -->
      <div
        v-for="(_, idx) in bulkUrls"
        :key="'bulk-url' + idx"
        class="mb-2"
      >
        <!-- URL input row -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <AppIcon :path="$globals.icons.link" size="sm" class="text-on-surface/40" />
            </div>
            <input
              v-model="bulkUrls[idx].url"
              type="url"
              :placeholder="$t('new-recipe.recipe-url')"
              class="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm
                     text-on-surface placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <button
            type="button"
            class="bs-btn bs-btn-sm bs-btn-ghost text-error shrink-0"
            @click="bulkUrls.splice(idx, 1)"
          >
            <AppIcon :path="$globals.icons.delete" size="sm" />
          </button>
        </div>

        <!-- Categories & Tags (optional, hidden by default) -->
        <template v-if="state.showCatTags">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <RecipeOrganizerSelector
              v-model="bulkUrls[idx].categories"
              selector-type="categories"
              :input-attrs="{
                variant: 'filled',
                singleLine: true,
                density: 'compact',
                rounded: true,
                class: 'rounded-lg',
                hideDetails: true,
                clearable: true,
              }"
            />
            <RecipeOrganizerSelector
              v-model="bulkUrls[idx].tags"
              selector-type="tags"
              :input-attrs="{
                variant: 'filled',
                singleLine: true,
                density: 'compact',
                rounded: true,
                class: 'rounded-lg',
                hideDetails: true,
                clearable: true,
              }"
            />
          </div>
        </template>
      </div>

      <!-- Row actions -->
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <BaseButton
          delete
          @click="bulkUrls = []; lockBulkImport = false;"
        >
          {{ $t('general.clear') }}
        </BaseButton>
        <div class="flex-1" />
        <BaseButton
          color="info"
          @click="bulkUrls.push({ url: '', categories: [], tags: [] })"
        >
          <template #icon>
            {{ $globals.icons.createAlt }}
          </template>
          {{ $t('general.new') }}
        </BaseButton>
        <RecipeDialogBulkAdd
          v-model="state.bulkDialog"
          @bulk-data="assignUrls"
        />
      </div>

      <!-- Show categories/tags toggle -->
      <label class="flex items-center gap-2 cursor-pointer text-sm text-on-surface mt-3">
        <input v-model="state.showCatTags" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
        {{ $t('recipe.set-categories-and-tags') }}
      </label>

      <!-- Submit -->
      <div class="flex flex-col items-center mt-4">
        <BaseButton
          :disabled="bulkUrls.length === 0 || lockBulkImport"
          class="w-64"
          @click="bulkCreate"
        >
          <template #icon>
            {{ $globals.icons.check }}
          </template>
        </BaseButton>
      </div>
    </section>

    <!-- Past bulk import reports -->
    <section class="mt-12">
      <BaseCardSectionTitle :title="$t('recipe.bulk-imports')" />
      <ReportTable
        :items="reports"
        @delete="deleteReport"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import { alert } from "~/composables/use-toast";
import RecipeOrganizerSelector from "~/components/Domain/Recipe/RecipeOrganizerSelector.vue";
import type { ReportSummary } from "~/lib/api/types/reports";
import RecipeDialogBulkAdd from "~/components/Domain/Recipe/RecipeDialogBulkAdd.vue";

const { $globals } = useNuxtApp();

const state = reactive({
  showCatTags: false,
  bulkDialog: false,
});

const api = useUserApi();
const i18n = useI18n();

const bulkUrls = ref([{ url: "", categories: [], tags: [] }]);
const lockBulkImport = ref(false);

async function bulkCreate() {
  if (bulkUrls.value.length === 0) return;

  const { response } = await api.recipes.createManyByUrl({ imports: bulkUrls.value });

  if (response?.status === 202) {
    alert.success(i18n.t("recipe.bulk-import-process-has-started"));
    lockBulkImport.value = true;
  }
  else {
    alert.error(i18n.t("recipe.bulk-import-process-has-failed"));
  }

  fetchReports();
}

// ── Reports ───────────────────────────────────────────────────────────────────

const reports = ref<ReportSummary[]>([]);

async function fetchReports() {
  const { data } = await api.groupReports.getAll("bulk_import");
  reports.value = data ?? [];
}

async function deleteReport(id: string) {
  const { response } = await api.groupReports.deleteOne(id);
  if (response?.status === 200) fetchReports();
  else alert.error(i18n.t("recipe.report-deletion-failed"));
}

fetchReports();

function assignUrls(urls: string[]) {
  bulkUrls.value = urls.map(url => ({ url, categories: [], tags: [] }));
}
</script>
