"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  LEBANON,
  BEIRUT,
  ROUTES,
  LABELS,
  lerp,
  smoothstep,
  easeOutCubic,
  merc,
  rad,
  countryName,
  isMena,
  eachRing,
  sphereProject,
  flatProject,
  type GeoJsonCollection,
  type SphereParams,
  type FlatParams,
} from "@/lib/globe/geo-math";

gsap.registerPlugin(ScrollTrigger);

const GEO_DATA_URL = "/data/world-110m.json";
// Desired scroll distance the hero stays pinned for, in viewport-heights.
// Passed to ScrollTrigger as a pixel distance (window.innerHeight * this) —
// GSAP's own `pin` creates its own spacer sized to exactly this distance,
// so there's no leftover "dead" scroll space the way a hand-rolled tall
// CSS section + position:sticky would need (sticky requires the container
// to be pinDistance + elementHeight tall, which leaves one viewport-height
// of unused space after the pin ends; `pin:true` doesn't have that tax).
const PIN_DISTANCE_VH = 1.8;
// Mobile/coarse-pointer never gets GSAP `pin: true` (known mobile
// viewport-resize jank as the browser's address bar hides/shows mid-scroll),
// but `scrub` alone only reads scroll position -- it doesn't pin, fix, or
// transform anything, so it's safe there. The canvas is already always
// `position: fixed` regardless of mode (see the comment on the returned
// portal below), so this scroll distance is independent of the hero
// section's own layout height -- the section stays exactly 100svh
// (headline/CTA visible immediately, scrolling away normally) while the
// fixed background keeps scrubbing for this much scroll distance.
const MOBILE_SCRUB_VH = 1.15;
// Ambient opacity (0.08) is a literal in the JSX className below, not a
// constant here — Tailwind's JIT scanner needs the arbitrary value to
// appear as source text to generate the class.
const AMBIENT_FRAME_INTERVAL_MS = 66; // ~15fps
// The pinned/scrub phase redraws the full world grid + every country polygon
// every frame -- CPU-throttled load testing (4x slowdown, simulating a
// modest/older laptop) measured 56% of frames over 50ms and 3+ seconds of
// blocked main thread per ~3s of scrolling when this ran uncapped at 60fps.
// Capped the same way ambient mode already is, just at a higher rate since
// this phase is the active/foreground animation.
const PINNED_FRAME_INTERVAL_MS = 33; // ~30fps

