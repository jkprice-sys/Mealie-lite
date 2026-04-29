<template>
  <!--
    BaseButton — Tailwind implementation.
    Identical prop API to the old Vuetify version; all consumers are unchanged.
    Semantic shorthand props (save, delete, cancel …) map to color/icon/label
    the same way they did before.
  -->
  <component
    :is="to ? resolveComponent('NuxtLink') : 'button'"
    :to="to || undefined"
    :type="to ? undefined : 'button'"
    :disabled="disabled || loading"
    :class="[
      'bs-btn',
      sizeClass,
      variantClass,
      $attrs.class,
    ]"
    data-bs-component
    v-bind="omitClass($attrs)"
    @click="handleClick"
  >
    <!-- Left icon -->
    <AppIcon
      v-if="resolvedIcon && !iconRight && !loading"
      :path="resolvedIcon"
      size="sm"
    />

    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>

    <!-- Label -->
    <slot name="default">{{ resolvedText }}</slot>

    <!-- Right icon -->
    <AppIcon
      v-if="resolvedIcon && iconRight && !loading"
      :path="resolvedIcon"
      size="sm"
    />
  </component>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
  // semantic shorthand — mirrors old Vuetify BaseButton exactly
  cancel:   { type: Boolean, default: false },
  create:   { type: Boolean, default: false },
  update:   { type: Boolean, default: false },
  edit:     { type: Boolean, default: false },
  save:     { type: Boolean, default: false },
  delete:   { type: Boolean, default: false },
  download: { type: Boolean, default: false },
  // state
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  // size
  small:    { type: Boolean, default: false },
  xSmall:   { type: Boolean, default: false },
  // style variant
  secondary: { type: Boolean, default: false },  // outlined
  minor:     { type: Boolean, default: false },  // ghost/text
  // overrides
  to:       { type: String,  default: null },
  color:    { type: String,  default: null },
  text:     { type: String,  default: null },
  icon:     { type: String,  default: null },
  iconRight: { type: Boolean, default: false },
  downloadUrl: { type: String, default: "" },
});

// ── i18n / globals ────────────────────────────────────────────────────────
const i18n = useI18n();
const { $globals } = useNuxtApp();

// ── Semantic option map ───────────────────────────────────────────────────
const buttonOptions = {
  create:   { text: i18n.t("general.create"),   icon: $globals.icons.createAlt, color: "primary"  },
  update:   { text: i18n.t("general.update"),   icon: $globals.icons.edit,      color: "primary"  },
  save:     { text: i18n.t("general.save"),     icon: $globals.icons.save,      color: "primary"  },
  edit:     { text: i18n.t("general.edit"),     icon: $globals.icons.edit,      color: "primary"  },
  delete:   { text: i18n.t("general.delete"),   icon: $globals.icons.delete,    color: "error"    },
  cancel:   { text: i18n.t("general.cancel"),   icon: $globals.icons.close,     color: "ghost"    },
  download: { text: i18n.t("general.download"), icon: $globals.icons.download,  color: "primary"  },
};

const btnAttrs = computed(() => {
  if (props.delete)   return buttonOptions.delete;
  if (props.update)   return buttonOptions.update;
  if (props.edit)     return buttonOptions.edit;
  if (props.cancel)   return buttonOptions.cancel;
  if (props.save)     return buttonOptions.save;
  if (props.download) return buttonOptions.download;
  return buttonOptions.create;
});

// ── Resolved values ───────────────────────────────────────────────────────
const resolvedText = computed(() => props.text ?? btnAttrs.value.text);
const resolvedIcon = computed(() => props.icon ?? btnAttrs.value.icon ?? "");
const resolvedColor = computed(() => props.color ?? btnAttrs.value.color ?? "primary");

// ── CSS classes ───────────────────────────────────────────────────────────
const sizeClass = computed(() => {
  if (props.xSmall || props.small) return "bs-btn-sm";
  return "bs-btn-md";
});

const variantClass = computed(() => {
  // Cancel / minor props → ghost
  if (props.cancel || props.minor) return "bs-btn-ghost";
  // outlined
  if (props.secondary) {
    if (resolvedColor.value === "error") return "bs-btn-error-outline";
    return "bs-btn-outline";
  }
  // solid
  if (resolvedColor.value === "error")   return "bs-btn-error";
  if (resolvedColor.value === "success") return "bs-btn-success";
  if (resolvedColor.value === "ghost")   return "bs-btn-ghost";
  return "bs-btn-primary";
});

// ── Click handler ─────────────────────────────────────────────────────────
const api = useUserApi();

function handleClick() {
  if (props.download && props.downloadUrl) {
    api.utils.download(props.downloadUrl);
  }
}

// ── Utility: strip class from $attrs so it doesn't double-apply ──────────
function omitClass(attrs: Record<string, unknown>) {
  const { class: _, ...rest } = attrs;
  return rest;
}
</script>
