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
    <section className="relative px-6 py-20 lg:px-10">
      {/* this section had zero ambient glow of its own — every neighboring
          section has one, so its card sat on flat black */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-16 right-1/4 h-72 w-72 rounded-full bg-accent/8 blur-[110px]" />
        <div className="absolute -bottom-16 left-1/5 h-72 w-72 rounded-full bg-accentWarm/8 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* holographic card wrapper */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/[0.14] p-10 sm:p-12"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
          }}
        >
          {/* large watermark mark — fills the otherwise-empty card space */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            className="pointer-events-none absolute -right-10 -top-14 h-64 w-64 text-accent/[0.08] sm:h-72 sm:w-72"
          >
            <path d="M12 2C8 2 5 5.5 5 9.5c0 5.5 7 12.5 7 12.5s7-7 7-12.5C19 5.5 16 2 12 2z" />
            <circle cx="12" cy="9.5" r="3" />
          </svg>

          {/* scanlines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,212,0.5) 2px, rgba(0,229,212,0.5) 3px)",
              animation: "scanline-scroll 8s linear infinite",
            }}
          />

          {/* holographic gradient sweep — accent / accentWarm / ice only, no indigo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              background:
                "linear-gradient(105deg, transparent 20%, rgba(0,229,212,0.3) 40%, rgba(244,255,254,0.3) 50%, rgba(255,200,87,0.3) 60%, transparent 80%)",
              animation: "holo-sweep 4s ease-in-out infinite",
            }}
          />

          {/* corner accents */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-14 w-14 rounded-tl-3xl border-l border-t border-accent/40"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-14 w-14 rounded-tr-3xl border-r border-t border-accent/40"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-14 w-14 rounded-bl-3xl border-b border-l border-accent/40"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 rounded-br-3xl border-b border-r border-accent/40"
            aria-hidden="true"
          />

          {/* floating particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-accent/60"
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
            className="relative max-w-xl text-xl leading-relaxed text-foreground/85"
          >
            {body}
          </motion.p>

          {/* decorative label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent"
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
