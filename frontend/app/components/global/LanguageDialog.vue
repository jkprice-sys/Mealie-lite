<template>
  <BaseDialog
    v-model="modelValue"
    :icon="$globals.icons.translate"
    :title="$t('language-dialog.choose-language')"
  >
    <div class="px-4 py-3 space-y-3">
      <p class="text-sm text-on-surface">{{ $t("language-dialog.select-description") }}</p>

      <!-- Language select with search -->
      <div ref="containerRef" class="relative">
        <input
          v-model="searchInput"
          type="text"
          :placeholder="currentLocaleName || $t('search.search')"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface
                 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          @focus="isOpen = true"
        />
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen && filteredLocales.length"
            class="absolute left-0 top-full z-50 mt-1 w-full max-h-[240px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
          >
            <button
              v-for="loc in filteredLocales"
              :key="loc.value"
              type="button"
              class="flex flex-col w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors"
              @click="selectLocale(loc.value)"
            >
              <span class="text-sm text-on-surface">{{ loc.name }}</span>
              <span class="text-xs text-on-surface/50">{{ loc.progress }}% {{ $t("language-dialog.translated") }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <p class="text-sm text-on-surface">
        <i18n-t keypath="language-dialog.how-to-contribute-description">
          <template #read-the-docs-link>
            <a
              href="https://docs.mealie.io/contributors/translating/"
              target="_blank"
              class="text-primary underline"
            >
              {{ $t("language-dialog.read-the-docs") }}
            </a>
          </template>
        </i18n-t>
      </p>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { useLocales } from "~/composables/use-locales";

const modelValue = defineModel<boolean>({ default: () => false });
const { $globals } = useNuxtApp();

const { locales: LOCALES, locale, i18n } = useLocales();
const searchInput = ref("");
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
onClickOutside(containerRef, () => {
  isOpen.value = false;
  searchInput.value = "";
});

const locales = LOCALES.filter(lc =>
  i18n.locales.value.map((i18nLocale: any) => i18nLocale.code).includes(lc.value as any),
);

const currentLocaleName = computed(() => locales.find(l => l.value === locale.value)?.name || "");

const filteredLocales = computed(() => {
  if (!searchInput.value) return locales;
  const q = searchInput.value.toLowerCase();
  return locales.filter(l => l.name.toLowerCase().includes(q));
});

function selectLocale(value: string) {
  if (value && locales.some(l => l.value === value)) {
    locale.value = value as any;
    isOpen.value = false;
    searchInput.value = "";
  }
}

watch(locale, () => {
  modelValue.value = false;
});
</script>
