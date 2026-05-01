export default defineI18nLocale(async () => {
  const { default: enGB } = await import("../messages/en-GB.json");
  return {
    ...enGB,
  };
});
