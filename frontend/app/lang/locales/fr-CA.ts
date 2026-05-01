export default defineI18nLocale(async () => {
  const { default: frCA } = await import("../messages/fr-CA.json");
  return {
    ...frCA,
  };
});
