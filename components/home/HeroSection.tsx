"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Radio, ArrowRight, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { Button } from "@/components/ui/Button";

const GlobeHeroBackground = dynamic(
  () =>
    import("@/components/home/GlobeHeroBackground").then(
      (mod) => mod.GlobeHeroBackground,
    ),
  { ssr: false },
);

interface HeroSectionProps {
  locale: Locale;
  headline: string;
  subheadline: string;
}

export function HeroSection({
  locale,
  headline,
  subheadline,
}: HeroSectionProps): React.ReactElement {
  const t = useTranslations("homepage");
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={trackRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* GlobeHeroBackground must stay a direct child of this <section>, never nested
          inside a motion.* element — a CSS transform on an ancestor would break the
          `position: fixed` it switches to for the post-hero ambient phase. GSAP's
          own ScrollTrigger `pin: true` (set up inside GlobeHeroBackground, pinning
          this <section> itself) handles holding the whole hero on screen for the
          scroll-driven globe animation — no extra CSS height or position:sticky
          needed here, so the section is just a plain min-h-[100svh] block. */}
      <GlobeHeroBackground trackRef={trackRef} />

      <DotGridBackground variant="world" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-accentWarm/10 blur-[120px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-32 lg:grid-cols-2 lg:px-10">
        <div className="text-center lg:text-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent"
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {t("heroBadge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted lg:mx-0"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
          >
            <Button
              href={`/${locale}/book-installation`}
              variant="primary"
              iconTrailing={
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              }
            >
              {t("heroCtaPrimary")}
            </Button>
            <Button
              href="#how-it-works"
              external
              variant="secondary"
              iconLeading={
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
              }
            >
              {t("heroCtaSecondary")}
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative mx-auto h-[340px] w-[340px] sm:h-[420px] sm:w-[420px] lg:h-[500px] lg:w-[500px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest">
            {t("scrollHint")}
          </span>
          <div className="h-8 w-5 rounded-full border border-white/20 p-1">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
