export default defineI18nLocale(async () => {
  const { default: glES } = await import("../messages/gl-ES.json");
  return {
    ...glES,
  };
});
