import type { Metadata } from "next";
import { getHardwareProducts, getSiteSettings } from "@/sanity/queries";
import type { Locale } from "@/i18n/routing";
import { HardwareHero } from "@/components/hardware/HardwareHero";
import { HardwareProductShowcase } from "@/components/hardware/HardwareProductShowcase";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("hardware");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function HardwarePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;

  const [products, siteSettings, t] = await Promise.all([
    getHardwareProducts(),
    getSiteSettings(),
    getTranslations("hardware"),
  ]);

  return (
    <div className="relative">
      <HardwareHero />
      <HardwareProductShowcase
        products={products}
        locale={typedLocale}
        whatsappNumber={siteSettings.whatsappNumber}
        requestQuoteLabel={t("requestQuote")}
      />
    </div>
  );
}
