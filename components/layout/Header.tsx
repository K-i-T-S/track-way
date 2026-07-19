import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

interface HeaderProps {
  locale: Locale;
  pathname: string;
  logoUrl: string;
}

export function Header({
  locale,
  pathname,
  logoUrl,
}: HeaderProps): React.ReactElement {
  const t = useTranslations("nav");
  const otherLocale: Locale = locale === "en" ? "ar" : "en";
  const restOfPath = pathname.replace(new RegExp(`^/${locale}`), "") || "";
  const switcherHref = `/${otherLocale}${restOfPath}`;
  const switcherLabel = otherLocale === "ar" ? "العربية" : "English";

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href={`/${locale}`}>
        <Image src={logoUrl} alt="TrackWay" width={120} height={32} />
      </Link>
      <nav className="flex items-center gap-6">
        <Link href={`/${locale}`}>{t("home")}</Link>
        <Link href={`/${locale}/hardware`}>{t("hardware")}</Link>
        <Link href={`/${locale}/about`}>{t("about")}</Link>
        <Link href={switcherHref}>{switcherLabel}</Link>
        <Link
          href={`/${locale}/contact`}
          className="rounded-full bg-accent px-4 py-2 font-bold text-background"
        >
          {t("contactCta")}
        </Link>
      </nav>
    </header>
  );
}
