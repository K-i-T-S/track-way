"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";

export function HowItWorksSection(): React.ReactElement {
  const t = useTranslations("homepage");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const pathLength = useTransform(scrollYProgress, [0.05, 0.95], [0, 1]);
  const truckTop = useTransform(scrollYProgress, [0.05, 0.95], ["2%", "94%"]);

  const steps = [
    { title: t("howItWorksStep1Title"), desc: t("howItWorksStep1Desc") },
    { title: t("howItWorksStep2Title"), desc: t("howItWorksStep2Desc") },
    { title: t("howItWorksStep3Title"), desc: t("howItWorksStep3Desc") },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative px-6 py-24 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t("howItWorksEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("howItWorksTitle")}
          </h2>
          <p className="mt-4 text-sm text-muted">{t("howItWorksNotice")}</p>
        </div>

        <div className="relative mt-20 grid grid-cols-1 gap-y-16 lg:grid-cols-[80px_1fr]">
          <div className="relative hidden lg:block">
            <svg
              aria-hidden="true"
              width="80"
              height="100%"
              viewBox="0 0 80 600"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <path
                d="M40 0 V600"
                stroke="rgba(160,160,160,0.15)"
                strokeWidth="3"
                fill="none"
              />
              <motion.path
                d="M40 0 V600"
                stroke="url(#trackGradient)"
                strokeWidth="3"
                fill="none"
                style={{ pathLength }}
              />
              <defs>
                <linearGradient id="trackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5D4" />
                  <stop offset="100%" stopColor="#FB923C" />
                </linearGradient>
              </defs>
            </svg>

            <motion.div
              aria-hidden="true"
              style={{ top: truckTop }}
              className="absolute start-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-background shadow-[0_0_30px_rgba(0,229,212,0.5)]">
                <Truck className="h-6 w-6 text-accent" />
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col gap-12 lg:col-start-2">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur"
              >
                <div className="mb-4 flex items-center gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-background">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="max-w-xl text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
