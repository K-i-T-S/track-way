"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

/* ─── brand-only orbit palette (teal / warm gold / neutral ice) ─── */
const ORBIT_PARTICLES = [
  { size: 6, orbit: 200, speed: 10, color: "#00E5D4" },
  { size: 4, orbit: 300, speed: 14, color: "#FFC857" },
  { size: 5, orbit: 140, speed: 8, color: "#F4FFFE" },
  { size: 3, orbit: 250, speed: 18, color: "#00E5D4" },
];

interface FinalCtaSectionProps {
  locale: Locale;
  body: string;
}

export function FinalCtaSection({
  locale,
  body,
}: FinalCtaSectionProps): React.ReactElement {
  const t = useTranslations("homepage");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-24 lg:px-10">
      {/* ── portal rings (decorative) ── */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[140px]" />

        {[500, 380, 260, 160].map((size, i) => (
          <div
            key={size}
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderColor: `rgba(0,229,212,${0.08 - i * 0.015})`,
              transform: visible ? "scale(1)" : "scale(0.3)",
              opacity: visible ? 1 : 0,
              transition: `transform 1.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s, opacity 1s ease ${i * 0.12}s`,
              animation: visible
                ? `portal-ring-${i} ${6 + i * 2}s ease-in-out infinite`
                : "none",
            }}
          />
        ))}

        {ORBIT_PARTICLES.map((p, i) => (
          <div
            key={`particle-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: p.orbit * 2,
              height: p.orbit * 2,
              marginLeft: -p.orbit,
              marginTop: -p.orbit,
              opacity: visible ? 1 : 0,
              transition: `opacity 0.8s ease ${0.5 + i * 0.15}s`,
            }}
          >
            <div
              className="absolute rounded-full"
              style={
                {
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 3}px ${p.color}80`,
                  top: "50%",
                  left: 0,
                  marginTop: -p.size / 2,
                  marginLeft: -p.size / 2,
                  "--orbit": `${p.orbit}px`,
                  animation: visible
                    ? `portal-orbit ${p.speed}s linear ${i * -3}s infinite`
                    : "none",
                } as React.CSSProperties
              }
            />
          </div>
        ))}
      </div>

      {/* ── main card ── */}
      <div className="relative mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-8 py-16 text-center backdrop-blur-sm"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(0,229,212,0.1), transparent 60%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,229,212,0.5), transparent)",
            }}
          />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="relative text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("finalCtaTitle")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative mx-auto mt-4 max-w-md text-muted"
          >
            {body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              href={`/${locale}/book-installation`}
              variant="primary"
              iconTrailing={
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              }
            >
              {t("finalCtaPrimary")}
            </Button>
            <Button href={`/${locale}/contact`} variant="secondary">
              {t("finalCtaSecondary")}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes portal-ring-0 {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.05) rotate(3deg);
          }
        }
        @keyframes portal-ring-1 {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(0.97) rotate(-2deg);
          }
        }
        @keyframes portal-ring-2 {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.03) rotate(2deg);
          }
        }
        @keyframes portal-ring-3 {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(0.95) rotate(-3deg);
          }
        }
        @keyframes portal-orbit {
          from {
            transform: rotate(0deg) translateX(var(--orbit, 100px)) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(var(--orbit, 100px))
              rotate(-360deg);
          }
        }
      `}</style>
    </section>
  );
}
