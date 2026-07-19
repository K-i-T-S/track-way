import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { routing, type Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

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
  const pathname = (await headers()).get("x-pathname") ?? `/${typedLocale}`;

  return (
    <html lang={typedLocale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header
            locale={typedLocale}
            pathname={pathname}
            logoUrl={siteSettings.logoUrl}
          />
          <main>{children}</main>
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
      </body>
    </html>
  );
}
