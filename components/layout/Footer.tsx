import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

interface FooterSiteSettings {
  phoneNumbers: string[];
  whatsappNumber: string;
  email: string;
  socialLinks: { platform: string; url: string }[];
  addressText: string;
  footerText: string;
}

interface FooterProps {
  locale: Locale;
  siteSettings: FooterSiteSettings;
}

export function Footer({
  locale,
  siteSettings,
}: FooterProps): React.ReactElement {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <p className="text-muted">{siteSettings.footerText}</p>
      <p className="mt-2 text-muted">{siteSettings.addressText}</p>
      <p className="mt-2 text-muted">{t("servingLebanon")}</p>
      <div className="mt-4 flex flex-col gap-2">
        {siteSettings.phoneNumbers.map((phone) => (
          <a key={phone} href={`tel:${phone}`}>
            {phone}
          </a>
        ))}
        <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
      </div>
      <div className="mt-4 flex gap-4">
        {siteSettings.socialLinks.map((link) => (
          <a key={link.platform} href={link.url} aria-label={link.platform}>
            {link.platform}
          </a>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">{t("quickLinks")}</p>
      <Link
        href={`/${locale}/privacy`}
        className="mt-2 inline-block text-sm text-muted underline"
      >
        {t("privacyPolicy")}
      </Link>
    </footer>
  );
}
