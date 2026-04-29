<template>
  <div />
</template>

<script setup lang="ts">
/**
 * Recipe Finder is disabled in ByteSized (lite mode).
 * Food/ingredient selection — the core of the finder — is hidden in lite mode,
 * making the page non-functional. Redirect to the main recipes page instead.
 */
const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

navigateTo(`/g/${groupSlug.value}`, { replace: true });
</script>
