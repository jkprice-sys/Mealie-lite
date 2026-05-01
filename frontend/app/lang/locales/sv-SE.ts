export default defineI18nLocale(async () => {
  const { default: svSE } = await import("../messages/sv-SE.json");
  return {
    ...svSE,
  };
});
