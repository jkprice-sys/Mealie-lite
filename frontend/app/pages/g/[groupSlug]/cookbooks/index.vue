<template>
  <div>
    <!-- Create Dialog -->
    <BaseDialog
      v-if="createTarget"
      v-model="dialogStates.create"
      width="100%"
      max-width="1100px"
      :icon="$globals.icons.pages"
      :title="$t('cookbook.create-a-cookbook')"
      :submit-icon="$globals.icons.save"
      :submit-text="$t('general.save')"
      :submit-disabled="!createTarget.queryFilterString"
      can-submit
      @submit="actions.updateOne(createTarget)"
      @cancel="deleteCreateTarget()"
    >
      <div class="px-4 py-2">
        <CookbookEditor :key="createTargetKey" v-model="createTarget" />
      </div>
    </BaseDialog>

    <!-- Delete Dialog -->
    <BaseDialog
      v-model="dialogStates.delete"
      :title="$t('general.delete-with-name', { name: $t('cookbook.cookbook') })"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteCookbook()"
    >
      <div class="px-4 py-2 space-y-2">
        <p class="text-sm text-on-surface">{{ $t("general.confirm-delete-generic-with-name", { name: $t("cookbook.cookbook") }) }}</p>
        <p v-if="deleteTarget" class="mt-4 ml-4 text-sm font-medium text-on-surface">{{ deleteTarget.name }}</p>
      </div>
    </BaseDialog>

    <!-- Page content -->
    <div class="lg-container mx-auto px-4 py-4">
      <BasePageTitle divider>
        <template #header>
          <img width="100" height="100" src="/svgs/manage-cookbooks.svg" class="object-contain" />
        </template>
        <template #title>
          {{ $t("cookbook.cookbooks") }}
        </template>
        {{ $t("cookbook.description") }}
      </BasePageTitle>

      <!-- Hide other households toggle -->
      <div class="my-6">
        <label class="flex items-center gap-3 cursor-pointer text-sm text-on-surface">
          <input
            v-model="cookbookPreferences.hideOtherHouseholds"
            type="checkbox"
            class="w-4 h-4 rounded border-border accent-primary"
          />
          {{ $t('cookbook.hide-cookbooks-from-other-households') }}
        </label>
        <p class="text-xs text-on-surface/60 mt-1 ml-7">
          {{ $t("cookbook.hide-cookbooks-from-other-households-description") }}
        </p>
      </div>

      <!-- Create button -->
      <BaseButton create @click="createCookbook" />

      <!-- Cookbook accordion list -->
      <div class="mt-2 space-y-2">
        <VueDraggable
          v-model="myCookbooks"
          handle=".handle"
          :delay="250"
          :delay-on-touch-only="true"
          @end="updateAll(myCookbooks)"
        >
          <div
            v-for="(cookbook, index) in myCookbooks"
            :key="cookbook.id"
            class="rounded-lg border border-border bg-surface overflow-hidden"
          >
            <!-- Panel header -->
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left
                     hover:bg-primary/5 transition-colors"
              @click="togglePanel(cookbook.id)"
            >
              <div class="flex items-center gap-2">
                <AppIcon :path="$globals.icons.pages" size="md" class="text-on-surface/60" />
                <span class="text-base font-semibold opacity-80">{{ cookbook.name }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <AppIcon
                  :path="openPanels.has(cookbook.id) ? $globals.icons.chevronDown : $globals.icons.arrowRight"
                  size="sm"
                  class="text-on-surface/50 transition-transform"
                  :class="openPanels.has(cookbook.id) ? 'rotate-0' : ''"
                />
                <div class="handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-border">
                  <AppIcon :path="$globals.icons.arrowUpDown" size="md" class="text-on-surface/50" />
                </div>
              </div>
            </button>

            <!-- Panel body -->
            <div v-if="openPanels.has(cookbook.id)" class="border-t border-border px-4 pb-4 pt-3">
              <CookbookEditor v-model="myCookbooks[index]" :collapsable="false" />
              <div class="flex justify-end mt-3">
                <BaseButtonGroup
                  :buttons="[
                    {
                      icon: $globals.icons.delete,
                      text: $t('general.delete'),
                      event: 'delete',
                    },
                    {
                      icon: $globals.icons.save,
                      text: $t('general.save'),
                      event: 'save',
                      disabled: !cookbook.queryFilterString,
                    },
                  ]"
                  @delete="deleteEventHandler(myCookbooks[index])"
                  @save="actions.updateOne(myCookbooks[index])"
                />
              </div>
            </div>
          </div>
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { useCookbookStore } from "~/composables/store/use-cookbook-store";
import { useHouseholdSelf } from "@/composables/use-households";
import CookbookEditor from "~/components/Domain/Cookbook/CookbookEditor.vue";
import type { CreateCookBook, ReadCookBook } from "~/lib/api/types/cookbook";
import { useCookbookPreferences } from "~/composables/use-users/preferences";

definePageMeta({
  middleware: ["group-only", "lite-mode"],
});

const i18n = useI18n();
const { $globals } = useNuxtApp();

useSeoMeta({ title: i18n.t("cookbook.cookbooks") });

const auth = useMealieAuth();
const { store: allCookbooks, actions, updateAll } = useCookbookStore();

const myCookbooks = ref<ReadCookBook[]>([]);
watch(
  allCookbooks,
  (cookbooks) => {
    myCookbooks.value = cookbooks?.filter(
      cookbook => cookbook.householdId === auth.user.value?.householdId,
    ).sort((a, b) => a.position > b.position) ?? [];
  },
  { immediate: true },
);

const { household } = useHouseholdSelf();
const cookbookPreferences = useCookbookPreferences();

// Accordion open state
const openPanels = reactive(new Set<string>());
function togglePanel(id: string) {
  if (openPanels.has(id)) openPanels.delete(id);
  else openPanels.add(id);
}

const dialogStates = reactive({ create: false, delete: false });

// Create
const createTargetKey = ref(0);
const createTarget = ref<ReadCookBook | null>(null);
async function createCookbook() {
  const name = i18n.t("cookbook.household-cookbook-name", [
    household.value?.name || "",
    String((myCookbooks.value?.length ?? 0) + 1),
  ]) as string;

  await actions.createOne({ name } as CreateCookBook).then((cookbook) => {
    if (!cookbook) return;
    myCookbooks.value.push(cookbook);
    createTarget.value = cookbook as ReadCookBook;
    createTargetKey.value++;
  });
  dialogStates.create = true;
}

// Delete
const deleteTarget = ref<ReadCookBook | null>(null);
function deleteEventHandler(item: ReadCookBook) {
  deleteTarget.value = item;
  dialogStates.delete = true;
}
async function deleteCookbook() {
  if (!deleteTarget.value) return;
  await actions.deleteOne(deleteTarget.value.id);
  myCookbooks.value = myCookbooks.value.filter(c => c.id !== deleteTarget.value?.id);
  dialogStates.delete = false;
  deleteTarget.value = null;
}

async function deleteCreateTarget() {
  if (!createTarget.value?.id) return;
  await actions.deleteOne(createTarget.value.id);
  myCookbooks.value = myCookbooks.value.filter(c => c.id !== createTarget.value?.id);
  dialogStates.create = false;
  createTarget.value = null;
}

function handleUnmount() {
  if (!createTarget.value?.id || createTarget.value.queryFilterString) return;
  deleteCreateTarget();
}

onMounted(() => window.addEventListener("beforeunload", handleUnmount));
onBeforeUnmount(() => {
  handleUnmount();
  window.removeEventListener("beforeunload", handleUnmount);
});
</script>
