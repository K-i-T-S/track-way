import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/sanity/queries";
import type { Locale } from "@/i18n/routing";
import { BookingForm } from "@/components/ui/BookingForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("booking");
  return {
    title: t("pageTitle"),
    alternates: {
      canonical: `/${locale}/book-installation`,
    },
  };
}

export default async function BookInstallationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const [t, siteSettings] = await Promise.all([
    getTranslations("booking"),
    getSiteSettings(),
  ]);

  return (
    <div className="px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-foreground">{t("pageTitle")}</h1>
        <p className="mt-3 max-w-xl text-muted">{t("pageIntro")}</p>

        <div className="mt-12">
          <BookingForm
            whatsappNumber={siteSettings.whatsappNumber}
            locale={typedLocale}
          />
        </div>
      </div>
    </div>
  );
}
