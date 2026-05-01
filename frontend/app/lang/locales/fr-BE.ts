export default defineI18nLocale(async () => {
  const { default: frBE } = await import("../messages/fr-BE.json");
  return {
    ...frBE,
  };
});
