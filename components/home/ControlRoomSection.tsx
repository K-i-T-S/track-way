"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";

const RING_SIZES = [320, 240, 160, 80];

// Decorative side parallax panels, framing the centered headline on wide
// screens. Staggered vertically (not mirrored) and drifting in opposite
// directions on scroll for a less matchy, more layered feel. The headline
// column is `max-w-3xl` (768px / 384px half-width) -- PANEL_OFFSET_CSS keeps
// the panel's inner edge a fixed gap clear of that, never closer to the
// panel than a small viewport-edge margin. Only shows from `xl` up: below
// that there isn't room for a 768px text column plus two panels without
// crowding or overlap (see PANEL_WIDTH_CSS's own comment).
const SIDE_PANEL_MASK =
  "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)";
// The 15vw rate (vs. gridY's steeper growth) is chosen so that even at the
// narrowest width the panels appear (xl, 1280px), PANEL_OFFSET_CSS's calc
// alone already clears the text gap with room to spare -- verified by hand:
// at 1280px this resolves to a ~32px gap, well past PANEL_GAP_PX, so the
// `max()` edge-margin term below is a dormant safety net, not the normal
// path. If either number here changes, re-check that inequality still holds.
const PANEL_WIDTH_CSS = "clamp(200px, 15vw, 300px)";
const PANEL_HEIGHT_CSS = "clamp(280px, 18vw, 384px)";
const PANEL_GAP_PX = 24;
const PANEL_OFFSET_CSS = `max(1rem, calc(50% - 384px - ${PANEL_GAP_PX}px - ${PANEL_WIDTH_CSS}))`;

// Below `xl`, the side panels are replaced by a pair of soft, blurred image
// bands along the top and bottom edges of the section -- ambient texture
// rather than a framed photo, so they never compete with the centered text
// for attention. Each fades out toward the vertical center (where the text
// sits) and stays put (no scroll-linked motion) to keep mobile scrolling
// cheap.
const MOBILE_BAND_TOP_MASK =
  "linear-gradient(to bottom, black, black 45%, transparent)";
const MOBILE_BAND_BOTTOM_MASK =
  "linear-gradient(to bottom, transparent, black 55%, black)";

const ORBIT_DOTS = [
  { size: 10, orbit: 140, speed: 8, color: "#00E5D4" },
  { size: 8, orbit: 100, speed: 12, color: "#FFC857" },
  { size: 6, orbit: 200, speed: 15, color: "#F4FFFE" },
  { size: 7, orbit: 170, speed: 10, color: "#00E5D4" },
  { size: 5, orbit: 260, speed: 20, color: "#FFC857" },
];

export function ControlRoomSection(): React.ReactElement {
  const t = useTranslations("homepage");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  // Narrower input range than gridY's so the swing plays out mostly while
  // the section is actually on screen, not spent entering/exiting -- makes
  // the drift read as noticeably dynamic rather than a barely-there nudge.
  const leftPanelY = useTransform(scrollYProgress, [0.1, 0.9], ["-24%", "24%"]);
  const rightPanelY = useTransform(
    scrollYProgress,
    [0.1, 0.9],
    ["24%", "-24%"],
  );
  const radarInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative h-[70vh] min-h-[480px] overflow-hidden xl:h-[78vh] xl:min-h-[640px]"
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

      {/* mobile/tablet ambient bands -- see MOBILE_BAND_*_MASK comment above */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-3/5 overflow-hidden opacity-25 blur-2xl xl:hidden"
        style={{
          maskImage: MOBILE_BAND_TOP_MASK,
          WebkitMaskImage: MOBILE_BAND_TOP_MASK,
        }}
      >
        <Image
          src="/images/realistic-images/trucks-on-the-road.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 overflow-hidden opacity-25 blur-2xl xl:hidden"
        style={{
          maskImage: MOBILE_BAND_BOTTOM_MASK,
          WebkitMaskImage: MOBILE_BAND_BOTTOM_MASK,
        }}
      >
        <Image
          src="/images/realistic-images/route-optimization-manager.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

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

      {/* side parallax panels -- see SIDE_PANEL_MASK comment above */}
      <div
        aria-hidden="true"
        className="absolute top-[8%] hidden overflow-hidden rounded-2xl border border-accent/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] xl:block"
        style={{
          insetInlineStart: PANEL_OFFSET_CSS,
          width: PANEL_WIDTH_CSS,
          height: PANEL_HEIGHT_CSS,
          maskImage: SIDE_PANEL_MASK,
          WebkitMaskImage: SIDE_PANEL_MASK,
        }}
      >
        <motion.div
          style={{ y: leftPanelY, top: "-50%" }}
          className="absolute inset-x-0 h-[200%] w-full"
        >
          {/* sizes is ~4x the box's own width (208-240px), not a typo: the
              wrapper is a 200%-tall landscape photo object-cover'd into a
              narrow portrait box, so object-cover scales it by height, not
              width -- fetching only box-width-sized source would upscale
              and look pixelated. */}
          <Image
            src="/images/realistic-images/trucks-on-the-road.jpeg"
            alt=""
            fill
            sizes="960px"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/10" />
      </div>

      <div
        aria-hidden="true"
        className="absolute top-[32%] hidden overflow-hidden rounded-2xl border border-accent/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] xl:block"
        style={{
          insetInlineEnd: PANEL_OFFSET_CSS,
          width: PANEL_WIDTH_CSS,
          height: PANEL_HEIGHT_CSS,
          maskImage: SIDE_PANEL_MASK,
          WebkitMaskImage: SIDE_PANEL_MASK,
        }}
      >
        <motion.div
          style={{ y: rightPanelY, top: "-50%" }}
          className="absolute inset-x-0 h-[200%] w-full"
        >
          <Image
            src="/images/realistic-images/route-optimization-manager.jpeg"
            alt=""
            fill
            sizes="960px"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/10" />
      </div>

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
