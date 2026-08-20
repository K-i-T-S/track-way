import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://track-way.com";

// Every public, indexable route. Keep in sync with app/[locale]/*/page.tsx —
// there's no route group scan here, this list is the source of truth.
const ROUTES = [
  "",
  "/about",
  "/hardware",
  "/contact",
  "/book-installation",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${BASE_URL}/${routing.defaultLocale}${route}`,
    alternates: {
      languages: {
        ...Object.fromEntries(
          routing.locales.map((locale) => [
            locale,
            `${BASE_URL}/${locale}${route}`,
          ]),
        ),
        // Matches the x-default hreflang already sent via HTTP header on
        // every page: the locale-less URL redirects to the default locale.
        "x-default": `${BASE_URL}${route || "/"}`,
      },
    },
  }));
}
