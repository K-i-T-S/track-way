"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/* Cycled across cards instead of one hue per industry — keeps the section on
   TrackWay's single-accent identity (teal / warm orange / neutral ice) rather
   than a rainbow. Same treatment as components/home/ServiceCarousel.tsx. */
const PALETTE = ["#00E5D4", "#FB923C", "#F4FFFE"] as const;

interface IndustryCardProps {
  image: string;
  title: string;
  index: number;
}

function IndustryCard({ image, title, index }: IndustryCardProps) {
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
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-500 group-hover:border-white/25 group-hover:bg-white/[0.06]"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(4deg)" }}
        >
          {/* image area */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
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

          {/* text area */}
          <div className="relative px-4 py-5 text-center">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>

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
    {
      image: "/images/who-we-serve-transportation.png",
      title: t("industriesFleets"),
    },
    { image: "/images/who-we-serve-rental.png", title: t("industriesRental") },
    {
      image: "/images/who-we-serve-delivery.png",
      title: t("industriesDelivery"),
    },
    { image: "/images/who-we-serve-school.png", title: t("industriesSchool") },
    {
      image: "/images/who-we-serve-private.png",
      title: t("industriesPrivate"),
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

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <IndustryCard key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
