"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";

function badgeImage(src: string) {
  return function BadgeImage({ className }: { className?: string }) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        className={className}
      />
    );
  };
}

const CARDS = [
  {
    icon: badgeImage("/images/badge-gauge.png"),
    top: "18%",
    start: "12%",
    delay: 0,
  },
  {
    icon: badgeImage("/images/badge-map-pin.png"),
    top: "55%",
    start: "62%",
    delay: 0.4,
  },
  {
    icon: badgeImage("/images/badge-shield-alert.png"),
    top: "32%",
    start: "78%",
    delay: 0.8,
  },
];

const RING_SIZES = [320, 240, 160, 80];

const ORBIT_DOTS = [
  { size: 10, orbit: 140, speed: 8, color: "#00E5D4" },
  { size: 8, orbit: 100, speed: 12, color: "#FB923C" },
  { size: 6, orbit: 200, speed: 15, color: "#F4FFFE" },
  { size: 7, orbit: 170, speed: 10, color: "#00E5D4" },
  { size: 5, orbit: 260, speed: 20, color: "#FB923C" },
];

export function ControlRoomSection(): React.ReactElement {
  const t = useTranslations("homepage");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const radarInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative h-[70vh] min-h-[480px] overflow-hidden"
    >
      <motion.div
        style={{ y: gridY }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-[120%] bg-[radial-gradient(circle,#00E5D414_1px,transparent_1px)] bg-[length:22px_22px] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]"
      />

      {/* radar rings + orbiting vehicle dots */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="relative"
          style={{ perspective: "600px", perspectiveOrigin: "50% 50%" }}
        >
          {RING_SIZES.map((size, i) => (
            <div
              key={size}
              className="absolute left-1/2 top-1/2 rounded-full border border-accent/10"
              style={{
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                transform: `rotateX(70deg) scale(${radarInView ? 1 : 0.3})`,
                opacity: radarInView ? 1 - i * 0.2 : 0,
                transition: `transform 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s, opacity 0.8s ease ${i * 0.15}s`,
              }}
            />
          ))}

          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 320,
              height: 320,
              marginLeft: -160,
              marginTop: -160,
              transform: `rotateX(70deg) ${radarInView ? "scale(1)" : "scale(0.3)"}`,
              opacity: radarInView ? 1 : 0,
              transition:
                "transform 1.2s cubic-bezier(0.16,1,0.3,1), opacity 0.8s ease",
            }}
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                animation: radarInView
                  ? "radar-sweep 4s linear infinite"
                  : "none",
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(0,229,212,0.15) 40deg, transparent 80deg)",
              }}
            />
          </div>

          {ORBIT_DOTS.map((dot, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                width: dot.orbit * 2,
                height: dot.orbit * 2,
                marginLeft: -dot.orbit,
                marginTop: -dot.orbit,
                transform: `rotateX(70deg) ${radarInView ? "scale(1)" : "scale(0.3)"}`,
                opacity: radarInView ? 1 : 0,
                transition: `transform 1.2s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.1}s, opacity 0.8s ease ${0.3 + i * 0.1}s`,
              }}
            >
              <div
                className="orbit-dot absolute rounded-full"
                style={{
                  width: dot.size,
                  height: dot.size,
                  background: dot.color,
                  boxShadow: `0 0 ${dot.size * 2}px ${dot.color}80`,
                  top: "50%",
                  left: "50%",
                  marginTop: -dot.size / 2,
                  marginLeft: -dot.size / 2,
                  animation: radarInView
                    ? `vehicle-orbit ${dot.speed}s linear infinite`
                    : "none",
                  ["--orbit-radius" as string]: `${dot.orbit}px`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {CARDS.map(({ icon: Icon, top, start, delay }, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: [0, -10, 0] }}
          viewport={{ once: true }}
          transition={{
            opacity: { duration: 0.6, delay },
            y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
          }}
          className="absolute hidden h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-background/70 text-accent shadow-[0_0_30px_rgba(0,229,212,0.25)] backdrop-blur sm:flex"
          style={{ top, insetInlineStart: start }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-sm font-semibold uppercase tracking-widest text-accent"
        >
          {t("controlRoomEyebrow")}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {t("controlRoomTitle")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-xl text-muted"
        >
          {t("controlRoomBody")}
        </motion.p>
      </div>

      <style jsx global>{`
        @keyframes radar-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes vehicle-orbit {
          from {
            transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(var(--orbit-radius))
              rotate(-360deg);
          }
        }
      `}</style>
    </section>
  );
}
