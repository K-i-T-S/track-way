import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // Always open in English regardless of browser/OS language (common to be
  // set to Arabic across Lebanon/MENA) — visitors can still switch to /ar.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
