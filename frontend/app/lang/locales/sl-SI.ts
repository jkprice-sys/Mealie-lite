export default defineI18nLocale(async () => {
  const { default: slSI } = await import("../messages/sl-SI.json");
  return {
    ...slSI,
  };
});
