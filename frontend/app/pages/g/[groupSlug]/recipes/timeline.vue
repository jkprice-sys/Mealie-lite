<template>
  <div>
    <BasePageTitle v-if="groupName">
      <template #header>
        <img
          src="/svgs/manage-members.svg"
          class="w-full max-w-[150px] max-h-[200px] object-contain"
          alt=""
        />
      </template>
      <template #title>
        {{ $t("recipe.group-global-timeline", { groupName }) }}
      </template>
    </BasePageTitle>

    <div :class="smAndDown ? '' : 'px-3'">
      <RecipeTimeline
        v-if="queryFilter"
        v-model="ready"
        show-recipe-cards
        :query-filter="queryFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { useUserApi } from "~/composables/api";
import RecipeTimeline from "~/components/Domain/Recipe/RecipeTimeline.vue";

const bp = useBreakpoints(breakpointsTailwind);
const smAndDown = bp.smallerOrEqual("sm");

definePageMeta({
  middleware: ["group-only", "lite-mode"],
});

const i18n = useI18n();
const api = useUserApi();
const ready = ref<boolean>(false);

useSeoMeta({
  title: i18n.t("recipe.timeline"),
});

const groupName = ref<string>("");
const queryFilter = ref<string>("");
async function fetchHousehold() {
  const { data } = await api.households.getCurrentUserHousehold();
  if (data) {
    queryFilter.value = `recipe.group_id="${data.groupId}"`;
    groupName.value = data.group;
  }

  ready.value = true;
}

useAsyncData("house-hold", fetchHousehold);
</script>
