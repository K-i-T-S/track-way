import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import { buildTelLink } from "@/lib/contact-links";
import type { Locale } from "@/i18n/routing";
import { ContactForm } from "@/components/ui/ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("contact");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/contact`,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const [siteSettings, t] = await Promise.all([
    getSiteSettings(),
    getTranslations("contactLabels"),
  ]);

  return (
    <section className="px-6 py-24">
      <p className="text-muted">
        {getLocalized(siteSettings.address, typedLocale)}
      </p>
      <div className="mt-2 flex flex-col gap-1">
        {siteSettings.phoneNumbers.map((phone) => (
          <a key={phone} href={buildTelLink(phone)}>
            {phone}
          </a>
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        <span>
          {t("general")}:{" "}
          <a href={`mailto:${siteSettings.emails.info}`}>
            {siteSettings.emails.info}
          </a>
        </span>
        <span>
          {t("sales")}:{" "}
          <a href={`mailto:${siteSettings.emails.sales}`}>
            {siteSettings.emails.sales}
          </a>
        </span>
        <span>
          {t("support")}:{" "}
          <a href={`mailto:${siteSettings.emails.support}`}>
            {siteSettings.emails.support}
          </a>
        </span>
      </div>
      <div className="mt-2 flex gap-4">
        {siteSettings.socialLinks.map((link) => (
          <a key={link.platform} href={link.url} aria-label={link.platform}>
            {link.platform}
          </a>
        ))}
      </div>
      <div className="mt-8 max-w-md">
        <ContactForm
          whatsappNumber={siteSettings.whatsappNumber}
          email={siteSettings.emails.info}
        />
      </div>
    </section>
  );
}
