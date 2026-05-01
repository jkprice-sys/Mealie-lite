export default defineI18nLocale(async () => {
  const { default: etEE } = await import("../messages/et-EE.json");
  return {
    ...etEE,
  };
});
