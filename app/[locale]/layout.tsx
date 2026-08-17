import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ScrollProgressBar } from "@/components/home/ScrollProgressBar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

/* Blocking (non-async) so it runs before first paint: reads the persisted
   theme choice and sets data-theme="dark" on <html> before hydration, so a
   returning dark-mode visitor never sees a flash of the light default.
   Light needs no attribute -- it's the :root default in globals.css. */
const NO_FLASH_THEME_SCRIPT = `(function(){try{if(localStorage.getItem("trackway-theme")==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  const typedLocale = locale as Locale;

  const messages = await getMessages();
  const dir = typedLocale === "ar" ? "rtl" : "ltr";
  const siteSettings = await getSiteSettings();

  return (
    <html
      lang={typedLocale}
      dir={dir}
      // The no-flash theme script (NO_FLASH_THEME_SCRIPT) sets data-theme
      // on this element before hydration, deliberately out of band from
      // server-rendered markup -- the standard, sanctioned pattern for
      // this kind of pre-hydration theme script (also used by next-themes)
      // to avoid a hydration-mismatch warning for that one attribute.
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run
            synchronously, before first paint, to avoid a flash of the wrong
            theme; see NO_FLASH_THEME_SCRIPT above. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>
        {/* Dedicated portal target for GlobeHeroBackground's ambient layer.
            Must stay the very first child of <body> — React portals append
            to their target in DOM order, and CSS stacking ties (e.g. against
            a transformed/pinned section elsewhere on the page) are broken by
            DOM order, later wins. Keeping this node first guarantees the
            ambient globe always loses that tiebreak and renders behind the
            rest of the page, regardless of where else it briefly outranks
            in z-index. */}
        <div id="ambient-bg-root" />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <ScrollProgressBar />
            <Header
              locale={typedLocale}
              logoUrl="/brand/svg/trackway-logo-primary-no-tagline.svg"
            />
            <main className="pt-20">{children}</main>
            <Footer
              locale={typedLocale}
              siteSettings={{
                phoneNumbers: siteSettings.phoneNumbers,
                whatsappNumber: siteSettings.whatsappNumber,
                emails: siteSettings.emails,
                socialLinks: siteSettings.socialLinks,
                addressText: getLocalized(siteSettings.address, typedLocale),
                footerText: getLocalized(siteSettings.footerText, typedLocale),
              }}
            />
            <WhatsAppButton phoneNumber={siteSettings.whatsappNumber} />
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
