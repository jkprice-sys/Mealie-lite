export default defineI18nLocale(async () => {
  const { default: jaJP } = await import("../messages/ja-JP.json");
  return {
    ...jaJP,
  };
});
