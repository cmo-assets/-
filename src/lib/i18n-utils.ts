import type { AppLocale } from "@/i18n/routing";

/** Picks the Arabic or English column of a bilingual DB row. */
export function localized(locale: AppLocale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

const currencyFormatters: Partial<Record<AppLocale, Intl.NumberFormat>> = {};

export function formatSar(locale: AppLocale, amount: number) {
  const formatter = (currencyFormatters[locale] ??= new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-SA",
    { style: "currency", currency: "SAR", maximumFractionDigits: 0 },
  ));
  return formatter.format(amount);
}
