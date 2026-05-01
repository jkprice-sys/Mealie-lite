export default defineI18nLocale(async () => {
  const { default: afZA } = await import("../messages/af-ZA.json");
  return {
    ...afZA,
  };
});
