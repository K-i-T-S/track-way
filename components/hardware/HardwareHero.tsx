"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const NODES = [
  { x: 15, y: 25, size: 6, delay: 0 },
  { x: 85, y: 30, size: 4, delay: -2 },
  { x: 70, y: 70, size: 5, delay: -4 },
  { x: 25, y: 75, size: 4, delay: -1 },
  { x: 50, y: 20, size: 3, delay: -3 },
  { x: 90, y: 60, size: 5, delay: -5 },
];

export function HardwareHero(): React.ReactElement {
  const t = useTranslations("hardware");

  return (
    <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-6 py-20">
      {/* ── background layers ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,229,212,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,212,1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-accentWarm/5 blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-accent/5 blur-[80px]" />
      </div>

      {/* ── floating circuit nodes ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {NODES.map((node, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/30 motion-safe:animate-[hw-node-pulse_var(--hw-node-duration)_ease-in-out_var(--hw-node-delay)_infinite]"
            style={
              {
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: node.size,
                height: node.size,
                "--hw-node-duration": `${3 + i * 0.5}s`,
                "--hw-node-delay": `${node.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* ── content ── */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          {t("heroBadge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 bg-gradient-to-r from-foreground to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl"
        >
          {t("heroTitle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-4 max-w-xl text-muted"
        >
          {t("heroSubtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-accent/50 to-transparent"
        />
      </div>

      <style jsx global>{`
        @keyframes hw-node-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5);
          }
        }
      `}</style>
    </section>
  );
}
