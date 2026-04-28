export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig();
  if (!config.public.LITE_MODE) return;

  const auth = useMealieAuth();
  const groupSlug = auth.user.value?.groupSlug;
  return navigateTo(`/g/${groupSlug}`);
});
