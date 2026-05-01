export default defineI18nLocale(async () => {
  const { default: isIS } = await import("../messages/is-IS.json");
  return {
    ...isIS,
  };
});
