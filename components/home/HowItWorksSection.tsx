"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const STEP_ICONS: ReactNode[] = [
  <svg
    key="doc"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg
    key="chat"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>,
  <svg
    key="check"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>,
];

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
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
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
            {steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur transition-colors duration-500 hover:border-accent/30"
                >
                  {/* hover glow */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(350px circle at ${isEven ? "80%" : "20%"} 50%, rgba(0,229,212,0.08), transparent 70%)`,
                    }}
                  />

                  <div className="relative mb-4 flex items-center gap-4">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-background"
                      style={{ boxShadow: "0 0 30px rgba(0,229,212,0.3)" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-accent"
                      style={{
                        animation: `step-icon-float 3s ease-in-out ${i * 0.5}s infinite`,
                      }}
                    >
                      {STEP_ICONS[i]}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>

                  <p className="relative max-w-xl text-muted">{step.desc}</p>

                  {/* decorative corner line */}
                  <div
                    aria-hidden="true"
                    className={`absolute ${isEven ? "right-0 top-0" : "left-0 bottom-0"} h-16 w-0.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, rgba(0,229,212,0.5), transparent)",
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
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
