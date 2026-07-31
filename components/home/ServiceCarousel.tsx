"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import type { CapabilityIconName } from "@/components/ui/CapabilityIcon";
import { CapabilityImage } from "@/components/ui/CapabilityImage";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import type { Feature } from "@/sanity/types";

/* ─────────────────── brand card palette ───────────────────
   Cycled across cards instead of one hue per card — keeps the section on
   TrackWay's single-accent identity (teal / sky-blue / neutral ice) rather
   than a rainbow that would clash with the rest of the site. The middle
   slot is a carousel-local sky-blue (not the sitewide `accentWarm` orange
   token, which is still used elsewhere -- Hero/CoreValue/Hardware section
   glows, ScrollProgressBar), same cool cyan-blue family already used
   throughout the hero globe's routes/halo, no indigo per the project's
   existing "no indigo" color rule (see AboutTeaserSection). */

const PALETTE = [
  {
    gradient: "from-accent/60 to-accent/15",
    glow: "shadow-accent/30",
    accentColor: "#00E5D4",
  },
  {
    gradient: "from-[#38BDF8]/60 to-[#38BDF8]/15",
    glow: "shadow-[#38BDF8]/30",
    accentColor: "#38BDF8",
  },
  {
    gradient: "from-white/20 to-white/5",
    glow: "shadow-white/10",
    accentColor: "#F4FFFE",
  },
] as const;

/* ─────────────────── floating particles ─────────────────── */

/* Deterministic pseudo-random in [0, 1), seeded by index — using
   Math.random() here would differ between the server-rendered HTML and
   the client's first render before hydration, causing a hydration
   mismatch (the same bug fixed in IndustriesSection's card scatter). */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Rounded to a fixed precision: the browser re-serializes inline style
