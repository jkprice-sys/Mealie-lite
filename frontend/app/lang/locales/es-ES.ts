export default defineI18nLocale(async () => {
  const { default: esES } = await import("../messages/es-ES.json");
  return {
    ...esES,
  };
});
