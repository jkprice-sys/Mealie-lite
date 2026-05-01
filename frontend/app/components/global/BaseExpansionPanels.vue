<template>
  <!--
    BaseExpansionPanels — custom accordion replacing v-expansion-panels.
    The slot content (shopping-lists/[id].vue) is now migrated to use
    data-panel-title / data-panel-content template fragments, so this
    wrapper uses a simple open/closed ref per key.

    The shopping-list page renders items directly without this wrapper
    after the Phase 3 migration; this component is kept for any other
    remaining callers.

    Usage: wrap a single logical "panel" whose header and body are
    injected via named slots #header and #default.
  -->
  <div class="rounded-lg border border-border overflow-hidden">
    <!-- Panel header -->
    <button
      type="button"
      class="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-primary/5 transition-colors text-left"
      @click="isOpen = !isOpen"
    >
      <slot name="header" />
      <AppIcon
        :path="$globals.icons.chevronDown"
        size="sm"
        class="shrink-0 text-on-surface/40 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <!-- Panel body -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[9999px] opacity-100"
      leave-active-class="transition-all duration-150 ease-in overflow-hidden"
      leave-from-class="max-h-[9999px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-show="isOpen" class="border-t border-border">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface Props {
  startOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  startOpen: false,
});

const { $globals } = useNuxtApp();
const isOpen = ref(props.startOpen);
</script>
