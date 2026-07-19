import { getSiteSettings } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import { ContactForm } from "@/components/ui/ContactForm";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const siteSettings = await getSiteSettings();

  return (
    <section className="px-6 py-24">
      <p className="text-muted">
        {getLocalized(siteSettings.address, typedLocale)}
      </p>
      <div className="mt-2 flex flex-col gap-1">
        {siteSettings.phoneNumbers.map((phone) => (
          <a key={phone} href={`tel:${phone}`}>
            {phone}
          </a>
        ))}
        <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
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
          email={siteSettings.email}
        />
      </div>
    </section>
  );
}
