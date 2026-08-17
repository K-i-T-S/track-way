"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/* Source icons are opaque 1024x1024 tiles with a near-black background
   baked in (no alpha channel) — cropped to a circle here so the dark square
   corners don't show as a visible edge against the colored badge behind
   them; without this they read as flat dark squares that nearly disappear
   into the page. */
function stepImage(src: string, key: string) {
  return (
    <Image
      key={key}
      src={src}
      alt=""
      aria-hidden="true"
      width={44}
      height={44}
      className="h-11 w-11 rounded-full object-cover"
    />
  );
}

const STEP_ICONS = [
  stepImage("/images/step-submit.png", "submit"),
  stepImage("/images/step-communication.png", "communication"),
  stepImage("/images/step-confirm.png", "confirm"),
];

/* Rotated across the three steps so the row doesn't read as a single flat
   teal block — same trio used by CoreValueSection's RING_COLORS. */
const STEP_COLORS = ["#00E5D4", "#FFC857", "#F4FFFE"] as const;

export function HowItWorksSection(): React.ReactElement {
  const t = useTranslations("homepage");

  const steps = [
    { title: t("howItWorksStep1Title"), desc: t("howItWorksStep1Desc") },
    { title: t("howItWorksStep2Title"), desc: t("howItWorksStep2Desc") },
    { title: t("howItWorksStep3Title"), desc: t("howItWorksStep3Desc") },
  ];

  return (
    <section id="how-it-works" className="relative px-6 py-24 lg:px-10">
      {/* ambient glow — dual-tone, brighter and tighter than a single wash so it actually reads as light */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -bottom-16 right-[10%] h-96 w-96 rounded-full bg-accentWarm/10 blur-[100px]" />
        <div className="absolute -top-10 left-[8%] h-64 w-64 rounded-full bg-trackway-ice/[0.06] blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t("howItWorksEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("howItWorksTitle")}
          </h2>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {/* connecting line between cards, desktop only */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[52px] hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, #00E5D466 16%, #FFC85766 50%, #F4FFFE66 84%, transparent)",
            }}
          />

          {steps.map((step, i) => {
            const color = STEP_COLORS[i % STEP_COLORS.length]!;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative overflow-hidden rounded-2xl border border-border/[0.14] bg-surface/[0.06] p-8 backdrop-blur transition-colors duration-500 hover:[border-color:var(--step-border)]"
                style={{ "--step-border": `${color}4d` } as React.CSSProperties}
              >
                {/* hover glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(300px circle at 50% 0%, ${color}1f, transparent 70%)`,
                  }}
                />

                <div className="relative mb-5 flex items-center gap-4">
                  {/* Fixed black, not the theme-aware `text-background`: this
                      badge's fill is always one of STEP_COLORS (a fixed
                      bright teal/gold/ice, unrelated to theme), and the
                      "ice" step is near-white -- `text-background` would go
                      near-white too in light mode and disappear on it. */}
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-trackway-black"
                    style={{
                      background: color,
                      boxShadow: `0 0 30px ${color}4d`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: `${color}40`,
                      background: `${color}14`,
                      animation: `step-icon-float 3s ease-in-out ${i * 0.5}s infinite`,
                    }}
                  >
                    {STEP_ICONS[i]}
                  </span>
                </div>

                <h3 className="relative text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm text-muted">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="relative mx-auto mt-8 max-w-2xl rounded-xl border border-border/10 bg-surface/[0.03] px-5 py-3 text-center text-sm text-muted">
          {t("howItWorksNotice")}
        </div>
      </div>

      <style jsx global>{`
        @keyframes step-icon-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </section>
  );
}
