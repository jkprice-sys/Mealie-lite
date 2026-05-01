export default defineI18nLocale(async () => {
  const { default: ptBR } = await import("../messages/pt-BR.json");
  return {
    ...ptBR,
  };
});
