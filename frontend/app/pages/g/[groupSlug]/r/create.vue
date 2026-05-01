<template>
  <div>
    <BasePageTitle divider>
      <template #header>
        <img
          src="/svgs/recipes-create.svg"
          alt=""
          class="w-full max-w-[175px] max-h-[175px] object-contain"
        />
      </template>
      <template #title>
        {{ $t('recipe.recipe-creation') }}
      </template>
      <template #content>
        <div class="flex flex-col gap-2 w-full">
          <p class="text-sm text-on-surface/70">
            {{ $t('recipe.select-one-of-the-various-ways-to-create-a-recipe') }}
          </p>
          <BaseOverflowButton
            v-model="subpage"
            :items="subpages"
          />
        </div>
      </template>
    </BasePageTitle>

    <section>
      <NuxtPage />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";

definePageMeta({
  middleware: ["group-only"],
});

const i18n = useI18n();
const auth = useMealieAuth();
const { $appInfo, $globals } = useNuxtApp();

useSeoMeta({
  title: i18n.t("general.create"),
});

const subpages = computed<MenuItem[]>(() => [
  { icon: $globals.icons.link,      text: i18n.t("recipe.import-with-url"),    value: "url"   },
  { icon: $globals.icons.link,      text: i18n.t("recipe.bulk-url-import"),    value: "bulk"  },
  { icon: $globals.icons.codeTags,  text: i18n.t("recipe.import-html-json"),   value: "html"  },
  { icon: $globals.icons.fileImage, text: i18n.t("recipe.create-from-images"), value: "image", hide: !$appInfo.enableOpenaiImageServices },
  { icon: $globals.icons.edit,      text: i18n.t("recipe.create-recipe"),      value: "new"   },
  { icon: $globals.icons.zip,       text: i18n.t("recipe.import-with-zip"),    value: "zip"   },
  { icon: $globals.icons.robot,     text: i18n.t("recipe.debug-scraper"),      value: "debug" },
]);

const route = useRoute();
const router = useRouter();
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");

const subpage = computed({
  set(subpage: string) {
    router.push({ path: `/g/${groupSlug.value}/r/create/${subpage}`, query: route.query });
  },
  get() {
    return route.path.split("/").pop() ?? "url";
  },
});
</script>
