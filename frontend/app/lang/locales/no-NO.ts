export default defineI18nLocale(async () => {
  const { default: noNO } = await import("../messages/no-NO.json");
  return {
    ...noNO,
  };
});
