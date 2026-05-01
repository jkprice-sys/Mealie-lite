export default defineI18nLocale(async () => {
  const { default: ptPT } = await import("../messages/pt-PT.json");
  return {
    ...ptPT,
  };
});
