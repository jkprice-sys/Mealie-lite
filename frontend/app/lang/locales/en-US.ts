// File was already correctly named
export default defineI18nLocale(async () => {
  const { default: enUS } = await import("../messages/en-US.json");
  return {
    ...enUS,
  };
});