// attributes (e.g. "92.16903898159217%" -> "92.169%") when parsing
// server-rendered HTML, so an unrounded float still trips a hydration
// mismatch even once the value itself is deterministic.
function round(n: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Eased falloff (0 at/behind the far side, 1 dead-center) rather than a
// linear ramp, so the centered card holds its "in-focus" look over a small
// arc instead of visibly fading the instant it starts rotating away.
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function Particles({ count }: { count: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: round(pseudoRandom(i * 4 + 1) * 100),
      y: round(pseudoRandom(i * 4 + 2) * 100),
      size: round(pseudoRandom(i * 4 + 3) * 3 + 1),
      duration: round(pseudoRandom(i * 4 + 4) * 12 + 8),
      delay: round(pseudoRandom(i * 4 + 1.5) * -20),
      opacity: round(pseudoRandom(i * 4 + 2.5) * 0.4 + 0.1),
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

  /* compute how "facing front" the card is (0 = front, 180 = directly behind) */
  const normalisedAngle = ((totalAngle % 360) + 360) % 360;
  const facingFront =
    normalisedAngle > 180 ? 360 - normalisedAngle : normalisedAngle;

  // Continuous depth-of-field falloff (1 = dead-center/in-focus, 0 = fully
  // receded) instead of a binary "front" cutoff. With typical card spacing
  // (360/total, often 40-60deg) a binary threshold let 2-3 neighboring
  // cards qualify as "front" at once, all styled identically -- which read
  // as flat/uniform rather than having one clear focal card. Now exactly
  // one card is ever unambiguously in focus, with a smooth handoff as
  // rotation continues.
  const focus = 1 - smoothstep(0, 100, facingFront);
  const isCurrent = focus > 0.85;
  const cardOpacity = lerp(0.35, 1, focus);

  // Extra zoom-in "hero moment" bump, narrower and sharper than the
  // continuous focus falloff above -- peaks exactly at dead-center and
  // eases back out as the card rotates away, same proximity window
  // (fraction of the angle between neighboring cards) the auto rotation
  // slowdown in ServiceCarousel uses, so the zoom and the pacing read as
  // one synchronized beat instead of two independent effects.
  const anglePerCard = 360 / total;
  const heroZoom = 1 - smoothstep(0, anglePerCard * 0.35, facingFront);
  const heroZoomBoost = 1 + heroZoom * 0.18;

  const cardScale =
    lerp(0.82, 1.08, focus) *
    heroZoomBoost *
    (isHovered && isCurrent ? 1.05 : 1);
  const cardBlurPx = lerp(3, 0, focus);
  const cardZ = lerp(0, 30, focus);
  const cardFilter = [
    cardBlurPx > 0.05 ? `blur(${cardBlurPx}px)` : "",
    isHovered && isCurrent ? "brightness(1.25)" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
        zIndex: Math.round(focus * 100),
      }}
    >
      <div
        className={`
          group relative flex h-72 w-60 flex-col items-center justify-center gap-3
          rounded-2xl border border-white/15
          bg-gradient-to-br ${palette.gradient}
          p-5 text-center backdrop-blur-xl
          transition-all duration-500 ease-out
          ${isCurrent ? `shadow-2xl ${palette.glow}` : "shadow-lg"}
        `}
        style={{
          opacity: cardOpacity,
          // translateZ + scale must live in the same inline `transform` --
          // an inline style always wins over a class's `transform` (e.g.
          // Tailwind's scale-*), so splitting them across className and
          // style silently drops whichever one is class-based. That was
          // the actual bug behind the "uniform" look: the old scale-105/
          // scale-95 classes never rendered, clobbered by this element's
          // own inline translateZ. Same reasoning applies to `filter`
          // below (blur + brightness combined here, not brightness-125
          // as a class).
          transform: `translateZ(${cardZ}px) scale(${cardScale})`,
          filter: cardFilter || "none",
          // Same premium ease-out curve already used for this section's
          // stage entrance below, reused here for the zoom-in/out beat.
          transition:
            "transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease, opacity 0.5s ease, filter 0.5s ease",
        }}
      >
        {/* icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <CapabilityImage name={card.icon} size={64} className="h-16 w-16" />
        </div>

        {/* title */}
        <h3 className="text-lg font-bold tracking-wide text-foreground drop-shadow-md">
          {card.title}
        </h3>

        {/* description */}
        <p className="text-xs leading-snug text-foreground/75">
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
  const [cardWidth, setCardWidth] = useState(240); // 60 * 4 (w-60)
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
  const [radius, setRadius] = useState(490);

  useEffect(() => {
    function onResize() {
      const vw = window.innerWidth;
      if (vw < 640) {
        setRadius(240);
        setCardWidth(170);
        setParticleCount(15);
      } else if (vw < 1024) {
        setRadius(370);
        setCardWidth(200);
        setParticleCount(24);
      } else {
        setRadius(490);
        setCardWidth(240);
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
        const baseSpeed = 0.013;

        // How far (in degrees) the nearest card is from being dead-center --
        // periodic in `prev` with period `anglePerCard`, so this naturally
        // repeats every card automatically without tracking "whose turn"
        // explicitly. Same proximity concept ServiceCard uses for its own
        // zoom-in bump (kept as two independent calculations off the same
        // `rotation` value rather than threaded through props/state).
        const anglePerCard = 360 / total;
        const withinCard =
          ((prev % anglePerCard) + anglePerCard) % anglePerCard;
        const distFromCenter = Math.min(withinCard, anglePerCard - withinCard);
        const nearCenter =
          1 - smoothstep(0, anglePerCard * 0.35, distFromCenter);

        // Auto slow-down as any card nears center (the "hero moment" beat),
        // independent of hover -- hover still slows further on top of it.
        const heroTargetSpeed = lerp(baseSpeed, baseSpeed * 0.22, nearCenter);
        const hoverTargetSpeed = hoveredIndex !== null ? 0.004 : baseSpeed;
        const targetSpeed = Math.min(heroTargetSpeed, hoverTargetSpeed);

        /* smoothly interpolate speed */
        speedRef.current += (targetSpeed - speedRef.current) * 0.05;
        return prev + speedRef.current * delta * spinDirection;
      });

      animRef.current = requestAnimationFrame(animate);
    },
    [hoveredIndex, spinDirection, total],
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
      className="relative flex min-h-[78vh] w-full flex-col items-center overflow-hidden bg-background"
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
        style={{ perspective: "1300px", minHeight: 460 }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div
          className="relative"
          style={{
            width: radius * 2 + cardWidth,
            height: 380,
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