// Two full color scripts for the canvas-drawn globe/map scene, keyed by
// theme. The dark script is the original design (deep-space navy ocean,
// neon cyan/gold accents). The light script matches hero-light.jpeg: a
// pale, airy sphere with no starfield, teal-filled MENA landmass, and
// enough contrast bumped into every accent color (routes, marker, labels)
// since the neon dark-theme values would nearly disappear against a light
// background.
const PALETTES = {
  dark: {
    bgGlow: [
      "rgba(22,242,207,.12)",
      "rgba(21,67,111,.17)",
      "rgba(0,0,0,0)",
    ] as const,
    showStars: true,
    starColor: "#dffbff",
    globeGrid: "rgba(162, 235, 255, .16)",
    countryMenaFill: "rgba(24,242,207,.30)",
    countryMenaStroke: "rgba(255, 209, 102, .42)",
    countryOtherFill: "rgba(96, 205, 190, .20)",
    countryOtherStroke: "rgba(180, 235, 255, .18)",
    routeGold: "rgba(255,209,102,.45)",
    routeGreen: "rgba(109,255,172,.45)",
    routeCyan: "rgba(100,244,255,.45)",
    markerRing: (a: number) => `rgba(109,255,172,${a})`,
    markerCore: "#ffffff",
    markerDot: "#6dffac",
    markerCrosshair: "rgba(255,255,255,.72)",
    markerLabel: "rgba(230,255,252,.96)",
    sphereHalo: [
      "rgba(100,244,255,0)",
      "rgba(100,244,255,.10)",
      "rgba(100,244,255,0)",
    ] as const,
    sphereOcean: [
      "rgba(94, 247, 255,.35)",
      "rgba(36, 107, 154,.48)",
      "rgba(8, 34, 64,.86)",
      "rgba(2, 8, 24,.96)",
    ] as const,
    sphereEdge: "rgba(170,245,255,.46)",
    sphereLimb: "rgba(100,244,255,.22)",
    flatBackdrop: [
      "rgba(8,26,46,.28)",
      "rgba(3,18,31,.62)",
      "rgba(2,9,21,.46)",
    ] as const,
    flatBorder: (fold: number) => `rgba(120, 225, 255, ${0.1 + 0.22 * fold})`,
    flatSheenMid: (a: number) => `rgba(100,244,255,${a})`,
    flatCrease: (a: number) => `rgba(255,255,255,${a})`,
    flatGrid: "rgba(141, 223, 255, .15)",
    flatLebFill: (a: number) => `rgba(109,255,172,${a})`,
    flatLebStroke: "rgba(255,255,255,.92)",
    flatMenaFill: (a: number) => `rgba(28, 219, 207, ${a})`,
    flatMenaStroke: "rgba(186, 247, 255, .36)",
    flatOtherFill: "rgba(93,124,163,.12)",
    flatOtherStroke: "rgba(142, 180, 205, .14)",
    routeLine: (color: string) =>
      color === "#ffd166"
        ? "#ffd166"
        : color === "#6dffac"
          ? "#6dffac"
          : "#64f4ff",
    routeLabel: "rgba(231,251,255,.82)",
    satelliteColor: "rgba(100,244,255,.85)",
    satelliteOrbit: "rgba(100,244,255,.07)",
    labelImportant: "rgba(255,255,255,.96)",
    labelImportantShadow: "rgba(109,255,172,.75)",
    labelCity: "rgba(226,251,255,.78)",
    labelWater: "rgba(117,206,255,.36)",
    labelLand: "rgba(205,228,235,.45)",
    overlayRing: (a: number) => `rgba(109,255,172,${a})`,
    overlayCrosshair: "rgba(255,255,255,.84)",
    overlayPin: "#6dffac",
    overlayPinShadow: "rgba(109,255,172,.88)",
    overlayBeirutCore: "#fff",
    overlayBeirutDot: "#ff5a77",
    overlayBoxBg: "rgba(4, 16, 30, .72)",
    overlayBoxBorder: "rgba(109,255,172,.34)",
    overlayLabel: "#6dffac",
    overlayTitle: "#ffffff",
    overlayCoords: "rgba(203,230,238,.72)",
    unfoldStroke: "rgba(100,244,255,.18)",
    unfoldFill: "rgba(255,209,102,.10)",
  },
  light: {
    bgGlow: [
      "rgba(19,242,207,.10)",
      "rgba(214,241,238,.4)",
      "rgba(255,255,255,0)",
    ] as const,
    showStars: false,
    starColor: "#bfe9e3",
    globeGrid: "rgba(70, 150, 142, .12)",
    countryMenaFill: "rgba(45, 178, 163, .55)",
    countryMenaStroke: "rgba(21, 122, 110, .35)",
    countryOtherFill: "rgba(120, 190, 183, .16)",
    countryOtherStroke: "rgba(94, 170, 163, .22)",
    routeGold: "rgba(184,124,10,.55)",
    routeGreen: "rgba(14,140,86,.55)",
    routeCyan: "rgba(18,116,158,.55)",
    markerRing: (a: number) => `rgba(14,140,86,${a})`,
    markerCore: "#0e2f34",
    markerDot: "#1f9d6f",
    markerCrosshair: "rgba(15,58,54,.6)",
    markerLabel: "rgba(13,42,40,.92)",
    sphereHalo: [
      "rgba(45,170,155,0)",
      "rgba(45,170,155,.08)",
      "rgba(45,170,155,0)",
    ] as const,
    sphereOcean: [
      "rgba(255,255,255,.95)",
      "rgba(224,247,244,.92)",
      "rgba(198,235,230,.72)",
      "rgba(176,224,217,.58)",
    ] as const,
    sphereEdge: "rgba(63,158,148,.42)",
    sphereLimb: "rgba(45,170,155,.16)",
    flatBackdrop: [
      "rgba(255,255,255,.55)",
      "rgba(226,247,244,.68)",
      "rgba(210,238,234,.5)",
    ] as const,
    flatBorder: (fold: number) => `rgba(45, 150, 138, ${0.14 + 0.2 * fold})`,
    flatSheenMid: (a: number) => `rgba(45,170,155,${a})`,
    flatCrease: (a: number) => `rgba(20,60,55,${a})`,
    flatGrid: "rgba(70, 150, 142, .14)",
    flatLebFill: (a: number) => `rgba(16,150,90,${a})`,
    flatLebStroke: "rgba(11,64,46,.85)",
    flatMenaFill: (a: number) => `rgba(35, 160, 148, ${a})`,
    flatMenaStroke: "rgba(24, 110, 102, .38)",
    flatOtherFill: "rgba(140,170,185,.14)",
    flatOtherStroke: "rgba(110,145,160,.18)",
    routeLine: (color: string) =>
      color === "#ffd166"
        ? "#b87c0a"
        : color === "#6dffac"
          ? "#0e8c56"
          : "#12749e",
    routeLabel: "rgba(20,48,46,.82)",
    satelliteColor: "rgba(18,116,158,.85)",
    satelliteOrbit: "rgba(18,116,158,.09)",
    labelImportant: "rgba(13,40,38,.95)",
    labelImportantShadow: "rgba(14,140,86,.5)",
    labelCity: "rgba(24,58,55,.75)",
    labelWater: "rgba(24,110,150,.42)",
    labelLand: "rgba(60,95,92,.5)",
    overlayRing: (a: number) => `rgba(14,140,86,${a})`,
    overlayCrosshair: "rgba(15,58,54,.72)",
    overlayPin: "#0e8c56",
    overlayPinShadow: "rgba(14,140,86,.55)",
    overlayBeirutCore: "#fff",
    overlayBeirutDot: "#d6304f",
    overlayBoxBg: "rgba(255, 255, 255, .82)",
    overlayBoxBorder: "rgba(14,140,86,.3)",
    overlayLabel: "#0e8c56",
    overlayTitle: "#0d2a26",
    overlayCoords: "rgba(60,88,85,.75)",
    unfoldStroke: "rgba(18,116,158,.16)",
    unfoldFill: "rgba(184,124,10,.10)",
  },
} as const satisfies Record<"dark" | "light", Record<string, unknown>>;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  drift: number;
  phase: number;
}

interface Satellite {
  angle: number;
  radius: number;
  speed: number;
  tilt: number;
}

interface GlobeDrawParams extends SphereParams {
  alpha: number;
}

