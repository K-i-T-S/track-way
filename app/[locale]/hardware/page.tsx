import type { Metadata } from "next";
import { getHardwareProducts, getSiteSettings } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import { HardwareCard } from "@/components/ui/HardwareCard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "GPS Hardware — TrackWay",
    description:
      "Explore TrackWay’s GPS tracking hardware for fleets and individuals.",
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
    <section className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-3">
      {products.map((product) => (
        <HardwareCard
          key={product._id}
          name={getLocalized(product.name, typedLocale)}
          description={getLocalized(product.description, typedLocale)}
          images={product.images}
          specs={product.specs.map((spec) => ({
            label: getLocalized(spec.label, typedLocale),
            value: getLocalized(spec.value, typedLocale),
          }))}
          whatsappNumber={siteSettings.whatsappNumber}
          requestQuoteLabel={t("requestQuote")}
        />
      ))}
    </section>
  );
}
