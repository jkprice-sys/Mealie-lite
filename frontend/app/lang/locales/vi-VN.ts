export default defineI18nLocale(async () => {
  const { default: viVN } = await import("../messages/vi-VN.json");
  return {
    ...viVN,
  };
});
