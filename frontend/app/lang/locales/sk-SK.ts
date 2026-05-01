export default defineI18nLocale(async () => {
  const { default: skSK } = await import("../messages/sk-SK.json");
  return {
    ...skSK,
  };
});
