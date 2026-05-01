export default defineI18nLocale(async () => {
  const { default: lvLV } = await import("../messages/lv-LV.json");
  return {
    ...lvLV,
  };
});
