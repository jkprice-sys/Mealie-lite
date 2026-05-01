<template>
  <div class="px-4 py-4">
    <BasePageTitle divider>
      <template #header>
        <img width="200" height="200" class="mb-2 object-contain" src="/svgs/data-reports.svg" />
      </template>
      <template #title>
        {{ $t('group.report') }}
      </template>
    </BasePageTitle>

    <div v-if="report">
      <BaseCardSectionTitle :title="report.name" />
      <p class="text-sm text-on-surface/70 mb-4">{{ $t('group.report-with-id', { id: id }) }}</p>

      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full text-sm text-on-surface">
          <thead>
            <tr class="border-b border-border bg-surface">
              <th class="w-8 px-3 py-2" />
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">Success</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">Message</th>
              <th class="px-3 py-2 text-left font-medium text-on-surface/60">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(entry, idx) in report.entries" :key="idx">
              <tr class="border-b border-border hover:bg-primary/5 transition-colors">
                <td class="px-3 py-2">
                  <button
                    v-if="entry.exception"
                    type="button"
                    class="text-on-surface/50 hover:text-on-surface transition-colors"
                    @click="toggleExpand(idx)"
                  >
                    <AppIcon
                      :path="expandedRows.has(idx) ? $globals.icons.chevronUp : $globals.icons.chevronDown"
                      size="sm"
                    />
                  </button>
                </td>
                <td class="px-3 py-2">
                  <AppIcon
                    :path="entry.success ? $globals.icons.checkboxMarkedCircle : $globals.icons.close"
                    size="sm"
                    :class="entry.success ? 'text-success' : 'text-error'"
                  />
                </td>
                <td class="px-3 py-2">{{ entry.message }}</td>
                <td class="px-3 py-2">{{ $d(Date.parse(entry.timestamp!), "short") }}</td>
              </tr>
              <tr v-if="entry.exception && expandedRows.has(idx)" class="bg-surface/50">
                <td colspan="4" class="px-6 py-4 text-sm text-on-surface/70 font-mono whitespace-pre-wrap">
                  {{ entry.exception }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { ReportOut } from "~/lib/api/types/reports";

const route = useRoute();
const { $globals } = useNuxtApp();
const id = route.params.id as string;

const api = useUserApi();

const report = ref<ReportOut | null>(null);

async function getReport() {
  const { data } = await api.groupReports.getOne(id);
  report.value = data ?? null;
}

onMounted(async () => {
  await getReport();
});

const expandedRows = ref<Set<number>>(new Set());

function toggleExpand(idx: number) {
  if (expandedRows.value.has(idx)) {
    expandedRows.value.delete(idx);
  }
  else {
    expandedRows.value.add(idx);
  }
  // trigger reactivity
  expandedRows.value = new Set(expandedRows.value);
}
</script>
