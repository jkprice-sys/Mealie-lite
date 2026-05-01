export default defineI18nLocale(async () => {
  const { default: elGR } = await import("../messages/el-GR.json");
  return {
    ...elGR,
  };
});
