import type { LocaleObject } from "@nuxtjs/i18n";
import { LOCALES } from "./available-locales";
import { useGlobalI18n } from "../use-global-i18n";

export const useLocales = () => {
  const i18n = useGlobalI18n();

  const locale = computed<LocaleObject["code"]>({
    get: () => i18n.locale.value,
    set(value) {
      i18n.setLocale(value);
    },
  });

  return {
    locale,
    locales: LOCALES,
    i18n,
  };
};
