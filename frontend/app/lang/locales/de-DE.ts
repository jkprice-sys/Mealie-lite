export default defineI18nLocale(async () => {
  const { default: deDE } = await import("../messages/de-DE.json");
  return {
    ...deDE,
  };
});
