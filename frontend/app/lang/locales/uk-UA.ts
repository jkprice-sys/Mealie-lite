export default defineI18nLocale(async () => {
  const { default: ukUA } = await import("../messages/uk-UA.json");
  return {
    ...ukUA,
  };
});
