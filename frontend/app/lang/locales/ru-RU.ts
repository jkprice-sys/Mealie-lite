export default defineI18nLocale(async () => {
  const { default: ruRU } = await import("../messages/ru-RU.json");
  return {
    ...ruRU,
  };
});
