<template>
  <div v-if="shoppingListChoices && ready" class="narrow-container mx-auto px-4 py-4">
    <!-- Create dialog -->
    <BaseDialog
      v-model="state.createDialog"
      :title="$t('shopping-list.create-shopping-list')"
      :icon="$globals.icons.formatListCheck"
      can-submit
      @submit="createOne"
    >
      <div class="px-4 py-2">
        <label class="block text-xs text-on-surface/60 mb-1">{{ $t('shopping-list.new-list') }}</label>
        <input
          v-model="state.createName"
          type="text"
          autofocus
          class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm
                 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary
                 focus:border-primary transition-colors"
        />
      </div>
    </BaseDialog>

    <!-- Owner dialog -->
    <BaseDialog
      v-model="state.ownerDialog"
      :icon="$globals.icons.admin"
      :title="$t('user.edit-user')"
      can-confirm
      @confirm="updateOwner"
    >
      <div class="px-4 py-2">
        <div class="flex items-center gap-2">
          <AppIcon :path="$globals.icons.user" size="sm" class="text-on-surface/50 shrink-0" />
          <div class="flex-1">
            <label class="block text-xs text-on-surface/60 mb-1">{{ $t('general.owner') }}</label>
            <select
              v-model="updateUserId"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.fullName }}</option>
            </select>
          </div>
        </div>
      </div>
    </BaseDialog>

    <!-- Delete dialog -->
    <BaseDialog
      v-model="state.deleteDialog"
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteOne"
    >
      <p class="px-4 py-2 text-sm text-on-surface">{{ $t('shopping-list.are-you-sure-you-want-to-delete-this-item') }}</p>
    </BaseDialog>

    <BasePageTitle divider>
      <template #header>
        <img width="100" height="100" src="/svgs/shopping-cart.svg" class="object-contain" />
      </template>
      <template #title>
        {{ $t('shopping-list.shopping-lists') }}
      </template>
    </BasePageTitle>

    <!-- Controls -->
    <div class="flex items-center justify-end gap-4 py-4">
      <label class="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
        <input
          v-model="preferences.viewAllLists"
          type="checkbox"
          class="w-4 h-4 rounded border-border accent-primary"
        />
        {{ $t('general.show-all') }}
      </label>
      <BaseButton create @click="state.createDialog = true" />
    </div>

    <!-- Empty state -->
    <div v-if="!shoppingListChoices.length">
      <BasePageTitle>
        <template #title>{{ $t('shopping-list.no-shopping-lists-found') }}</template>
      </BasePageTitle>
    </div>

    <!-- List -->
    <section class="space-y-2">
      <NuxtLink
        v-for="list in shoppingListChoices"
        :key="list.id"
        :to="`/shopping-lists/${list.id}`"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface
               hover:bg-primary/5 transition-colors group block"
        style="border-left: 3px solid rgb(var(--color-primary));"
      >
        <AppIcon :path="$globals.icons.cartCheck" size="md" class="text-on-surface/60 shrink-0" />
        <span class="flex-1 text-sm font-medium text-on-surface">{{ list.name }}</span>
        <button
          type="button"
          :title="$t('user.edit-user')"
          class="bs-btn bs-btn-sm bs-btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
          @click.prevent="toggleOwnerDialog(list)"
        >
          <AppIcon :path="$globals.icons.user" size="sm" />
        </button>
        <button
          type="button"
          :title="$t('general.delete')"
          class="bs-btn bs-btn-sm bs-btn-ghost text-error opacity-0 group-hover:opacity-100 transition-opacity"
          @click.prevent="openDelete(list.id)"
        >
          <AppIcon :path="$globals.icons.delete" size="sm" />
        </button>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["lite-mode"] });

import type { ShoppingListOut } from "~/lib/api/types/household";
import { useUserApi } from "~/composables/api";
import { useAsyncKey } from "~/composables/use-utils";
import { useShoppingListPreferences } from "~/composables/use-users/preferences";
import type { UserOut } from "~/lib/api/types/user";

const { $globals } = useNuxtApp();
const auth = useMealieAuth();
const i18n = useI18n();
const ready = ref(false);
const userApi = useUserApi();
const route = useRoute();

useSeoMeta({ title: i18n.t("shopping-list.shopping-list") });

const overrideDisableRedirect = ref(false);
const disableRedirect = computed(() => route.query.disableRedirect === "true" || overrideDisableRedirect.value);
const preferences = useShoppingListPreferences();

const state = reactive({
  createName:  "",
  createDialog: false,
  deleteDialog: false,
  deleteTarget: "",
  ownerDialog:  false,
  ownerTarget:  ref<ShoppingListOut | null>(null),
});

const { data: shoppingLists } = useAsyncData(useAsyncKey(), async () => fetchShoppingLists());

const shoppingListChoices = computed(() => {
  if (!shoppingLists.value) return [];
  return shoppingLists.value.filter(
    list => preferences.value.viewAllLists || list.userId === auth.user.value?.id,
  );
});

watch(() => preferences.value.viewAllLists, () => { overrideDisableRedirect.value = true; });

watch(
  () => shoppingListChoices,
  () => {
    if (!disableRedirect.value && shoppingListChoices.value.length === 1) {
      navigateTo(`/shopping-lists/${shoppingListChoices.value[0].id}`);
    }
    else {
      ready.value = true;
    }
  },
  { deep: true },
);

async function fetchShoppingLists() {
  const { data } = await userApi.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });
  return data?.items ?? [];
}

async function refresh() {
  shoppingLists.value = await fetchShoppingLists();
}

async function createOne() {
  const { data } = await userApi.shopping.lists.createOne({ name: state.createName });
  if (data) { refresh(); state.createName = ""; }
}

async function toggleOwnerDialog(list: ShoppingListOut) {
  if (!state.ownerDialog) {
    state.ownerTarget = list;
    await fetchAllUsers();
  }
  state.ownerDialog = !state.ownerDialog;
}

const allUsers = ref<UserOut[]>([]);
const updateUserId = ref<string | undefined>();
async function fetchAllUsers() {
  const { data } = await userApi.households.fetchMembers();
  if (!data) return;
  allUsers.value = data.items.sort((a, b) => ((a.fullName || "") < (b.fullName || "") ? -1 : 1));
  updateUserId.value = state.ownerTarget?.userId;
}

async function updateOwner() {
  if (!state.ownerTarget || !updateUserId.value) return;
  if (state.ownerTarget.userId === updateUserId.value) return;
  const { data: fullList } = await userApi.shopping.lists.getOne(state.ownerTarget.id);
  if (!fullList) return;
  const { data } = await userApi.shopping.lists.updateOne(
    state.ownerTarget.id,
    { ...fullList, userId: updateUserId.value },
  );
  if (data) refresh();
}

function openDelete(id: string) {
  state.deleteDialog = true;
  state.deleteTarget = id;
}

async function deleteOne() {
  const { data } = await userApi.shopping.lists.deleteOne(state.deleteTarget);
  if (data) refresh();
}
</script>
