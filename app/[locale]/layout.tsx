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
    <html lang={typedLocale} dir={dir}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
              email: siteSettings.email,
              socialLinks: siteSettings.socialLinks,
              addressText: getLocalized(siteSettings.address, typedLocale),
              footerText: getLocalized(siteSettings.footerText, typedLocale),
            }}
          />
          <WhatsAppButton phoneNumber={siteSettings.whatsappNumber} />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
