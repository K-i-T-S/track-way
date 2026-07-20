import type { Locale } from "@/i18n/routing";
import type { LocalizedString } from "@/sanity/types";

export function getLocalized(field: LocalizedString, locale: Locale): string {
  return field[locale] || field.en;
}
