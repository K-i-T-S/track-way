"use client";

import { motion } from "framer-motion";
import {
  Truck,
  Car,
  Package,
  Bus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

/* Cycled across cards instead of one hue per industry — keeps the section on
   TrackWay's single-accent identity (teal / warm orange / neutral ice) rather
   than a rainbow. Same treatment as components/home/ServiceCarousel.tsx. */
const PALETTE = ["#00E5D4", "#FB923C", "#F4FFFE"] as const;

interface IndustryCardProps {
  icon: LucideIcon;
  title: string;
  index: number;
}

function IndustryCard({ icon: Icon, title, index }: IndustryCardProps) {
  const color = PALETTE[index % PALETTE.length]!;
  const isEven = index % 2 === 0;

  return (
    <div
      className="bob group relative flex flex-col items-center"
      style={{ perspective: "600px" }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 40 + (index % 3) * 15,
          rotateX: 25,
          rotateZ: (isEven ? 1 : -1) * (8 + (index % 3) * 4),
          scale: 0.8,
        }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: 0.9,
          delay: index * 0.12,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div
          className="relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center backdrop-blur-sm transition-all duration-500 group-hover:border-white/25 group-hover:bg-white/[0.06]"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(4deg)" }}
        >
          {/* top face glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-px h-px rounded-full opacity-50"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
            }}
          />

          {/* hover spotlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(200px circle at 50% 30%, ${color}15, transparent 70%)`,
            }}
          />

          {/* icon with glow */}
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${color}20, ${color}08)`,
              color,
            }}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>

          <h3 className="text-sm font-semibold text-foreground">{title}</h3>

          {/* bottom shadow platform */}
          <div
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-full opacity-30 blur-md transition-all duration-500 group-hover:opacity-50"
            style={{ background: color }}
          />
        </div>
      </motion.div>

      {/* idle bob on the outer wrapper only — respects the project-wide
          prefers-reduced-motion override in app/globals.css */}
      <style jsx>{`
        .bob {
          animation: bob-${index} ${3 + (index % 3) * 0.5}s ease-in-out
            ${index * 0.4}s infinite;
        }
        @keyframes bob-${index} {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}

export function IndustriesSection(): React.ReactElement {
  const t = useTranslations("homepage");

  const items = [
    { icon: Truck, title: t("industriesFleets") },
    { icon: Car, title: t("industriesRental") },
    { icon: Package, title: t("industriesDelivery") },
    { icon: Bus, title: t("industriesSchool") },
    { icon: UserRound, title: t("industriesPrivate") },
  ];

  return (
    <section className="relative px-6 py-24 lg:px-10">
      {/* background grid */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,229,212,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,212,1) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t("industriesEyebrow")}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("industriesTitle")}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <IndustryCard key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
