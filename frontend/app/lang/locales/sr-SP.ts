export default defineI18nLocale(async () => {
  const { default: srSP } = await import("../messages/sr-SP.json");
  return {
    ...srSP,
  };
});
