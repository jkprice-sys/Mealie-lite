export default defineI18nLocale(async () => {
  const { default: caES } = await import("../messages/ca-ES.json");
  return {
    ...caES,
  };
});
