export default defineI18nLocale(async () => {
  const { default: zhTW } = await import("../messages/zh-TW.json");
  return {
    ...zhTW,
  };
});
