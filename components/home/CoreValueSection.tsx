"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  SatelliteDish,
  LayoutDashboard,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

const RING_COLORS = ["#00E5D4", "#FB923C", "#F4FFFE"] as const;

interface CoreValueCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  index: number;
  ring: string;
}

function CoreValueCard({
  icon: Icon,
  title,
  desc,
  index,
  ring,
}: CoreValueCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const background = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(320px circle at ${gx}% ${gy}%, ${ring}29, transparent 70%)`,
  );
  const glare = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(250px circle at ${gx}% ${gy}%, rgba(255,255,255,0.12), transparent 60%)`,
  );

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 16);
    rotateX.set((0.5 - py) * 16);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition-colors hover:border-white/20"
      >
        {/* animated border-trace ring, revealed on hover */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <rect
            x="0.5"
            y="0.5"
            width="calc(100% - 1px)"
            height="calc(100% - 1px)"
            rx="16"
            fill="none"
            stroke={ring}
            strokeWidth="1.5"
            strokeDasharray="200 800"
            className="core-value-border-trace origin-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </svg>

        <motion.div
          style={{ background }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <motion.div
          style={{ background: glare }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div
          style={{ transform: "translateZ(50px)" }}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent"
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3
          style={{ transform: "translateZ(40px)" }}
          className="relative mt-5 text-lg font-semibold text-foreground"
        >
          {title}
        </h3>
        <p
          style={{ transform: "translateZ(30px)" }}
          className="relative mt-2 text-sm leading-relaxed text-muted"
        >
          {desc}
        </p>

        {/* floating decorative orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-40"
          style={{ background: ring }}
        />

        <style jsx>{`
          .core-value-border-trace {
            animation: core-value-border-trace 4s linear infinite;
          }
          @keyframes core-value-border-trace {
            to {
              stroke-dashoffset: -1000;
            }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

export function CoreValueSection(): React.ReactElement {
  const t = useTranslations("homepage");

  const items = [
    {
      icon: SatelliteDish,
      title: t("coreValue1Title"),
      desc: t("coreValue1Desc"),
    },
    {
      icon: LayoutDashboard,
      title: t("coreValue2Title"),
      desc: t("coreValue2Desc"),
    },
    { icon: Wrench, title: t("coreValue3Title"), desc: t("coreValue3Desc") },
  ];

  return (
    <section className="relative px-6 py-24 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-accentWarm/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t("coreValueEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("coreValueTitle")}
          </h2>
          <p className="mt-4 text-muted">{t("coreValueIntro")}</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map((item, i) => (
            <CoreValueCard
              key={item.title}
              {...item}
              index={i}
              ring={RING_COLORS[i % RING_COLORS.length]!}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
