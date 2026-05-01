export default defineI18nLocale(async () => {
  const { default: roRO } = await import("../messages/ro-RO.json");
  return {
    ...roRO,
  };
});
