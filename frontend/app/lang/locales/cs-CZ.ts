export default defineI18nLocale(async () => {
  const { default: csCZ } = await import("../messages/cs-CZ.json");
  return {
    ...csCZ,
  };
});
