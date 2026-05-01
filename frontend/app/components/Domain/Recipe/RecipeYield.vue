<template>
  <div v-if="yieldDisplay" class="flex flex-nowrap items-center gap-2 text-base">
    <AppIcon :path="$globals.icons.bread" size="lg" class="text-primary shrink-0" />
    <p class="my-0 opacity-80">
      <span class="font-semibold">{{ $t("recipe.yield") }}</span><br>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="yieldDisplay" />
    </p>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from "dompurify";
import { useScaledAmount } from "~/composables/recipes/use-scaled-amount";

const { $globals } = useNuxtApp();

interface Props {
  yieldQuantity?: number;
  yieldText?: string;
  scale?: number;
  color?: string;
}
const props = withDefaults(defineProps<Props>(), {
  yieldQuantity: 0,
  yieldText: "",
  scale: 1,
  color: "accent custom-transparent",
});

function sanitizeHTML(rawHtml: string) {
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ["strong", "sup"],
  });
}

const yieldDisplay = computed<string>(() => {
  const components: string[] = [];
  const { scaledAmountDisplay } = useScaledAmount(props.yieldQuantity, props.scale);
  if (scaledAmountDisplay) components.push(scaledAmountDisplay);
  if (props.yieldText) components.push(props.yieldText);
  return sanitizeHTML(components.join(" "));
});
</script>
