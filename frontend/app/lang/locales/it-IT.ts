export default defineI18nLocale(async () => {
  const { default: itIT } = await import("../messages/it-IT.json");
  return {
    ...itIT,
  };
});
