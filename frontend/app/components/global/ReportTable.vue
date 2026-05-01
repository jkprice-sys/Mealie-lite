<template>
  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="w-full text-sm text-on-surface">
      <thead>
        <tr class="bg-surface border-b border-border text-xs text-on-surface/60 font-medium">
          <th class="px-4 py-3 text-left">{{ $t("category.category") }}</th>
          <th class="px-4 py-3 text-left">{{ $t("general.name") }}</th>
          <th class="px-4 py-3 text-left">{{ $t("general.timestamp") }}</th>
          <th class="px-4 py-3 text-left">{{ $t("general.status") }}</th>
          <th class="px-4 py-3 text-left w-12" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-border/50 last:border-0 transition-colors"
          :class="item.status !== 'in-progress' ? 'cursor-pointer hover:bg-primary/5' : ''"
          @click="handleRowClick(item)"
        >
          <td class="px-4 py-3">{{ capitalize(item.category) }}</td>
          <td class="px-4 py-3">{{ item.name }}</td>
          <td class="px-4 py-3">{{ item.timestamp ? $d(Date.parse(item.timestamp), "long") : '' }}</td>
          <td class="px-4 py-3">{{ capitalize(item.status || '') }}</td>
          <td class="px-4 py-3">
            <button
              type="button"
              class="p-1 rounded hover:bg-error/10 text-on-surface/40 hover:text-error transition-colors"
              @click.stop="deleteReport(item.id)"
            >
              <AppIcon :path="$globals.icons.delete" size="sm" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ReportSummary } from "~/lib/api/types/reports";

defineProps({
  items: {
    type: Array as () => Array<ReportSummary>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "delete", id: string): void;
}>();

const { $globals } = useNuxtApp();
const i18n = useI18n();
const router = useRouter();

function handleRowClick(item: ReportSummary) {
  if (item.status === "in-progress") return;
  router.push(`/group/reports/${item.id}`);
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function deleteReport(id: string) {
  emit("delete", id);
}
</script>
