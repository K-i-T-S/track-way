"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface HeaderProps {
  locale: Locale;
  logoUrl: string;
}

const FALLBACK_LOGO = "/brand/svg/trackway-logo-primary-no-tagline.svg";

export function Header({ locale, logoUrl }: HeaderProps): React.ReactElement {
  const logoSrc = logoUrl || FALLBACK_LOGO;
  const t = useTranslations("nav");
  const pathnameWithoutLocale = usePathname();
  const enHref = `/en${pathnameWithoutLocale}`;
  const arHref = `/ar${pathnameWithoutLocale}`;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-white/10 bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link href={`/${locale}`} className="shrink-0">
          <Image src={logoSrc} alt="TrackWay" width={120} height={32} />
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("home")}
          </Link>
          <Link
            href={`/${locale}/hardware`}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("hardware")}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("about")}
          </Link>
          <div
            className="flex items-center gap-2 text-sm"
            aria-label="Language selector"
          >
            {locale === "en" ? (
              <span className="font-bold text-foreground" aria-current="true">
                EN
              </span>
            ) : (
              <Link href={enHref} className="text-muted hover:text-foreground">
                EN
              </Link>
            )}
            <span aria-hidden="true" className="text-muted">
              |
            </span>
            {locale === "ar" ? (
              <span className="font-bold text-foreground" aria-current="true">
                العربية
              </span>
            ) : (
              <Link href={arHref} className="text-muted hover:text-foreground">
                العربية
              </Link>
            )}
          </div>
          <Link
            href={`/${locale}/contact`}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("contactCta")}
          </Link>
        </div>
        <Link
          href={`/${locale}/book-installation`}
          className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-background shadow-lg shadow-accent/20 transition-transform hover:scale-105"
        >
          {t("bookInstallation")}
        </Link>
      </nav>
    </motion.header>
  );
}
