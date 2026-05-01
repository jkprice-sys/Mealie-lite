export default defineI18nLocale(async () => {
  const { default: nlNL } = await import("../messages/nl-NL.json");
  return {
    ...nlNL,
  };
});
