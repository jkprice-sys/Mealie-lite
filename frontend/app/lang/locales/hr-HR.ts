export default defineI18nLocale(async () => {
  const { default: hrHR } = await import("../messages/hr-HR.json");
  return {
    ...hrHR,
  };
});
