export default defineI18nLocale(async () => {
  const { default: koKR } = await import("../messages/ko-KR.json");
  return {
    ...koKR,
  };
});
