export default defineI18nLocale(async () => {
  const { default: fiFI } = await import("../messages/fi-FI.json");
  return {
    ...fiFI,
  };
});
