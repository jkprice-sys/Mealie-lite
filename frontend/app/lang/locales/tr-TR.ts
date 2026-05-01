export default defineI18nLocale(async () => {
  const { default: trTR } = await import("../messages/tr-TR.json");
  return {
    ...trTR,
  };
});
