<template>
  <div v-if="ready" class="min-h-screen flex flex-col items-center justify-center bg-background">
    <div class="text-center mb-4">
      <slot>
        <h1 class="text-xl font-semibold text-on-surface">
          {{ $t("page.404-page-not-found") }}
        </h1>
      </slot>
    </div>

    <div class="flex items-center justify-center gap-4 mb-8">
      <span class="text-primary font-bold" style="font-size: 200px; line-height: 1">4</span>
      <AppIcon :path="$globals.icons.primary" class="text-primary" style="font-size: 200px; width: 200px; height: 200px;" />
      <span class="text-primary font-bold" style="font-size: 200px; line-height: 1">4</span>
    </div>

    <div class="flex items-center gap-3">
      <slot name="actions">
        <NuxtLink
          v-for="(button, index) in buttons"
          :key="index"
          :to="button.to"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
        >
          <AppIcon :path="button.icon" size="sm" />
          {{ button.text }}
        </NuxtLink>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGlobalI18n } from "~/composables/use-global-i18n";

const props = defineProps({
  error: {
    type: Object,
    default: null,
  },
});

definePageMeta({
  layout: "basic",
});

const i18n = useGlobalI18n();
const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const ready = ref(false);

const route = useRoute();
const router = useRouter();

async function insertGroupSlugIntoRoute() {
  const groupSlug = ref(auth.user.value?.groupSlug);
  if (!groupSlug.value) {
    return;
  }

  let replaceRoute = false;
  let routeVal = route.fullPath || "/";
  if (routeVal[0] !== "/") {
    routeVal = `/${routeVal}`;
  }

  // replace "recipe" in URL with "r"
  if (routeVal.includes("/recipe/")) {
    replaceRoute = true;
    routeVal = routeVal.replace("/recipe/", "/r/");
  }

  // insert groupSlug into URL
  const routeComponents = routeVal.split("/");
  if (routeComponents.length < 2 || routeComponents[1].toLowerCase() !== "g") {
    replaceRoute = true;
    routeVal = `/g/${groupSlug.value}${routeVal}`;
  }

  if (replaceRoute) {
    await router.replace(routeVal);
  }
}

async function handle404() {
  const normalizedRoute = route.fullPath.replace(/\/$/, "");
  const newRoute = normalizedRoute.replace(/^\/group\/(mealplan|members|notifiers|webhooks)(\/.*)?$/, "/household/$1$2");

  if (newRoute !== normalizedRoute) {
    await router.replace(newRoute);
  }
  else {
    await insertGroupSlugIntoRoute();
  }

  ready.value = true;
}

if (props.error.statusCode === 404) {
  handle404();
}
else {
  ready.value = true;
}

useSeoMeta({
  title:
        props.error.statusCode === 404
          ? (i18n.t("page.404-not-found") as string)
          : (i18n.t("page.an-error-occurred") as string),
});

const buttons = [
  { icon: $globals.icons.home, to: "/", text: i18n.t("general.home") },
];
</script>

<style scoped>
h1 {
  font-size: 20px;
}
</style>
