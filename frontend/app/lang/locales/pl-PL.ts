export default defineI18nLocale(async () => {
  const { default: plPL } = await import("../messages/pl-PL.json");
  return {
    ...plPL,
  };
});
