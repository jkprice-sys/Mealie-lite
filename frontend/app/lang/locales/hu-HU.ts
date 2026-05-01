export default defineI18nLocale(async () => {
  const { default: huHU } = await import("../messages/hu-HU.json");
  return {
    ...huHU,
  };
});
