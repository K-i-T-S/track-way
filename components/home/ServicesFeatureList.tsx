"use client";

import { motion } from "framer-motion";
import type { CapabilityIconName } from "@/components/ui/CapabilityIcon";
import { CapabilityImage } from "@/components/ui/CapabilityImage";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import type { Feature } from "@/sanity/types";

interface RowData {
  id: string;
  title: string;
  description: string;
  icon: CapabilityIconName;
}

/* Alternated per row so the list isn't a single flat teal wash. */
const ROW_COLORS = ["#00E5D4", "#FFC857"] as const;

function FeatureRow({ row, index }: { row: RowData; index: number }) {
  const isEven = index % 2 === 0;
  const color = ROW_COLORS[index % ROW_COLORS.length]!;

  return (
    <motion.div
      className="group relative"
      style={{ perspective: "1000px" }}
      initial={{ opacity: 0, x: isEven ? -40 : 40, rotateY: isEven ? -5 : 5 }}
      whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div
        className="relative flex items-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:[border-color:var(--row-border)]"
        style={
          {
            transformStyle: "preserve-3d",
            "--row-border": `${color}4d`,
            "--row-soft": `${color}4d`,
            "--row-strong": `${color}99`,
            "--row-color": color,
          } as React.CSSProperties
        }
      >
        {/* hover glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(300px circle at ${isEven ? "20%" : "80%"} 50%, ${color}1a, transparent 70%)`,
          }}
        />

        {/* animated number */}
        <span
          className="relative shrink-0 text-3xl font-black tabular-nums transition-colors duration-300 [color:var(--row-soft)] group-hover:[color:var(--row-strong)]"
          style={{ transform: "translateZ(30px)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* floating icon */}
        <div
          className="relative shrink-0"
          style={{
            transform: "translateZ(50px)",
            animation: `icon-float 3s ease-in-out ${index * 0.3}s infinite`,
          }}
        >
          <CapabilityImage name={row.icon} size={28} className="h-7 w-7" />
        </div>

        {/* text content */}
        <div
          className="relative flex-1"
          style={{ transform: "translateZ(20px)" }}
        >
          <h3 className="text-lg font-bold text-foreground transition-colors group-hover:[color:var(--row-color)]">
            {row.title}
          </h3>
          <p className="mt-1 text-sm text-muted">{row.description}</p>
        </div>

        {/* arrow */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="relative h-5 w-5 shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:[color:var(--row-color)]"
          style={{ transform: "translateZ(25px)" }}
        >
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>

        {/* depth line accent */}
        <div
          aria-hidden="true"
          className={`absolute ${isEven ? "left-0" : "right-0"} top-0 h-full w-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
          style={{
            background: `linear-gradient(to bottom, ${color}80, ${color}33, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}

interface ServicesFeatureListProps {
  features: Feature[];
  locale: Locale;
}

export function ServicesFeatureList({
  features,
  locale,
}: ServicesFeatureListProps): React.ReactElement | null {
  const rows: RowData[] = features.map((feature) => ({
    id: feature._id,
    title: getLocalized(feature.title, locale),
    description: getLocalized(feature.description, locale),
    icon: (feature.icon as CapabilityIconName | undefined) ?? "live-tracking",
  }));

  if (rows.length === 0) return null;

  return (
    <section className="relative px-6 py-16 lg:px-10">
      {/* background decorations */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* vertical light beam */}
        <div
          className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 opacity-20"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(0,229,212,0.4), rgba(255,200,87,0.4), transparent)",
          }}
        />
        {/* floating orbs, alternating teal/gold instead of teal-only */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-full blur-sm"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: `${ROW_COLORS[i % ROW_COLORS.length]}4d`,
              animation: `services-list-float-particle ${8 + i * 2}s ease-in-out ${i * -2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-5">
          {rows.map((row, i) => (
            <FeatureRow key={row.id} row={row} index={i} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes icon-float {
          0%,
          100% {
            transform: translateZ(50px) translateY(0px);
          }
          50% {
            transform: translateZ(50px) translateY(-4px);
          }
        }
        @keyframes services-list-float-particle {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(-10px) translateX(-8px);
          }
        }
      `}</style>
    </section>
  );
}
