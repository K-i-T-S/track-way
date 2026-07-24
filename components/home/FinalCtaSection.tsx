"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

interface FinalCtaSectionProps {
  locale: Locale;
  body: string;
}

export function FinalCtaSection({
  locale,
  body,
}: FinalCtaSectionProps): React.ReactElement {
  const t = useTranslations("homepage");

  return (
    <section className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]"
      />

      <div className="relative mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-8 py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {t("finalCtaTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-4 max-w-md text-muted"
        >
          {body}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href={`/${locale}/book-installation`}
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-background shadow-lg shadow-accent/25 transition-transform hover:scale-105"
          >
            {t("finalCtaPrimary")}
            <ArrowRight
              className="h-4 w-4 transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
          >
            {t("finalCtaSecondary")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
