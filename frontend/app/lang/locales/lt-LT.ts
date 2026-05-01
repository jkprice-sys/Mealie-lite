export default defineI18nLocale(async () => {
  const { default: ltLT } = await import("../messages/lt-LT.json");
  return {
    ...ltLT,
  };
});
