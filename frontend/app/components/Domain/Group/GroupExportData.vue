<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm text-on-surface">
      <thead>
        <tr class="border-b border-border">
          <th
            v-for="h in headers"
            :key="h.value"
            class="py-3 px-3 text-left text-xs font-semibold text-on-surface/60 uppercase tracking-wide"
          >
            {{ h.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in exports"
          :key="item.id"
          class="border-b border-border hover:bg-primary/5 transition-colors"
        >
          <td class="py-2 px-3">{{ item.name }}</td>
          <td class="py-2 px-3 font-mono text-xs">{{ item.filename }}</td>
          <td class="py-2 px-3">{{ item.size }}</td>
          <td class="py-2 px-3">{{ getTimeToExpire(item.expires) }}</td>
          <td class="py-2 px-3">
            <BaseButton download small :download-url="`/api/recipes/bulk-actions/export/${item.id}/download`" />
          </td>
        </tr>
        <tr v-if="!exports || exports.length === 0">
          <td :colspan="headers.length" class="py-10 text-center text-on-surface/40">
            {{ $t("general.nothing-here") }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { parseISO, formatDistanceToNow } from "date-fns";
import type { GroupDataExport } from "~/lib/api/types/group";

defineProps<{
  exports: GroupDataExport[];
}>();

const i18n = useI18n();

const headers = [
  { title: i18n.t("export.export"),      value: "name" },
  { title: i18n.t("export.file-name"),   value: "filename" },
  { title: i18n.t("export.size"),        value: "size" },
  { title: i18n.t("export.link-expires"), value: "expires" },
  { title: "",                           value: "actions" },
];

function getTimeToExpire(timeString: string) {
  return formatDistanceToNow(parseISO(timeString), { addSuffix: false });
}
</script>
