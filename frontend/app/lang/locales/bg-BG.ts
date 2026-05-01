export default defineI18nLocale(async () => {
  const { default: bgBG } = await import("../messages/bg-BG.json");
  return {
    ...bgBG,
  };
});
