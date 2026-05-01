export default defineI18nLocale(async () => {
  const { default: daDK } = await import("../messages/da-DK.json");
  return {
    ...daDK,
  };
});
