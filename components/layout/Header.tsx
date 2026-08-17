"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { HeaderLogo } from "@/components/layout/HeaderLogo";

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("nav");
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-border/15 bg-surface/5 text-foreground transition-colors hover:bg-surface/10",
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

interface HeaderProps {
  locale: Locale;
  logoUrl: string;
}

const FALLBACK_LOGO = "/brand/svg/trackway-logo-reversed.svg";
const DEFAULT_BRAND_LOGO = "/brand/svg/trackway-logo-primary-no-tagline.svg";

export function Header({ locale, logoUrl }: HeaderProps): React.ReactElement {
  const logoSrc = logoUrl || FALLBACK_LOGO;
  // The default brand mark is rendered inline (HeaderLogo) so its wordmark
  // can follow the foreground theme token — the static SVG hardcodes white
  // text and loses contrast in light mode (see HeaderLogo.tsx). A custom
  // CMS-provided logoUrl still renders as a plain <Image>, since we can't
  // theme an arbitrary uploaded asset.
  const useInlineBrandLogo = logoSrc === DEFAULT_BRAND_LOGO;
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
          ? "border-b border-border/10 bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link href={`/${locale}`} className="shrink-0">
          {useInlineBrandLogo ? (
            <HeaderLogo />
          ) : (
            <Image src={logoSrc} alt="TrackWay" width={120} height={32} />
          )}
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {t("home")}
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
          <ThemeToggle />
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/15 bg-surface/5 text-foreground transition-colors hover:bg-surface/10 md:hidden"
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
            className="border-b border-border/10 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-6">
              <Link href={`/${locale}`} className={mobileNavLinkClass}>
                {t("home")}
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
              <div className="mt-6 flex items-center gap-3 border-t border-border/10 pt-6 text-sm">
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
                <ThemeToggle className="ms-auto" />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
