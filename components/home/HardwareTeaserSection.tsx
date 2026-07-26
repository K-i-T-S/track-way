"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

export function HardwareTeaserSection({
  locale,
}: {
  locale: Locale;
}): React.ReactElement {
  const t = useTranslations("home");

  return (
    <section className="relative px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
          {/* 3D device visualization */}
          <motion.div
            initial={{ opacity: 0, rotateY: -30, rotateX: 15, scale: 0.8 }}
            whileInView={{ opacity: 1, rotateY: -8, rotateX: 5, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
            style={{ perspective: "800px" }}
          >
            <div
              className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-accent/20 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm"
              style={{
                transformStyle: "preserve-3d",
                boxShadow:
                  "0 20px 60px rgba(0,229,212,0.15), 0 0 0 1px rgba(0,229,212,0.1) inset",
              }}
            >
              {/* device icon */}
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="text-accent"
                style={{ transform: "translateZ(30px)" }}
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <path d="M9 1v3" />
                <path d="M15 1v3" />
                <path d="M9 20v3" />
                <path d="M15 20v3" />
                <path d="M20 9h3" />
                <path d="M20 14h3" />
                <path d="M1 9h3" />
                <path d="M1 14h3" />
              </svg>

              {/* glow ring */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-50"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0,229,212,0.15), transparent 70%)",
                }}
              />

              {/* floating label */}
              <div
                className="absolute -right-2 -top-2 rounded-full border border-accent/30 bg-background/90 px-2 py-0.5 text-[10px] font-bold text-accent backdrop-blur-sm motion-safe:animate-[hw-badge-pulse_2s_ease-in-out_infinite]"
                style={{ transform: "translateZ(40px)" }}
              >
                GPS
              </div>
            </div>

            {/* shadow underneath */}
            <div
              aria-hidden="true"
              className="absolute -bottom-4 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-full bg-accent/20 blur-lg"
              style={{ transform: "translateX(-50%) rotateX(80deg)" }}
            />
          </motion.div>

          {/* text + link */}
          <div className="flex-1 text-center sm:text-left">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg text-muted"
            >
              {t("hardwareTeaser")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link
                href={`/${locale}/hardware`}
                className="group mt-4 inline-flex items-center gap-2 text-accent font-bold transition-all hover:gap-3"
              >
                {t("viewHardwareCta")}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes hw-badge-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 229, 212, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(0, 229, 212, 0);
          }
        }
      `}</style>
    </section>
  );
}
