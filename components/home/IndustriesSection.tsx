"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

/* Cycled across cards instead of one hue per industry — keeps the section on
   TrackWay's single-accent identity (teal / warm orange / neutral ice) rather
   than a rainbow. Same treatment as components/home/ServiceCarousel.tsx. */
const PALETTE = ["#00E5D4", "#FB923C", "#F4FFFE"] as const;

interface IndustryCardProps {
  image?: string;
  title: string;
  description: string;
  index: number;
}

/* Placeholder icon shown until a matching photo is sourced for this
   industry — same visual slot as the photo (aspect-[4/3] box, same
   overlay/glow treatment) so the card reads consistently with the rest. */
function ConstructionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <path d="M2 20h20" />
      <path d="M4 20V10l6-4v14" />
      <path d="M10 8l8 4v8" />
      <path d="M14 20v-4h4v4" />
      <circle cx="17" cy="10" r="1" />
    </svg>
  );
}

function IndustryCard({ image, title, description, index }: IndustryCardProps) {
  const color = PALETTE[index % PALETTE.length]!;
  const isEven = index % 2 === 0;
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);

  /* Cursor-tracked 3D tilt, layered on top of the original resting tilt
     (rotateX 4deg / rotateY 0). Motion values bypass React re-renders, so
     tracking mousemove here is cheap even across a 6-card grid. Reduced
     motion / touch (no mousemove) both simply stay at the resting values. */
  const tiltX = useMotionValue(0.5);
  const tiltY = useMotionValue(0.5);
  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(tiltY, [0, 1], [12, -4]),
    springConfig,
  );
  const rotateY = useSpring(useTransform(tiltX, [0, 1], [-8, 8]), springConfig);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    tiltX.set((event.clientX - rect.left) / rect.width);
    tiltY.set((event.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    tiltX.set(0.5);
    tiltY.set(0.5);
  }

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
        <motion.div
          tabIndex={0}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          className="relative cursor-default overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 group-hover:border-white/25 group-hover:bg-white/[0.06]"
          style={{
            transformStyle: "preserve-3d",
            rotateX: prefersReducedMotion ? 4 : rotateX,
            rotateY: prefersReducedMotion ? 0 : rotateY,
          }}
        >
          {/* image area */}
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-white/[0.02]">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                style={{ background: `${color}15`, color }}
              >
                <ConstructionIcon />
              </span>
            )}
            {/* gradient overlay for readability */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.95) 100%)",
              }}
            />
            {/* accent top-line */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px opacity-60"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
              }}
            />
            {/* hover spotlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(200px circle at 50% 30%, ${color}15, transparent 70%)`,
              }}
            />
            {/* corner glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 right-0 h-24 w-24 rounded-full opacity-40 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-60"
              style={{ background: color }}
            />
          </div>

          {/* text area — title stays a fixed min-height so every card lines
              up; the benefit line below expands into view on hover/focus */}
          <div className="relative flex min-h-[4.5rem] flex-col items-center justify-center px-4 py-3 text-center">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <motion.p
              initial={false}
              animate={{
                height: active ? "auto" : 0,
                opacity: active ? 1 : 0,
                marginTop: active ? 6 : 0,
              }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden text-xs leading-snug text-muted"
            >
              {description}
            </motion.p>
          </div>

          {/* bottom shadow platform */}
          <div
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-full opacity-30 blur-md transition-all duration-500 group-hover:opacity-50"
            style={{ background: color }}
          />
        </motion.div>
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
    {
      image: "/images/who-we-serve-transportation.png",
      title: t("industriesFleets"),
      description: t("industriesFleetsDesc"),
    },
    {
      image: "/images/who-we-serve-rental.png",
      title: t("industriesRental"),
      description: t("industriesRentalDesc"),
    },
    {
      image: "/images/who-we-serve-delivery.png",
      title: t("industriesDelivery"),
      description: t("industriesDeliveryDesc"),
    },
    {
      image: "/images/who-we-serve-school.png",
      title: t("industriesSchool"),
      description: t("industriesSchoolDesc"),
    },
    {
      image: "/images/who-we-serve-private.png",
      title: t("industriesPrivate"),
      description: t("industriesPrivateDesc"),
    },
    {
      image: "/images/who-we-serve-construction.jpg",
      title: t("industriesConstruction"),
      description: t("industriesConstructionDesc"),
    },
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

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item, i) => (
            <IndustryCard key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
