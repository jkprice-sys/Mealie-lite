export default defineI18nLocale(async () => {
  const { default: frFR } = await import("../messages/fr-FR.json");
  return {
    ...frFR,
  };
});