interface FlatDrawParams extends FlatParams {
  alpha: number;
  zoom: number;
}

interface GlobeHeroBackgroundProps {
  trackRef: RefObject<HTMLElement | null>;
}

export function GlobeHeroBackground({
  trackRef,
}: GlobeHeroBackgroundProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"pinned" | "ambient">("pinned");
  const reducedMotion = useReducedMotion();
  const { theme } = useTheme();
  // Read via ref inside the rAF loop rather than putting `theme` in the
  // main effect's dependency array -- that effect owns the ScrollTrigger,
  // the star/satellite field, and `progress`, so restarting it on every
  // theme toggle would reset scroll-linked progress and re-randomize the
  // decorative fields. A ref lets color choice update every frame without
  // touching any of that.
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const trigger = trackRef.current;
    if (!wrapper || !canvas || !trigger) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas fill/stroke cost scales roughly with pixel count, so touch
    // devices (typically 2-3x DPR phones) cap lower than desktop/laptop --
    // a ~4x reduction in per-pixel work that isn't perceptible on a small
    // screen, confirmed via CPU-throttled load testing.
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let progress = reducedMotion ? 1 : 0;
    let target = progress;
    let currentMode: "pinned" | "ambient" = "pinned";
    let geo: GeoJsonCollection | null = null;
    let rafId = 0;
    let last = performance.now();
    let lastDrawTime = 0;
    let pal: Palette = PALETTES[themeRef.current];

    const stars: Star[] = Array.from({ length: 240 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.25,
      a: Math.random() * 0.58 + 0.14,
      drift: Math.random() * 0.04 + 0.012,
      phase: Math.random() * Math.PI * 2,
    }));
    const satellites: Satellite[] = Array.from({ length: 9 }, (_, i) => ({
      angle: (i / 9) * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.22,
      speed: 0.16 + Math.random() * 0.22,
      tilt: Math.random() * Math.PI,
    }));

    function resize(): void {
      dpr = Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1 : 2);
      width = Math.max(1, wrapper!.clientWidth);
      height = Math.max(1, wrapper!.clientHeight);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function inView(x: number, y: number, m = 0): boolean {
      return x > -m && x < width + m && y > -m && y < height + m;
    }

    function roundRect(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ): void {
      const rr = Math.min(r, w / 2, h / 2);
      ctx!.beginPath();
      ctx!.moveTo(x + rr, y);
      ctx!.arcTo(x + w, y, x + w, y + h, rr);
      ctx!.arcTo(x + w, y + h, x, y + h, rr);
      ctx!.arcTo(x, y + h, x, y, rr);
      ctx!.arcTo(x, y, x + w, y, rr);
      ctx!.closePath();
    }

    function globeParams(time: number): GlobeDrawParams {
      const seek = smoothstep(0.03, 0.46, progress);
      const unfold = smoothstep(0.47, 0.72, progress);
      const autoSpin = (1 - seek) * time * 2.8;
      const baseLon = lerp(-38 + autoSpin, LEBANON.lon, seek);
      return {
        cx: width * 0.5,
        cy: height * (height > 720 ? lerp(0.52, 0.53, unfold) : 0.57),
        r:
          Math.min(width, height) *
          lerp(0.31, 0.72, smoothstep(0.08, 0.58, progress)),
        centerLon: baseLon,
        centerLat: lerp(5, 30, seek),
        alpha: 1 - smoothstep(0.55, 0.76, progress),
      };
    }

    function flatParams(time: number): FlatDrawParams {
      const g = smoothstep(0.72, 0.99, progress);
      const small = width < 900;
      const cx = width * 0.5;
      const cy = height * (small ? 0.58 : 0.53);
      const mena = {
        maxLon: 64,
        minLon: -18,
        maxLat: 44,
        minLat: -4,
        centerLon: 23.0,
        centerLat: 22.5,
      };
      const lev = {
        maxLon: 42.2,
        minLon: 28.6,
        maxLat: 38.6,
        minLat: 28.4,
        centerLon: 35.55,
        centerLat: 33.65,
      };
      function fit(b: typeof mena): number {
        const padX = small ? width * 0.1 : width * 0.12;
        const padY = small ? height * 0.2 : height * 0.17;
        const sx = (width - padX * 2) / (rad(b.maxLon) - rad(b.minLon));
        const sy = (height - padY * 2) / (merc(b.maxLat) - merc(b.minLat));
        return Math.min(sx, sy);
      }
      const idleDrift =
        currentMode === "ambient" ? Math.sin(time * 0.05) * 0.6 : 0;
      return {
        cx,
        cy,
        centerLon:
          lerp(mena.centerLon, lev.centerLon, easeOutCubic(g)) + idleDrift,
        centerLat: lerp(mena.centerLat, lev.centerLat, easeOutCubic(g)),
        scale: lerp(fit(mena), fit(lev), easeOutCubic(g)),
        alpha: smoothstep(0.47, 0.69, progress),
        zoom: g,
      };
    }

    function drawBackground(time: number): void {
      ctx!.clearRect(0, 0, width, height);
      const grd = ctx!.createRadialGradient(
        width * 0.62,
        height * 0.48,
        40,
        width * 0.62,
        height * 0.48,
        Math.max(width, height) * 0.8,
      );
      grd.addColorStop(0, pal.bgGlow[0]);
      grd.addColorStop(0.28, pal.bgGlow[1]);
      grd.addColorStop(1, pal.bgGlow[2]);
      ctx!.fillStyle = grd;
      ctx!.fillRect(0, 0, width, height);
      if (pal.showStars) {
        for (const s of stars) {
          const x =
            ((s.x + Math.sin(time * s.drift + s.phase) * 0.008) % 1) * width;
          const y = ((s.y + time * s.drift * 0.03) % 1) * height;
          ctx!.globalAlpha =
            s.a * (0.55 + 0.45 * Math.sin(time * 1.5 + s.phase));
          ctx!.fillStyle = pal.starColor;
          ctx!.beginPath();
          ctx!.arc(x, y, s.r, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.globalAlpha = 1;
      }
    }

    function drawGlobeGrid(p: GlobeDrawParams): void {
      ctx!.save();
      ctx!.lineWidth = 0.8;
      ctx!.strokeStyle = pal.globeGrid;
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx!.beginPath();
        let started = false;
        // Sampling step doubled from 3deg -- halves per-frame trig calls for
        // this decorative graticule, imperceptible at this line thickness.
        for (let lon = -180; lon <= 180; lon += 6) {
          const pt = sphereProject(lon, lat, p);
          if (pt.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctx!.moveTo(pt.x, pt.y);
            started = true;
          } else ctx!.lineTo(pt.x, pt.y);
        }
        ctx!.stroke();
      }
      for (let lon = -180; lon < 180; lon += 15) {
        ctx!.beginPath();
        let started = false;
        // Sampling step doubled from 2deg, same rationale as above.
        for (let lat = -85; lat <= 85; lat += 4) {
          const pt = sphereProject(lon, lat, p);
          if (pt.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctx!.moveTo(pt.x, pt.y);
            started = true;
          } else ctx!.lineTo(pt.x, pt.y);
        }
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawGlobeCountries(p: GlobeDrawParams): void {
      if (!geo) return;
      ctx!.save();
      for (const feat of geo.features) {
        const name = countryName(feat);
        if (name === "Antarctica") continue;
        const mena = isMena(feat);
        ctx!.fillStyle = mena ? pal.countryMenaFill : pal.countryOtherFill;
        ctx!.strokeStyle = mena
          ? pal.countryMenaStroke
          : pal.countryOtherStroke;
        ctx!.lineWidth = mena ? 1.15 : 0.55;
        eachRing(feat, (ring) => {
          ctx!.beginPath();
          let started = false;
          let count = 0;
          for (const c of ring) {
            const pt = sphereProject(c[0], c[1], p);
            if (pt.z < 0.015) {
              started = false;
              continue;
            }
            if (!started) {
              ctx!.moveTo(pt.x, pt.y);
              started = true;
            } else ctx!.lineTo(pt.x, pt.y);
            count++;
          }
          if (count > 2) {
            ctx!.closePath();
            ctx!.fill();
            ctx!.stroke();
          }
        });
      }
      ctx!.restore();
    }

    function drawGlobeRoutes(p: GlobeDrawParams, time: number): void {
      const dest = sphereProject(BEIRUT.lon, BEIRUT.lat, p);
      if (dest.z < 0) return;
      ctx!.save();
      ctx!.setLineDash([7, 9]);
      ctx!.lineDashOffset = -time * 42;
      for (const r of ROUTES) {
        const a = sphereProject(r.lon, r.lat, p);
        if (a.z < -0.08) continue;
        const mx = (a.x + dest.x) / 2;
        const my = (a.y + dest.y) / 2 - p.r * 0.14;
        ctx!.strokeStyle =
          r.color === "#ffd166"
            ? pal.routeGold
            : r.color === "#6dffac"
              ? pal.routeGreen
              : pal.routeCyan;
        ctx!.lineWidth = 1.25;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.quadraticCurveTo(mx, my, dest.x, dest.y);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.fillStyle = ctx!.strokeStyle;
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, 2.4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.setLineDash([7, 9]);
      }
      ctx!.restore();
    }

    function drawGlobeMarker(p: GlobeDrawParams, time: number): void {
      const pt = sphereProject(LEBANON.lon, LEBANON.lat, p);
      if (pt.z < 0) return;
      const s = 1 + smoothstep(0.15, 0.45, progress) * 0.85;
      ctx!.save();
      ctx!.translate(pt.x, pt.y);
      const pulse = (time * 1.4) % 1;
      for (let i = 0; i < 3; i++) {
        const rr = (9 + pulse * 26 + i * 11) * s;
        ctx!.strokeStyle = pal.markerRing((1 - pulse) * (0.34 - i * 0.08));
        ctx!.lineWidth = 1.3;
        ctx!.beginPath();
        ctx!.arc(0, 0, rr, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.fillStyle = pal.markerCore;
      ctx!.beginPath();
      ctx!.arc(0, 0, 4.6 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = pal.markerDot;
      ctx!.beginPath();
      ctx!.arc(0, 0, 2.3 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = pal.markerCrosshair;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(-18 * s, 0);
      ctx!.lineTo(-8 * s, 0);
      ctx!.moveTo(8 * s, 0);
      ctx!.lineTo(18 * s, 0);
      ctx!.moveTo(0, -18 * s);
      ctx!.lineTo(0, -8 * s);
      ctx!.moveTo(0, 8 * s);
      ctx!.lineTo(0, 18 * s);
      ctx!.stroke();
      if (progress > 0.25) {
        ctx!.globalAlpha = smoothstep(0.25, 0.5, progress);
        ctx!.font = `800 ${11 * s}px Inter, system-ui, sans-serif`;
        ctx!.fillStyle = pal.markerLabel;
        ctx!.fillText("LEBANON", 13 * s, -12 * s);
      }
      ctx!.restore();
    }

    function drawSphereBase(p: GlobeDrawParams, time: number): void {
      if (p.alpha <= 0.01) return;
      ctx!.save();
      ctx!.globalAlpha = p.alpha;
      const halo = ctx!.createRadialGradient(
        p.cx,
        p.cy,
        p.r * 0.72,
        p.cx,
        p.cy,
        p.r * 1.45,
      );
      halo.addColorStop(0, pal.sphereHalo[0]);
      halo.addColorStop(0.58, pal.sphereHalo[1]);
      halo.addColorStop(1, pal.sphereHalo[2]);
      ctx!.fillStyle = halo;
      ctx!.beginPath();
      ctx!.arc(p.cx, p.cy, p.r * 1.45, 0, Math.PI * 2);
      ctx!.fill();

      const ocean = ctx!.createRadialGradient(
        p.cx - p.r * 0.32,
        p.cy - p.r * 0.38,
        p.r * 0.04,
        p.cx,
        p.cy,
        p.r,
      );
      ocean.addColorStop(0, pal.sphereOcean[0]);
      ocean.addColorStop(0.2, pal.sphereOcean[1]);
      ocean.addColorStop(0.68, pal.sphereOcean[2]);
      ocean.addColorStop(1, pal.sphereOcean[3]);
      ctx!.fillStyle = ocean;
      ctx!.beginPath();
      ctx!.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = pal.sphereEdge;
      ctx!.lineWidth = 1.4;
      ctx!.stroke();
      ctx!.clip();

      const limb = ctx!.createRadialGradient(
        p.cx,
        p.cy,
        p.r * 0.3,
        p.cx,
        p.cy,
        p.r,
      );
      limb.addColorStop(0.72, "rgba(255,255,255,0)");
      limb.addColorStop(1, pal.sphereLimb);
      ctx!.fillStyle = limb;
      ctx!.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);

      drawGlobeGrid(p);
      drawGlobeCountries(p);
      drawGlobeRoutes(p, time);
      drawGlobeMarker(p, time);
      ctx!.restore();
    }

    function drawFlatBackdrop(p: FlatDrawParams, time: number): void {
      const fold = smoothstep(0.47, 0.72, progress);
      const rx = width * (width < 900 ? 0.06 : 0.07);
      const ry = height * (height < 700 ? 0.13 : 0.11);
      const rw = width - rx * 2;
      const rh = height - ry * 2;
      ctx!.save();
      const bg = ctx!.createLinearGradient(rx, ry, rx + rw, ry + rh);
      bg.addColorStop(0, pal.flatBackdrop[0]);
      bg.addColorStop(0.5, pal.flatBackdrop[1]);
      bg.addColorStop(1, pal.flatBackdrop[2]);
      roundRect(rx, ry, rw, rh, 34);
      ctx!.fillStyle = bg;
      ctx!.fill();
      ctx!.strokeStyle = pal.flatBorder(fold);
      ctx!.lineWidth = 1.2;
      ctx!.stroke();
      const creaseX = lerp(width * 0.78, width * 0.18, fold);
      const sheen = ctx!.createLinearGradient(
        creaseX - 160,
        0,
        creaseX + 160,
        0,
      );
      sheen.addColorStop(0, "rgba(255,255,255,0)");
      sheen.addColorStop(
        0.5,
        pal.flatSheenMid(0.2 * (1 - Math.abs(fold - 0.55))),
      );
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = sheen;
      roundRect(rx, ry, rw, rh, 34);
      ctx!.fill();
      ctx!.strokeStyle = pal.flatCrease(
        0.08 * (1 - fold) + 0.08 * Math.sin(time * 2),
      );
      for (let i = 1; i < 5; i++) {
        const x = lerp(rx + rw * 0.5, rx + (rw * i) / 5, fold);
        ctx!.beginPath();
        ctx!.moveTo(x, ry + 16);
        ctx!.lineTo(x, ry + rh - 16);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawFlatGrid(p: FlatDrawParams): void {
      ctx!.save();
      ctx!.lineWidth = 0.75;
      ctx!.strokeStyle = pal.flatGrid;
      ctx!.setLineDash([2, 7]);
      // Line count doubled from a 5deg step -- each line is a single
      // 2-point segment regardless of step, so this halves line count/draw
      // calls with no change in per-line cost.
      for (let lon = -180; lon <= 180; lon += 10) {
        const a = flatProject(lon, -72, p);
        const b = flatProject(lon, 75, p);
        if ((a.x < -60 && b.x < -60) || (a.x > width + 60 && b.x > width + 60))
          continue;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
      for (let lat = -80; lat <= 80; lat += 10) {
        const a = flatProject(-180, lat, p);
        const b = flatProject(180, lat, p);
        if (
          (a.y < -60 && b.y < -60) ||
          (a.y > height + 60 && b.y > height + 60)
        )
          continue;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);
      ctx!.restore();
    }

    function drawFlatCountries(p: FlatDrawParams): void {
      if (!geo) return;
      ctx!.save();
      for (const feat of geo.features) {
        const name = countryName(feat);
        if (name === "Antarctica") continue;
        const mena = isMena(feat);
        const leb = name === "Lebanon";
        const alpha = mena ? 0.31 + 0.2 * p.zoom : 0.08;
        ctx!.fillStyle = leb
          ? pal.flatLebFill(0.45 + 0.26 * p.zoom)
          : mena
            ? pal.flatMenaFill(alpha)
            : pal.flatOtherFill;
        ctx!.strokeStyle = leb
          ? pal.flatLebStroke
          : mena
            ? pal.flatMenaStroke
            : pal.flatOtherStroke;
        ctx!.lineWidth = leb ? 2.6 : mena ? 0.9 : 0.45;
        eachRing(feat, (ring) => {
          ctx!.beginPath();
          let started = false;
          let count = 0;
          let lastX = 0;
          for (const c of ring) {
            const pt = flatProject(c[0], c[1], p);
            if (started && Math.abs(pt.x - lastX) > width * 0.65)
              started = false;
            if (!started) {
              ctx!.moveTo(pt.x, pt.y);
              started = true;
            } else ctx!.lineTo(pt.x, pt.y);
            lastX = pt.x;
            count++;
          }
          if (count > 2) {
            ctx!.closePath();
            ctx!.fill();
            ctx!.stroke();
          }
        });
      }
      ctx!.restore();
    }

    function drawFlatRoutes(p: FlatDrawParams, time: number): void {
      const dest = flatProject(BEIRUT.lon, BEIRUT.lat, p);
      ctx!.save();
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      for (const [i, r] of ROUTES.entries()) {
        const a = flatProject(r.lon, r.lat, p);
        const active = smoothstep(0.58, 0.86, progress);
        ctx!.globalAlpha = active * (0.52 + 0.28 * Math.sin(time * 2 + i));
        ctx!.strokeStyle = pal.routeLine(r.color);
        ctx!.lineWidth = 1.8;
        ctx!.setLineDash([10, 12]);
        ctx!.lineDashOffset = -time * 55 - i * 12;
        const cp = {
          x: (a.x + dest.x) / 2 + (i % 2 ? -42 : 42),
          y: Math.min(a.y, dest.y) - 60 - i * 4,
        };
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.quadraticCurveTo(cp.x, cp.y, dest.x, dest.y);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.globalAlpha = active;
        ctx!.fillStyle = pal.routeLine(r.color);
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, 3.2, 0, Math.PI * 2);
        ctx!.fill();
        if (progress > 0.82 && inView(a.x, a.y, 90)) {
          ctx!.font = "700 10px Inter, system-ui, sans-serif";
          ctx!.fillStyle = pal.routeLabel;
          ctx!.fillText(r.name, a.x + 7, a.y - 6);
        }
      }
      ctx!.globalAlpha = 1;
      ctx!.restore();
    }

    function drawSatellites(p: FlatDrawParams, time: number): void {
      const l = flatProject(LEBANON.lon, LEBANON.lat, p);
      ctx!.save();
      ctx!.globalAlpha = smoothstep(0.66, 0.94, progress);
      for (const sat of satellites) {
        const a = sat.angle + time * sat.speed;
        const rx = width * sat.radius * (1 + 0.15 * Math.sin(sat.tilt));
        const ry = height * sat.radius * 0.38;
        const x = l.x + Math.cos(a) * rx;
        const y = l.y + Math.sin(a + sat.tilt) * ry;
        if (!inView(x, y, 80)) continue;
        ctx!.save();
        ctx!.translate(x, y);
        ctx!.rotate(a + Math.PI / 2);
        ctx!.fillStyle = pal.satelliteColor;
        ctx!.shadowColor = pal.satelliteColor;
        ctx!.shadowBlur = 16;
        ctx!.beginPath();
        ctx!.moveTo(0, -7);
        ctx!.lineTo(5, 6);
        ctx!.lineTo(0, 3);
        ctx!.lineTo(-5, 6);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
        ctx!.strokeStyle = pal.satelliteOrbit;
        ctx!.lineWidth = 0.8;
        ctx!.beginPath();
        ctx!.ellipse(l.x, l.y, rx, ry, 0, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawLabels(p: FlatDrawParams): void {
      const a = smoothstep(0.73, 0.96, progress);
      if (a <= 0.01) return;
      ctx!.save();
      ctx!.globalAlpha = a;
      for (const lab of LABELS) {
        const pt = flatProject(lab.lon, lab.lat, p);
        if (!inView(pt.x, pt.y, 80)) continue;
        if (lab.important) {
          ctx!.font = "900 18px Inter, system-ui, sans-serif";
          ctx!.fillStyle = pal.labelImportant;
          ctx!.shadowColor = pal.labelImportantShadow;
          ctx!.shadowBlur = 22;
          ctx!.fillText(lab.name, pt.x + 18, pt.y - 20);
          ctx!.shadowBlur = 0;
        } else if (lab.city) {
          ctx!.font = "750 11px Inter, system-ui, sans-serif";
          ctx!.fillStyle = pal.labelCity;
          ctx!.fillText(lab.name, pt.x + 8, pt.y + 3);
        } else {
          ctx!.font = lab.water
            ? "italic 700 12px Inter, system-ui, sans-serif"
            : "800 12px Inter, system-ui, sans-serif";
          ctx!.fillStyle = lab.water ? pal.labelWater : pal.labelLand;
          ctx!.fillText(lab.name, pt.x, pt.y);
        }
      }
      ctx!.restore();
    }

    function drawLebanonOverlay(p: FlatDrawParams, time: number): void {
      const l = flatProject(LEBANON.lon, LEBANON.lat, p);
      const b = flatProject(BEIRUT.lon, BEIRUT.lat, p);
      const alpha = smoothstep(0.6, 0.88, progress);
      ctx!.save();
      ctx!.globalAlpha = alpha;
      const pulse = (time * 1.28) % 1;
      for (let i = 0; i < 4; i++) {
        const r = 18 + i * 19 + pulse * 32;
        ctx!.strokeStyle = pal.overlayRing((1 - pulse) * (0.4 - i * 0.07));
        ctx!.lineWidth = i === 0 ? 1.7 : 1.0;
        ctx!.beginPath();
        ctx!.arc(l.x, l.y, r, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.strokeStyle = pal.overlayCrosshair;
      ctx!.lineWidth = 1.2;
      ctx!.beginPath();
      ctx!.moveTo(l.x - 54, l.y);
      ctx!.lineTo(l.x - 17, l.y);
      ctx!.moveTo(l.x + 17, l.y);
      ctx!.lineTo(l.x + 54, l.y);
      ctx!.moveTo(l.x, l.y - 54);
      ctx!.lineTo(l.x, l.y - 17);
      ctx!.moveTo(l.x, l.y + 17);
      ctx!.lineTo(l.x, l.y + 54);
      ctx!.stroke();
      ctx!.save();
      ctx!.translate(l.x, l.y);
      ctx!.rotate(-0.68 + 0.05 * Math.sin(time * 2));
      ctx!.fillStyle = pal.overlayPin;
      ctx!.shadowColor = pal.overlayPinShadow;
      ctx!.shadowBlur = 26;
      ctx!.beginPath();
      ctx!.moveTo(0, -17);
      ctx!.lineTo(10, 14);
      ctx!.lineTo(0, 8);
      ctx!.lineTo(-10, 14);
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();
      ctx!.shadowBlur = 0;
      ctx!.fillStyle = pal.overlayBeirutCore;
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = pal.overlayBeirutDot;
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx!.fill();
      const boxW = 250;
      const boxH = 72;
      const bx = Math.min(width - boxW - 22, Math.max(22, l.x + 38));
      const by = Math.max(22, Math.min(height - boxH - 22, l.y - 92));
      ctx!.fillStyle = pal.overlayBoxBg;
      roundRect(bx, by, boxW, boxH, 18);
      ctx!.fill();
      ctx!.strokeStyle = pal.overlayBoxBorder;
      ctx!.stroke();
      ctx!.font = "900 12px Inter, system-ui, sans-serif";
      ctx!.fillStyle = pal.overlayLabel;
      ctx!.fillText("GPS LOCK ACQUIRED", bx + 16, by + 24);
      ctx!.font = "900 21px Inter, system-ui, sans-serif";
      ctx!.fillStyle = pal.overlayTitle;
      ctx!.fillText("Lebanon", bx + 16, by + 49);
      ctx!.font = "700 11px Inter, system-ui, sans-serif";
      ctx!.fillStyle = pal.overlayCoords;
      ctx!.fillText("33.8547°N  ·  35.8623°E", bx + 112, by + 49);
      ctx!.restore();
    }

    function drawFlatLayer(p: FlatDrawParams, time: number): void {
      if (p.alpha <= 0.01) return;
      ctx!.save();
      ctx!.globalAlpha = p.alpha;
      drawFlatBackdrop(p, time);
      drawFlatGrid(p);
      drawFlatCountries(p);
      drawFlatRoutes(p, time);
      drawSatellites(p, time);
      drawLabels(p);
      drawLebanonOverlay(p, time);
      ctx!.restore();
    }

    function drawUnfoldCues(time: number): void {
      const u = smoothstep(0.46, 0.73, progress);
      if (u <= 0.01 || u >= 0.99) return;
      ctx!.save();
      ctx!.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      const cx = width * 0.5;
      const cy = height * (height > 720 ? 0.53 : 0.58);
      const maxR = Math.min(width, height) * lerp(0.36, 0.64, u);
      ctx!.strokeStyle = pal.unfoldStroke;
      ctx!.lineWidth = 1;
      ctx!.setLineDash([5, 11]);
      ctx!.lineDashOffset = -time * 42;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + time * 0.18;
        const x = cx + Math.cos(a) * maxR * lerp(0.35, 1, u);
        const y = cy + Math.sin(a) * maxR * 0.34;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(x, y);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);
      ctx!.fillStyle = pal.unfoldFill;
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, maxR * 1.05, maxR * 0.38, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawOneFrame(now: number): void {
      pal = PALETTES[themeRef.current];
      const time = now / 1000;
      drawBackground(time);
      const gp = globeParams(time);
      const fp = flatParams(time);
      drawFlatLayer(fp, time);
      drawSphereBase(gp, time);
      drawUnfoldCues(time);
    }

    function frame(now: number): void {
      const interval =
        currentMode === "ambient"
          ? AMBIENT_FRAME_INTERVAL_MS
          : PINNED_FRAME_INTERVAL_MS;
      if (now - lastDrawTime < interval) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      lastDrawTime = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      progress += (target - progress) * (1 - Math.pow(0.0008, dt));
      if (Math.abs(target - progress) < 0.00015) progress = target;
      drawOneFrame(now);
      rafId = requestAnimationFrame(frame);
    }

    function handleVisibilityChange(): void {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }

    const controller = new AbortController();
    fetch(GEO_DATA_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: GeoJsonCollection) => {
        geo = data;
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.error("Failed to load globe country data:", err);
      });

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;

    if (reducedMotion) {
      drawOneFrame(performance.now());
    } else {
      const isMobile = window.matchMedia(
        "(max-width: 767px), (pointer: coarse)",
      ).matches;
      if (!isMobile) {
        scrollTrigger = ScrollTrigger.create({
          trigger,
          pin: true,
          pinSpacing: true,
          start: "top top",
          end: `+=${window.innerHeight * PIN_DISTANCE_VH}`,
          scrub: true,
          onUpdate: (self) => {
            target = self.progress;
          },
          onLeave: () => {
            currentMode = "ambient";
            setMode("ambient");
          },
          onEnterBack: () => {
            currentMode = "pinned";
            setMode("pinned");
          },
        });
      } else {
        // No `pin` (the mobile-jank risk), but `scrub` alone only reads
        // scroll position -- it never pins/fixes/transforms anything, so
        // it's safe here. Real scroll-linked scrubbing, same as desktop:
        // the user's own scroll drags the globe through its phases, not a
        // fixed-duration timer. See MOBILE_SCRUB_VH for why this distance
        // is independent of the hero section's own (unchanged, 100svh)
        // height.
        scrollTrigger = ScrollTrigger.create({
          trigger,
          start: "top top",
          end: `+=${window.innerHeight * MOBILE_SCRUB_VH}`,
          scrub: true,
          onUpdate: (self) => {
            target = self.progress;
          },
          onLeave: () => {
            currentMode = "ambient";
            setMode("ambient");
          },
          onEnterBack: () => {
            currentMode = "pinned";
            setMode("pinned");
          },
        });
      }
      rafId = requestAnimationFrame(frame);
    }

    return () => {
      controller.abort();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(rafId);
      scrollTrigger?.kill();
    };
  }, [trackRef, reducedMotion]);

  // Always position:fixed, always portaled to #ambient-bg-root (a dedicated
  // node kept as <body>'s first child — see app/[locale]/layout.tsx), in
  // BOTH modes — never conditionally switching between direct-render and
  // createPortal(), and never toggling the position/parent structure. Only
  // opacity (and the internal frame-rate throttle, handled in the effect)
  // changes between "pinned" and "ambient". This is deliberate: earlier
  // versions toggled between rendering this <div> directly vs. via
  // createPortal depending on mode, which meant React saw a different
  // element type at this position on every mode change and
  // unmounted/remounted the whole subtree — including the <canvas>. The
  // running rAF loop's closures (canvas, ctx) were captured once in the
  // effect below and kept pointing at the now-detached original canvas, so
  // drawing continued invisibly forever while the new canvas never received
  // a single frame (confirmed live: exactly the "pops, then never
  // reappears" bug). A stable, always-portaled, always-fixed node means the
  // same canvas/context lives for the component's entire lifetime — only
  // its opacity changes.
  //
  // This also incidentally fixes the "pinned" positioning: since a fixed,
  // inset-0 canvas already covers the full viewport, it naturally aligns
  // with the hero section for as long as ScrollTrigger's `pin: true` holds
  // that section fixed at the viewport top too — no separate absolute/sticky
  // logic needed for the pinned case at all.
  //
  // Portaling specifically to #ambient-bg-root rather than document.body
  // directly matters too: React appends portaled content to the END of its
  // target, and during the pin GSAP's transform on <section> makes it (and
  // its z-10 content) a single stacking-context unit — CSS then breaks the
  // resulting stacking tie by DOM order, later wins. Portaling straight to
  // document.body landed us after the whole app, so the globe rendered on
  // TOP of the hero text (confirmed live). #ambient-bg-root is kept as the
  // first node in <body>, so this always loses that tiebreak instead.
  return createPortal(
    <div
      ref={wrapperRef}
      data-testid="globe-hero-background"
      data-motion-mode={reducedMotion ? "static" : "animated"}
      aria-hidden="true"
      className={
        mode === "pinned"
          ? "pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-100 transition-opacity duration-700"
          : "pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.08] transition-opacity duration-700"
      }
      style={{
        background:
          theme === "dark"
            ? "radial-gradient(circle at 72% 48%, rgba(19, 242, 207,.22), transparent 30%), radial-gradient(circle at 41% 19%, rgba(96, 165, 250,.18), transparent 28%), radial-gradient(circle at 15% 78%, rgba(255, 209, 102,.12), transparent 25%), linear-gradient(135deg,#030712 0%,#071426 43%,#03101d 100%)"
            : "radial-gradient(circle at 72% 48%, rgba(19, 242, 207,.16), transparent 30%), radial-gradient(circle at 41% 19%, rgba(96, 165, 250,.12), transparent 28%), radial-gradient(circle at 15% 78%, rgba(255, 209, 102,.1), transparent 25%), linear-gradient(135deg,#eef7f6 0%,#f5fbfa 43%,#eef6f5 100%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at 59% 51%, transparent 0 48%, rgba(1,5,12,.42) 76%, rgba(0,0,0,.84) 100%)"
              : "radial-gradient(circle at 59% 51%, transparent 0 48%, rgba(238,247,246,.5) 76%, rgba(238,247,246,.88) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />
    </div>,
    document.getElementById("ambient-bg-root") ?? document.body,
  );
}
