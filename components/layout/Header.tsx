"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  locale: Locale;
  logoUrl: string;
}

const FALLBACK_LOGO = "/brand/svg/trackway-logo-reversed.svg";

export function Header({ locale, logoUrl }: HeaderProps): React.ReactElement {
  const logoSrc = logoUrl || FALLBACK_LOGO;
  const t = useTranslations("nav");
  const pathnameWithoutLocale = usePathname();
  const enHref = `/en${pathnameWithoutLocale}`;
  const arHref = `/ar${pathnameWithoutLocale}`;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change and disable body scroll while open.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathnameWithoutLocale]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const mobileNavLinkClass =
    "text-lg font-medium text-foreground transition-colors hover:text-accent";

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
        <div className="flex shrink-0 items-center gap-3">
          <Button
            href={`/${locale}/book-installation`}
            variant="primary"
            size="sm"
          >
            {t("bookInstallation")}
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground transition-colors hover:bg-white/10 md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-b border-white/10 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-6">
              <Link href={`/${locale}`} className={mobileNavLinkClass}>
                {t("home")}
              </Link>
              <Link
                href={`/${locale}/hardware`}
                className={cn(mobileNavLinkClass, "mt-4")}
              >
                {t("hardware")}
              </Link>
              <Link
                href={`/${locale}/about`}
                className={cn(mobileNavLinkClass, "mt-4")}
              >
                {t("about")}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className={cn(mobileNavLinkClass, "mt-4")}
              >
                {t("contactCta")}
              </Link>
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6 text-sm">
                {locale === "en" ? (
                  <span
                    className="font-bold text-foreground"
                    aria-current="true"
                  >
                    EN
                  </span>
                ) : (
                  <Link
                    href={enHref}
                    className="text-muted hover:text-foreground"
                  >
                    EN
                  </Link>
                )}
                <span aria-hidden="true" className="text-muted">
                  |
                </span>
                {locale === "ar" ? (
                  <span
                    className="font-bold text-foreground"
                    aria-current="true"
                  >
                    العربية
                  </span>
                ) : (
                  <Link
                    href={arHref}
                    className="text-muted hover:text-foreground"
                  >
                    العربية
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
