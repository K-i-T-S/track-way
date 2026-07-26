"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import {
  CapabilityIcon,
  type CapabilityIconName,
} from "@/components/ui/CapabilityIcon";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import type { Feature } from "@/sanity/types";

/* ─────────────────── brand card palette ───────────────────
   Cycled across cards instead of one hue per card — keeps the section on
   TrackWay's single-accent identity (teal / warm orange / neutral ice)
   rather than a rainbow that would clash with the rest of the site. */

const PALETTE = [
  {
    gradient: "from-accent/60 to-accent/15",
    glow: "shadow-accent/30",
    accentColor: "#00E5D4",
  },
  {
    gradient: "from-accentWarm/60 to-accentWarm/15",
    glow: "shadow-accentWarm/30",
    accentColor: "#FB923C",
  },
  {
    gradient: "from-white/20 to-white/5",
    glow: "shadow-white/10",
    accentColor: "#F4FFFE",
  },
] as const;

/* ─────────────────── floating particles ─────────────────── */

function Particles({ count }: { count: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.4 + 0.1,
    })),
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────── perspective grid floor ────────── */

function GridFloor() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] overflow-hidden [perspective:400px]">
      <div
        className="absolute inset-x-[-20%] bottom-[-10%] h-[200%] [transform:rotateX(65deg)]"
        style={{
          background: `
            linear-gradient(to top, rgba(0,229,212,0.12) 1px, transparent 1px),
            linear-gradient(to right, rgba(0,229,212,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 80%)",
        }}
      />
    </div>
  );
}

/* ────────────────────── 3D card ───────────────────── */

interface CardData {
  id: string;
  title: string;
  description: string;
  icon: CapabilityIconName;
}

function ServiceCard({
  card,
  paletteIndex,
  index,
  total,
  rotation,
  isVisible,
  isHovered,
  radius,
}: {
  card: CardData;
  paletteIndex: number;
  index: number;
  total: number;
  rotation: number;
  isVisible: boolean;
  isHovered: boolean;
  radius: number;
}) {
  const palette = PALETTE[paletteIndex % PALETTE.length]!;
  const angle = (360 / total) * index;
  const totalAngle = rotation + angle;

  /* compute how "facing front" the card is (0 = front, 1 = back) */
  const normalisedAngle = ((totalAngle % 360) + 360) % 360;
  const facingFront =
    normalisedAngle > 180 ? 360 - normalisedAngle : normalisedAngle;
  const isFrontFacing = facingFront < 45;

  return (
    <div
      className="absolute top-1/2 left-1/2 transition-opacity duration-700"
      style={{
        transform: `
          rotateY(${totalAngle}deg)
          translateZ(${radius}px)
          translateX(-50%) translateY(-50%)
        `,
        opacity: isVisible ? 1 : 0,
        transitionDelay: isVisible ? `${index * 80}ms` : "0ms",
        zIndex: isFrontFacing ? 20 : 10,
      }}
    >
      <div
        className={`
          group relative flex h-64 w-52 flex-col items-center justify-center gap-3
          rounded-2xl border border-white/15
          bg-gradient-to-br ${palette.gradient}
          p-5 text-center backdrop-blur-xl
          transition-all duration-500 ease-out
          ${isFrontFacing ? `shadow-2xl ${palette.glow} scale-105` : "shadow-lg scale-95 opacity-85"}
          ${isHovered && isFrontFacing ? "brightness-125 !scale-110" : ""}
        `}
        style={{
          transform: isFrontFacing ? "translateZ(30px)" : "translateZ(0px)",
          transition:
            "transform 0.5s ease, box-shadow 0.5s ease, opacity 0.5s ease, filter 0.5s ease",
        }}
      >
        {/* icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-foreground backdrop-blur-sm">
          <CapabilityIcon name={card.icon} className="h-8 w-8" />
        </div>

        {/* title */}
        <h3 className="text-base font-bold tracking-wide text-foreground drop-shadow-md">
          {card.title}
        </h3>

        {/* description */}
        <p className="text-[11px] leading-snug text-foreground/75">
          {card.description}
        </p>

        {/* subtle inner glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${palette.accentColor}33 0%, transparent 70%)`,
          }}
        />

        {/* bottom edge glow */}
        <div
          className="pointer-events-none absolute -bottom-px left-1/4 h-px w-1/2 rounded-full"
          style={{
            background: palette.accentColor,
            boxShadow: `0 0 12px ${palette.accentColor}`,
          }}
        />
      </div>
    </div>
  );
}

/* ────────────────── carousel section ──────────────── */

interface ServiceCarouselProps {
  features: Feature[];
  locale: Locale;
}

