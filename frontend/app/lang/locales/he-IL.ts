export default defineI18nLocale(async () => {
  const { default: heIL } = await import("../messages/he-IL.json");
  return {
    ...heIL,
  };
});
