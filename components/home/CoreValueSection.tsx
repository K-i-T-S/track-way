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

interface CoreValueCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  index: number;
}

function CoreValueCard({ icon: Icon, title, desc, index }: CoreValueCardProps) {
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
      `radial-gradient(320px circle at ${gx}% ${gy}%, rgba(0,229,212,0.16), transparent 70%)`,
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
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur transition-colors hover:border-accent/30"
      >
        <motion.div
          style={{ background }}
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
      <div className="mx-auto max-w-7xl">
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
            <CoreValueCard key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
