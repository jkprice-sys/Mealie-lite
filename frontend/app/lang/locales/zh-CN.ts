export default defineI18nLocale(async () => {
  const { default: zhCN } = await import("../messages/zh-CN.json");
  return {
    ...zhCN,
  };
});
