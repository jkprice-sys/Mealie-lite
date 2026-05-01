export default defineI18nLocale(async () => {
  const { default: arSA } = await import("../messages/ar-SA.json");
  return {
    ...arSA,
  };
});