export function ServiceCarousel({ features, locale }: ServiceCarouselProps) {
  const t = useTranslations("homepage");
  const currentLocale = useLocale();
  const isRtl = currentLocale === "ar";
  const spinDirection = isRtl ? -1 : 1;
  const prefersReducedMotion = useReducedMotion();

  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [cardWidth, setCardWidth] = useState(208); // 52 * 4 (w-52)
  const [particleCount, setParticleCount] = useState(35);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const speedRef = useRef(0.02); // degrees per ms

  const cards: CardData[] = features.map((feature) => ({
    id: feature._id,
    title: getLocalized(feature.title, locale),
    description: getLocalized(feature.description, locale),
    icon: (feature.icon as CapabilityIconName | undefined) ?? "live-tracking",
  }));
  const total = cards.length;

  /* responsive radius based on viewport */
  const [radius, setRadius] = useState(420);

  useEffect(() => {
    function onResize() {
      const vw = window.innerWidth;
      if (vw < 640) {
        setRadius(200);
        setCardWidth(148);
        setParticleCount(15);
      } else if (vw < 1024) {
        setRadius(310);
        setCardWidth(176);
        setParticleCount(24);
      } else {
        setRadius(420);
        setCardWidth(208);
        setParticleCount(35);
      }
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* intersection observer for scroll entry */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* smooth rotation loop — frozen (aside from manual dot navigation) when
     the user prefers reduced motion */
  const animate = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setRotation((prev) => {
        const targetSpeed = hoveredIndex !== null ? 0.004 : 0.02;
        /* smoothly interpolate speed */
        speedRef.current += (targetSpeed - speedRef.current) * 0.05;
        return prev + speedRef.current * delta * spinDirection;
      });

      animRef.current = requestAnimationFrame(animate);
    },
    [hoveredIndex, spinDirection],
  );

  useEffect(() => {
    if (isVisible && !prefersReducedMotion) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isVisible, animate, prefersReducedMotion]);

  const handleHover = (i: number | null) => setHoveredIndex(i);

  if (total === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[70vh] w-full flex-col items-center overflow-hidden bg-background"
    >
      {/* ── ambient background ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-accentWarm/10 blur-[120px]" />
      </div>

      <Particles count={particleCount} />
      <GridFloor />

      {/* ── heading ── */}
      <div
        className={`relative z-10 mt-14 mb-6 text-center transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <span className="mb-3 inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-accent uppercase backdrop-blur-sm">
          {t("servicesEyebrow")}
        </span>
        <h2 className="mt-4 bg-gradient-to-r from-foreground to-accent bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          {t("servicesTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          {t("servicesSubtitle")}
        </p>
      </div>

      {/* ── 3D stage ── */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center"
        style={{ perspective: "1200px", minHeight: 380 }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div
          className="relative"
          style={{
            width: radius * 2 + cardWidth,
            height: 320,
            transformStyle: "preserve-3d",
            transform: `rotateX(8deg) ${isVisible ? "translateY(0px)" : "translateY(60px) scale(0.7)"}`,
            opacity: isVisible ? 1 : 0,
            transition:
              "transform 1.2s cubic-bezier(0.16,1,0.3,1), opacity 0.8s ease",
          }}
        >
          {cards.map((card, i) => (
            <div key={card.id} onMouseEnter={() => handleHover(i)}>
              <ServiceCard
                card={card}
                paletteIndex={i}
                index={i}
                total={total}
                rotation={rotation}
                isVisible={isVisible}
                isHovered={hoveredIndex === i}
                radius={radius}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── carousel indicator dots ── */}
      <div className="relative z-10 mb-10 flex gap-2">
        {cards.map((card, i) => {
          const angle = (((rotation + (360 / total) * i) % 360) + 360) % 360;
          const facingFront = angle > 180 ? 360 - angle : angle;
          const isFront = facingFront < 25;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                /* snap the rotation so that card i is front-centre */
                const targetAngle = -(360 / total) * i;
                const currentBase =
                  Math.round((rotation - targetAngle) / 360) * 360;
                setRotation(currentBase + targetAngle);
              }}
              className={`h-2 rounded-full transition-all duration-500 ${
                isFront ? "w-8 bg-accent" : "w-2 bg-white/25 hover:bg-white/40"
              }`}
              aria-label={card.title}
            />
          );
        })}
      </div>

      {/* ── CSS keyframes ── */}
      <style jsx global>{`
        @keyframes float-particle {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-30px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-15px);
          }
          75% {
            transform: translateY(-40px) translateX(5px);
          }
        }
      `}</style>
    </section>
  );
}
