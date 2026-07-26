"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface AboutTeaserSectionProps {
  body: string;
}

export function AboutTeaserSection({
  body,
}: AboutTeaserSectionProps): React.ReactElement {
  const t = useTranslations("homepage");

  return (
    <section className="relative px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-3xl">
        {/* holographic card wrapper */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 p-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          }}
        >
          {/* scanlines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,212,0.5) 2px, rgba(0,229,212,0.5) 3px)",
              animation: "scanline-scroll 8s linear infinite",
            }}
          />

          {/* holographic gradient sweep — accent / accentWarm / ice only, no indigo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              background:
                "linear-gradient(105deg, transparent 20%, rgba(0,229,212,0.3) 40%, rgba(244,255,254,0.3) 50%, rgba(251,146,60,0.3) 60%, transparent 80%)",
              animation: "holo-sweep 4s ease-in-out infinite",
            }}
          />

          {/* corner accents */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l border-t border-accent/30"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r border-t border-accent/30"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b border-l border-accent/30"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b border-r border-accent/30"
            aria-hidden="true"
          />

          {/* floating particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-accent/40"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `holo-particle ${3 + i * 0.5}s ease-in-out ${i * -1.2}s infinite`,
              }}
            />
          ))}

          {/* text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative text-lg leading-relaxed text-muted"
          >
            {body}
          </motion.p>

          {/* decorative label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            {t("aboutBadge")}
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanline-scroll {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 100px;
          }
        }
        @keyframes holo-sweep {
          0%,
          100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        @keyframes holo-particle {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-12px) scale(1.3);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  );
}
