export const useLiteMode = (): boolean => {
  const config = useRuntimeConfig();
  return config.public.LITE_MODE as boolean;
};
