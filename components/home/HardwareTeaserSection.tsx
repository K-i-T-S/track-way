"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

const HW_PARTICLES = [
  { color: "#00E5D4", left: "-6%", top: "20%", duration: 5, delay: 0 },
  { color: "#FFC857", left: "104%", top: "60%", duration: 6, delay: -1.5 },
  { color: "#F4FFFE", left: "50%", top: "-8%", duration: 7, delay: -3 },
] as const;

export function HardwareTeaserSection({
  locale,
}: {
  locale: Locale;
}): React.ReactElement {
  const t = useTranslations("home");

  return (
    <section className="relative px-6 py-20 lg:px-10">
      {/* ambient glow field — this section previously had no background
          atmosphere at all, reading flat next to the sections above/below it */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-accentWarm/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
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
              className="relative flex h-44 w-44 items-center justify-center rounded-2xl border border-accent/20 bg-gradient-to-br from-white/[0.1] to-white/[0.03] backdrop-blur-sm"
              style={{
                transformStyle: "preserve-3d",
                boxShadow:
                  "0 20px 70px rgba(0,229,212,0.2), 0 0 0 1px rgba(0,229,212,0.12) inset",
              }}
            >
              {/* ambient border-trace ring — a single instance here, unlike
                  the per-button trace ring, so it can safely run always-on
                  instead of hover-only */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="calc(100% - 1.5px)"
                  height="calc(100% - 1.5px)"
                  rx="16"
                  fill="none"
                  stroke="url(#hwTraceGradient)"
                  strokeWidth="1.5"
                  strokeDasharray="60 400"
                  strokeLinecap="round"
                  className="motion-safe:animate-[hw-border-trace_6s_linear_infinite]"
                />
                <defs>
                  <linearGradient
                    id="hwTraceGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00E5D4" />
                    <stop offset="100%" stopColor="#FFC857" />
                  </linearGradient>
                </defs>
              </svg>

              {/* device icon */}
              <svg
                width="80"
                height="80"
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

              {/* floating label — pulses teal/gold instead of a flat single hue */}
              <div
                className="absolute -right-3 -top-3 rounded-full border border-accent/30 bg-background/90 px-2.5 py-1 text-xs font-bold text-accent backdrop-blur-sm motion-safe:animate-[hw-badge-pulse_3s_ease-in-out_infinite]"
                style={{ transform: "translateZ(40px)" }}
              >
                GPS
              </div>

              {/* ambient floating particles */}
              {HW_PARTICLES.map((p, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                  style={{
                    background: p.color,
                    left: p.left,
                    top: p.top,
                    animation: `hw-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                  }}
                />
              ))}
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
              <Button
                href={`/${locale}/hardware`}
                variant="link"
                className="mt-4"
                iconTrailing={
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
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                }
              >
                {t("viewHardwareCta")}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes hw-badge-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 229, 212, 0.4);
            border-color: rgba(0, 229, 212, 0.3);
            color: #00e5d4;
          }
          50% {
            box-shadow: 0 0 0 6px rgba(255, 200, 87, 0);
            border-color: rgba(255, 200, 87, 0.3);
            color: #ffc857;
          }
        }
        @keyframes hw-border-trace {
          to {
            stroke-dashoffset: -460;
          }
        }
        @keyframes hw-particle-float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-10px) scale(1.4);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  );
}
