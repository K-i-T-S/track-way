import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/sanity/queries";
import { buildWhatsAppLink } from "@/lib/contact-links";

export default async function BookInstallationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const [t, siteSettings] = await Promise.all([
    getTranslations("bookInstallationStub"),
    getSiteSettings(),
  ]);
  const whatsappLink = buildWhatsAppLink(
    siteSettings.whatsappNumber,
    t("whatsappMessage"),
  );

  return (
    <div className="px-6 py-24">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-muted">{t("body")}</p>
      <a
        href={whatsappLink}
        className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-bold text-background"
      >
        {t("whatsappCta")}
      </a>
    </div>
  );
}
