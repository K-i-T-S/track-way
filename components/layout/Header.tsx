"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface HeaderProps {
  locale: Locale;
  logoUrl: string;
}

export function Header({ locale, logoUrl }: HeaderProps): React.ReactElement {
  const t = useTranslations("nav");
  const pathnameWithoutLocale = usePathname();
  const enHref = `/en${pathnameWithoutLocale}`;
  const arHref = `/ar${pathnameWithoutLocale}`;

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href={`/${locale}`}>
        <Image src={logoUrl} alt="TrackWay" width={120} height={32} />
      </Link>
      <nav className="flex items-center gap-6">
        <Link href={`/${locale}`}>{t("home")}</Link>
        <Link href={`/${locale}/hardware`}>{t("hardware")}</Link>
        <Link href={`/${locale}/about`}>{t("about")}</Link>
        <div
          className="flex items-center gap-2 text-sm"
          aria-label="Language selector"
        >
          {locale === "en" ? (
            <span className="font-bold text-foreground" aria-current="true">
              EN
            </span>
          ) : (
            <Link href={enHref}>EN</Link>
          )}
          <span aria-hidden="true" className="text-muted">
            |
          </span>
          {locale === "ar" ? (
            <span className="font-bold text-foreground" aria-current="true">
              العربية
            </span>
          ) : (
            <Link href={arHref}>العربية</Link>
          )}
        </div>
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
