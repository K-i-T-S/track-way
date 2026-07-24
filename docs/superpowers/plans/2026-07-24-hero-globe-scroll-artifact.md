# Hero Globe Scroll Artifact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `lebanon_globe_zoom_v3.html`'s scroll-zoom globe into the Next.js hero as a bounded-pin, non-scroll-jacking background layer that persists as a faded ambient background after the user scrolls past the hero.

**Architecture:** A pure-math module (`lib/globe/geo-math.ts`) holds the projection/easing helpers, fully unit-tested. A single client component (`GlobeHeroBackground.tsx`) owns the canvas rendering engine, GSAP `ScrollTrigger`-driven progress, and the pinned→ambient mode switch, following this codebase's existing convention (see `components/three/FleetNetworkScene.tsx`, `components/home/LebanonGlobeZoom.tsx`) of one imperative `useEffect` per canvas/WebGL scene rather than a reconciler-based abstraction. `HeroSection.tsx` grows a tall wrapper `<section>` so `position: sticky` can hold the hero on screen for a bounded extra scroll distance; CSS alone (not JS) decides whether that extra distance exists, so there is zero layout-shift risk from client-side device detection.

**Tech Stack:** Next.js App Router, React, TypeScript strict, Tailwind, `gsap`/`gsap/ScrollTrigger` (already a dependency, not yet used anywhere else in the repo), `framer-motion`'s `useReducedMotion` (already used in `HeroSection.tsx`), Vitest + React Testing Library.

## Global Constraints

- TypeScript strict — no `any`, no implicit returns (kits-standards).
- Mobile-first: verify at 375px before 1440px (kits-standards).
- LCP < 2.5s, CLS < 0.1 — this is a client mandate already driving the existing `FleetNetworkScene` safeguards (Phase 1 spec §9a); this feature must not regress it.
- Arabic RTL: `/ar` hero must still lay out correctly (the canvas itself is not mirrored — it's geographic data).
- No new npm dependencies — `gsap`, `three`, `framer-motion` are already installed.
- Every async operation (the GEO `fetch`) needs a typed catch, per kits-standards.

---

## Task 1: Extract the world GeoJSON into a static asset

**Files:**
- Create: `public/data/world-110m.json`

**Interfaces:**
- Produces: a static JSON asset at `/data/world-110m.json`, fetched client-side by Task 3's component. Shape: `{ type: "FeatureCollection", features: [...] }` (Natural Earth 110m admin-0 countries, 177 features).

- [ ] **Step 1: Extract and validate the embedded GeoJSON**

The source file `lebanon_globe_zoom_v3.html` has the entire dataset inlined as `const GEO = {...};` on line 93 (~220KB, one line). Run this exact command from the repo root — it validates the JSON (throws if malformed) before writing anything:

```bash
mkdir -p public/data
node -e "
const fs = require('fs');
const line = fs.readFileSync('lebanon_globe_zoom_v3.html', 'utf8').split('\n')[92];
const jsonText = line.replace(/^const GEO = /, '').replace(/;\s*\$/, '');
const parsed = JSON.parse(jsonText);
if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
  throw new Error('Unexpected shape after extraction');
}
fs.writeFileSync('public/data/world-110m.json', jsonText);
console.log('wrote', parsed.features.length, 'features,', jsonText.length, 'bytes');
"
```

Expected output: `wrote 177 features, 223603 bytes`

- [ ] **Step 2: Verify the file is valid, minified JSON**

Run: `node -e "const d = require('./public/data/world-110m.json'); console.log(d.features.length)"`
Expected: `177`

- [ ] **Step 3: Commit**

```bash
git add public/data/world-110m.json
git commit -m "feat: add world country boundaries data asset for hero globe"
```

---

## Task 2: Pure geo-projection math module

**Files:**
- Create: `lib/globe/geo-math.ts`
- Test: `lib/globe/geo-math.test.ts`

**Interfaces:**
- Consumes: nothing (pure, framework-free).
- Produces (all named exports, consumed by Task 3):
  - Constants: `LEBANON: {name, lon, lat}`, `BEIRUT: {name, lon, lat}`, `ROUTES: Route[]`, `LABELS: GlobeLabel[]`, `MENA_NAMES: Set<string>`
  - Functions: `clamp(v, min?, max?): number`, `lerp(a, b, t): number`, `smoothstep(a, b, x): number`, `easeOutCubic(t): number`, `merc(lat): number`, `rad(lon): number`, `countryName(f: GeoJsonFeature): string`, `isMena(f: GeoJsonFeature): boolean`, `eachRing(feature, cb): void`, `sphereProject(lon, lat, params: SphereParams): ProjectedPoint`, `flatProject(lon, lat, params: FlatParams): {x, y}`
  - Types: `GeoJsonFeature`, `GeoJsonCollection`, `SphereParams`, `FlatParams`, `ProjectedPoint`, `Route`, `GlobeLabel`

- [ ] **Step 1: Write the failing tests**

Create `lib/globe/geo-math.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  clamp,
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
  type GeoJsonFeature,
} from "./geo-math";

describe("clamp", () => {
  it("clamps values outside the default 0-1 range", () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(1.5)).toBe(1);
    expect(clamp(0.5)).toBe(0.5);
  });

  it("clamps against custom min/max", () => {
    expect(clamp(-10, -5, 5)).toBe(-5);
    expect(clamp(10, -5, 5)).toBe(5);
  });
});

describe("lerp", () => {
  it("interpolates linearly between two values", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("smoothstep", () => {
  it("is 0 at or before the lower edge and 1 at or after the upper edge", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("eases through the midpoint", () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 5);
  });
});

describe("easeOutCubic", () => {
  it("maps 0 to 0 and 1 to 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("front-loads the easing (already past the midpoint value at t=0.5)", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("merc", () => {
  it("is monotonically increasing with latitude", () => {
    expect(merc(10)).toBeGreaterThan(merc(0));
    expect(merc(-10)).toBeLessThan(merc(0));
  });

  it("is 0 at the equator", () => {
    expect(merc(0)).toBeCloseTo(0, 10);
  });
});

describe("rad", () => {
  it("converts degrees to radians", () => {
    expect(rad(180)).toBeCloseTo(Math.PI, 10);
    expect(rad(0)).toBe(0);
  });
});

function feature(props: Record<string, unknown>): GeoJsonFeature {
  return {
    type: "Feature",
    properties: props,
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
  };
}

describe("countryName", () => {
  it("prefers ADMIN, falls back to NAME_LONG then NAME", () => {
    expect(countryName(feature({ ADMIN: "Lebanon", NAME: "LB" }))).toBe("Lebanon");
    expect(countryName(feature({ NAME_LONG: "Lebanon Long", NAME: "LB" }))).toBe(
      "Lebanon Long",
    );
    expect(countryName(feature({ NAME: "LB" }))).toBe("LB");
  });
});

describe("isMena", () => {
  it("matches known MENA countries by name", () => {
    expect(isMena(feature({ ADMIN: "Lebanon" }))).toBe(true);
    expect(isMena(feature({ ADMIN: "Egypt" }))).toBe(true);
  });

  it("does not match non-MENA countries", () => {
    expect(isMena(feature({ ADMIN: "France" }))).toBe(false);
  });
});

describe("eachRing", () => {
  it("visits each ring of a Polygon once", () => {
    const f = feature({ ADMIN: "Test" });
    const rings: number[][][] = [];
    eachRing(f, (ring) => rings.push(ring));
    expect(rings).toHaveLength(1);
  });

  it("visits every ring of every polygon in a MultiPolygon", () => {
    const f: GeoJsonFeature = {
      type: "Feature",
      properties: { ADMIN: "Test" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[0, 0], [1, 0], [1, 1], [0, 0]]],
          [[[2, 2], [3, 2], [3, 3], [2, 2]]],
        ],
      },
    };
    const rings: number[][][] = [];
    eachRing(f, (ring) => rings.push(ring));
    expect(rings).toHaveLength(2);
  });

  it("does nothing when geometry is null", () => {
    const f: GeoJsonFeature = { type: "Feature", properties: {}, geometry: null };
    let calls = 0;
    eachRing(f, () => calls++);
    expect(calls).toBe(0);
  });
});

describe("sphereProject", () => {
  const params = { cx: 100, cy: 100, r: 50, centerLon: 0, centerLat: 0 };

  it("projects the center point to the sphere's screen center, facing the viewer", () => {
    const p = sphereProject(0, 0, params);
    expect(p.x).toBeCloseTo(100, 5);
    expect(p.y).toBeCloseTo(100, 5);
    expect(p.z).toBeCloseTo(1, 5);
  });

  it("projects the antipodal point to the far side (negative z)", () => {
    const p = sphereProject(180, 0, params);
    expect(p.z).toBeCloseTo(-1, 5);
  });
});

describe("flatProject", () => {
  const params = { cx: 200, cy: 200, centerLon: 35, centerLat: 33, scale: 10 };

  it("projects the center coordinate to the screen center", () => {
    const p = flatProject(35, 33, params);
    expect(p.x).toBeCloseTo(200, 5);
    expect(p.y).toBeCloseTo(200, 5);
  });

  it("moves right for greater longitude and up for greater latitude", () => {
    const east = flatProject(40, 33, params);
    const north = flatProject(35, 40, params);
    expect(east.x).toBeGreaterThan(200);
    expect(north.y).toBeLessThan(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/globe/geo-math.test.ts`
Expected: FAIL — `Cannot find module './geo-math'`

- [ ] **Step 3: Implement `lib/globe/geo-math.ts`**

```ts
export const DEG = Math.PI / 180;

export const LEBANON = { name: "Lebanon", lon: 35.8623, lat: 33.8547 };
export const BEIRUT = { name: "Beirut", lon: 35.5018, lat: 33.8938 };

export interface Route {
  name: string;
  lon: number;
  lat: number;
  color: string;
}

export const ROUTES: Route[] = [
  { name: "Istanbul", lon: 28.9784, lat: 41.0082, color: "#64f4ff" },
  { name: "Cairo", lon: 31.2357, lat: 30.0444, color: "#ffd166" },
  { name: "Dubai", lon: 55.2708, lat: 25.2048, color: "#6dffac" },
  { name: "Riyadh", lon: 46.6753, lat: 24.7136, color: "#64f4ff" },
  { name: "Amman", lon: 35.9304, lat: 31.9539, color: "#ffd166" },
  { name: "Larnaca", lon: 33.6233, lat: 34.9182, color: "#6dffac" },
];

export interface GlobeLabel {
  name: string;
  lon: number;
  lat: number;
  important?: boolean;
  city?: boolean;
  water?: boolean;
}

export const LABELS: GlobeLabel[] = [
  { name: "LEBANON", lon: 35.86, lat: 33.9, important: true },
  { name: "Beirut", lon: 35.5, lat: 33.89, city: true },
  { name: "Tripoli", lon: 35.85, lat: 34.44, city: true },
  { name: "Sidon", lon: 35.37, lat: 33.56, city: true },
  { name: "Syria", lon: 38.2, lat: 35.1 },
  { name: "Jordan", lon: 36.1, lat: 31.2 },
  { name: "Cyprus", lon: 33.1, lat: 35.1 },
  { name: "Türkiye", lon: 35.1, lat: 39.0 },
  { name: "Egypt", lon: 30.2, lat: 27.2 },
  { name: "Saudi Arabia", lon: 44.5, lat: 23.5 },
  { name: "Iraq", lon: 43.9, lat: 33.1 },
  { name: "Mediterranean Sea", lon: 30.2, lat: 34.6, water: true },
];

export const MENA_NAMES = new Set([
  "Algeria",
  "Bahrain",
  "Cyprus",
  "Djibouti",
  "Egypt",
  "Iran",
  "Iraq",
  "Israel",
  "Jordan",
  "Kuwait",
  "Lebanon",
  "Libya",
  "Mauritania",
  "Morocco",
  "Oman",
  "Palestine",
  "Qatar",
  "Saudi Arabia",
  "Somalia",
  "Sudan",
  "Syria",
  "Tunisia",
  "Turkey",
  "United Arab Emirates",
  "Yemen",
  "Western Sahara",
  "W. Sahara",
  "S. Sudan",
]);

export const clamp = (v: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);

export const merc = (lat: number): number =>
  Math.log(Math.tan(Math.PI / 4 + (clamp(lat, -84, 84) * DEG) / 2));

export const rad = (lon: number): number => lon * DEG;

export interface GeoJsonFeature {
  type: "Feature";
  properties: {
    ADMIN?: string;
    NAME?: string;
    NAME_LONG?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  } | null;
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export const countryName = (f: GeoJsonFeature): string =>
  f.properties.ADMIN || f.properties.NAME_LONG || f.properties.NAME || "";

export const isMena = (f: GeoJsonFeature): boolean =>
  MENA_NAMES.has(countryName(f)) ||
  MENA_NAMES.has(String(f.properties.NAME)) ||
  MENA_NAMES.has(String(f.properties.NAME_LONG));

export function eachRing(
  feature: GeoJsonFeature,
  cb: (ring: number[][], feature: GeoJsonFeature) => void,
): void {
  const geom = feature.geometry;
  if (!geom) return;
  if (geom.type === "Polygon") {
    (geom.coordinates as number[][][]).forEach((r) => cb(r, feature));
  } else if (geom.type === "MultiPolygon") {
    (geom.coordinates as number[][][][]).forEach((poly) =>
      poly.forEach((r) => cb(r, feature)),
    );
  }
}

export interface SphereParams {
  cx: number;
  cy: number;
  r: number;
  centerLon: number;
  centerLat: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

export function sphereProject(
  lon: number,
  lat: number,
  params: SphereParams,
): ProjectedPoint {
  const lambda = (lon - params.centerLon) * DEG;
  const phi = lat * DEG;
  const phi0 = params.centerLat * DEG;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const x = cosPhi * Math.sin(lambda);
  const y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * Math.cos(lambda);
  const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * Math.cos(lambda);
  return { x: params.cx + params.r * x, y: params.cy - params.r * y, z };
}

export interface FlatParams {
  cx: number;
  cy: number;
  centerLon: number;
  centerLat: number;
  scale: number;
}

export function flatProject(
  lon: number,
  lat: number,
  p: FlatParams,
): { x: number; y: number } {
  return {
    x: p.cx + (rad(lon) - rad(p.centerLon)) * p.scale,
    y: p.cy - (merc(lat) - merc(p.centerLat)) * p.scale,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/globe/geo-math.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add lib/globe/geo-math.ts lib/globe/geo-math.test.ts
git commit -m "feat: add pure geo-projection math module for hero globe"
```

---

## Task 3: `GlobeHeroBackground` component

**Files:**
- Create: `components/home/GlobeHeroBackground.tsx`
- Test: `components/home/GlobeHeroBackground.test.tsx`

**Interfaces:**
- Consumes: everything from Task 2's `lib/globe/geo-math`; the static asset from Task 1 at `/data/world-110m.json`.
- Produces (consumed by Task 4):
  - `GlobeHeroBackground({ trackRef }: { trackRef: RefObject<HTMLElement | null> }): React.ReactElement` — named export.

**Design notes for the implementer:**
- This project's canvas/WebGL scenes (`FleetNetworkScene.tsx`, `LebanonGlobeZoom.tsx`) are built as one imperative `useEffect` with nested closures, not decomposed into many small functions — follow that precedent here rather than introducing a new pattern.
- `canvas.getContext("2d")` returns `null` under plain jsdom (no canvas polyfill is installed in this repo — confirmed by grepping `package.json`, and confirmed by the fact `FleetNetworkScene`/`LebanonGlobeZoom` have zero tests for exactly this reason). The effect must bail out early when `ctx` is `null`; this makes the imperative rendering/scroll logic itself **not unit-testable** in this codebase, same as the precedent components. This task's tests therefore cover only the parts that don't require a working canvas context: the decorative-element contract (`aria-hidden`, testid) and the `data-motion-mode` attribute, both driven by `useReducedMotion()` at the React level (evaluated before the canvas effect even runs). The scroll-driven pin, the pin/autoplay branch, and the ambient phase are verified manually in Task 5 — say so plainly rather than writing tests that don't actually exercise that code.
- Whether there's a meaningful pin is decided by **measuring**, not by duplicating a breakpoint: the effect reads `trigger.offsetHeight - window.innerHeight` at setup time. `HeroSection.tsx` (Task 4) decides via a pure CSS media query whether the tall section exists at all; this component just reacts to however tall it turns out to be. This avoids two independent places (a CSS breakpoint and a JS `matchMedia` check) ever disagreeing about whether "mobile" applies.
- The user-drag-to-explore and keyboard-arrow controls from the source artifact are intentionally dropped — this is a decorative, `aria-hidden` background element now, not an interactive demo; there is no DOM UI panel for it to update either (see Task 4's spec §3/§7 decisions).

- [ ] **Step 1: Write the failing tests**

Create `components/home/GlobeHeroBackground.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { GlobeHeroBackground } from "./GlobeHeroBackground";

vi.mock("gsap", () => ({ gsap: { registerPlugin: vi.fn(), to: vi.fn() } }));
vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })) },
}));

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ type: "FeatureCollection", features: [] }),
  } as unknown as Response);
  stubMatchMedia(false);
});

describe("GlobeHeroBackground", () => {
  it("renders as a decorative, non-interactive full-bleed layer", () => {
    const trackRef = createRef<HTMLElement>();
    render(<GlobeHeroBackground trackRef={trackRef} />);
    const el = screen.getByTestId("globe-hero-background");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("marks itself animated when the OS has no reduced-motion preference", () => {
    stubMatchMedia(false);
    const trackRef = createRef<HTMLElement>();
    render(<GlobeHeroBackground trackRef={trackRef} />);
    expect(screen.getByTestId("globe-hero-background")).toHaveAttribute(
      "data-motion-mode",
      "animated",
    );
  });

  it("marks itself static when the OS requests reduced motion", () => {
    stubMatchMedia(true);
    const trackRef = createRef<HTMLElement>();
    render(<GlobeHeroBackground trackRef={trackRef} />);
    expect(screen.getByTestId("globe-hero-background")).toHaveAttribute(
      "data-motion-mode",
      "static",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/home/GlobeHeroBackground.test.tsx`
Expected: FAIL — `Cannot find module './GlobeHeroBackground'`

- [ ] **Step 3: Implement `components/home/GlobeHeroBackground.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  LEBANON,
  BEIRUT,
  ROUTES,
  LABELS,
  clamp,
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
// How much extra scroll room counts as "a real pin", in pixels. Not tied to
// HeroSection.tsx's 180vh figure by anything other than 180vh always being
// comfortably larger than this at any real viewport height — no shared
// constant is needed between the two files.
const MIN_RUNWAY_PX = 100;
const AMBIENT_OPACITY = 0.08;
const AMBIENT_FRAME_INTERVAL_MS = 66; // ~15fps

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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const trigger = trackRef.current;
    if (!wrapper || !canvas || !trigger) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let progress = reducedMotion ? 1 : 0;
    let target = progress;
    let currentMode: "pinned" | "ambient" = "pinned";
    let geo: GeoJsonCollection | null = null;
    let rafId = 0;
    let last = performance.now();
    let lastAmbientDraw = 0;

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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    function roundRect(x: number, y: number, w: number, h: number, r: number): void {
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
        r: Math.min(width, height) * lerp(0.31, 0.72, smoothstep(0.08, 0.58, progress)),
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
      const idleDrift = currentMode === "ambient" ? Math.sin(time * 0.05) * 0.6 : 0;
      return {
        cx,
        cy,
        centerLon: lerp(mena.centerLon, lev.centerLon, easeOutCubic(g)) + idleDrift,
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
      grd.addColorStop(0, "rgba(22,242,207,.12)");
      grd.addColorStop(0.28, "rgba(21,67,111,.17)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grd;
      ctx!.fillRect(0, 0, width, height);
      for (const s of stars) {
        const x = ((s.x + Math.sin(time * s.drift + s.phase) * 0.008) % 1) * width;
        const y = ((s.y + time * s.drift * 0.03) % 1) * height;
        ctx!.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(time * 1.5 + s.phase));
        ctx!.fillStyle = "#dffbff";
        ctx!.beginPath();
        ctx!.arc(x, y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function drawGlobeGrid(p: GlobeDrawParams): void {
      ctx!.save();
      ctx!.lineWidth = 0.8;
      ctx!.strokeStyle = "rgba(162, 235, 255, .16)";
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx!.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 3) {
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
        for (let lat = -85; lat <= 85; lat += 2) {
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
        ctx!.fillStyle = mena ? "rgba(24,242,207,.30)" : "rgba(96, 205, 190, .20)";
        ctx!.strokeStyle = mena ? "rgba(255, 209, 102, .42)" : "rgba(180, 235, 255, .18)";
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
            ? "rgba(255,209,102,.45)"
            : r.color === "#6dffac"
              ? "rgba(109,255,172,.45)"
              : "rgba(100,244,255,.45)";
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
        ctx!.strokeStyle = `rgba(109,255,172,${(1 - pulse) * (0.34 - i * 0.08)})`;
        ctx!.lineWidth = 1.3;
        ctx!.beginPath();
        ctx!.arc(0, 0, rr, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.fillStyle = "#ffffff";
      ctx!.beginPath();
      ctx!.arc(0, 0, 4.6 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "#6dffac";
      ctx!.beginPath();
      ctx!.arc(0, 0, 2.3 * s, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "rgba(255,255,255,.72)";
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
        ctx!.fillStyle = "rgba(230,255,252,.96)";
        ctx!.fillText("LEBANON", 13 * s, -12 * s);
      }
      ctx!.restore();
    }

    function drawSphereBase(p: GlobeDrawParams, time: number): void {
      if (p.alpha <= 0.01) return;
      ctx!.save();
      ctx!.globalAlpha = p.alpha;
      const halo = ctx!.createRadialGradient(p.cx, p.cy, p.r * 0.72, p.cx, p.cy, p.r * 1.45);
      halo.addColorStop(0, "rgba(100,244,255,0)");
      halo.addColorStop(0.58, "rgba(100,244,255,.10)");
      halo.addColorStop(1, "rgba(100,244,255,0)");
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
      ocean.addColorStop(0, "rgba(94, 247, 255,.35)");
      ocean.addColorStop(0.2, "rgba(36, 107, 154,.48)");
      ocean.addColorStop(0.68, "rgba(8, 34, 64,.86)");
      ocean.addColorStop(1, "rgba(2, 8, 24,.96)");
      ctx!.fillStyle = ocean;
      ctx!.beginPath();
      ctx!.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "rgba(170,245,255,.46)";
      ctx!.lineWidth = 1.4;
      ctx!.stroke();
      ctx!.clip();

      const limb = ctx!.createRadialGradient(p.cx, p.cy, p.r * 0.3, p.cx, p.cy, p.r);
      limb.addColorStop(0.72, "rgba(255,255,255,0)");
      limb.addColorStop(1, "rgba(100,244,255,.22)");
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
      bg.addColorStop(0, "rgba(8,26,46,.28)");
      bg.addColorStop(0.5, "rgba(3,18,31,.62)");
      bg.addColorStop(1, "rgba(2,9,21,.46)");
      roundRect(rx, ry, rw, rh, 34);
      ctx!.fillStyle = bg;
      ctx!.fill();
      ctx!.strokeStyle = `rgba(120, 225, 255, ${0.1 + 0.22 * fold})`;
      ctx!.lineWidth = 1.2;
      ctx!.stroke();
      const creaseX = lerp(width * 0.78, width * 0.18, fold);
      const sheen = ctx!.createLinearGradient(creaseX - 160, 0, creaseX + 160, 0);
      sheen.addColorStop(0, "rgba(255,255,255,0)");
      sheen.addColorStop(0.5, `rgba(100,244,255,${0.2 * (1 - Math.abs(fold - 0.55))})`);
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = sheen;
      roundRect(rx, ry, rw, rh, 34);
      ctx!.fill();
      ctx!.strokeStyle = `rgba(255,255,255,${0.08 * (1 - fold) + 0.08 * Math.sin(time * 2)})`;
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
      ctx!.strokeStyle = "rgba(141, 223, 255, .15)";
      ctx!.setLineDash([2, 7]);
      for (let lon = -180; lon <= 180; lon += 5) {
        const a = flatProject(lon, -72, p);
        const b = flatProject(lon, 75, p);
        if ((a.x < -60 && b.x < -60) || (a.x > width + 60 && b.x > width + 60)) continue;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
      for (let lat = -80; lat <= 80; lat += 5) {
        const a = flatProject(-180, lat, p);
        const b = flatProject(180, lat, p);
        if ((a.y < -60 && b.y < -60) || (a.y > height + 60 && b.y > height + 60)) continue;
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
          ? `rgba(109,255,172,${0.45 + 0.26 * p.zoom})`
          : mena
            ? `rgba(28, 219, 207, ${alpha})`
            : "rgba(93,124,163,.12)";
        ctx!.strokeStyle = leb
          ? "rgba(255,255,255,.92)"
          : mena
            ? "rgba(186, 247, 255, .36)"
            : "rgba(142, 180, 205, .14)";
        ctx!.lineWidth = leb ? 2.6 : mena ? 0.9 : 0.45;
        eachRing(feat, (ring) => {
          ctx!.beginPath();
          let started = false;
          let count = 0;
          let lastX = 0;
          for (const c of ring) {
            const pt = flatProject(c[0], c[1], p);
            if (started && Math.abs(pt.x - lastX) > width * 0.65) started = false;
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
      for (let i = 0; i < ROUTES.length; i++) {
        const r = ROUTES[i];
        const a = flatProject(r.lon, r.lat, p);
        const active = smoothstep(0.58, 0.86, progress);
        ctx!.globalAlpha = active * (0.52 + 0.28 * Math.sin(time * 2 + i));
        ctx!.strokeStyle = r.color;
        ctx!.lineWidth = 1.8;
        ctx!.setLineDash([10, 12]);
        ctx!.lineDashOffset = -time * 55 - i * 12;
        const cp = { x: (a.x + dest.x) / 2 + (i % 2 ? -42 : 42), y: Math.min(a.y, dest.y) - 60 - i * 4 };
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.quadraticCurveTo(cp.x, cp.y, dest.x, dest.y);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.globalAlpha = active;
        ctx!.fillStyle = r.color;
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, 3.2, 0, Math.PI * 2);
        ctx!.fill();
        if (progress > 0.82 && inView(a.x, a.y, 90)) {
          ctx!.font = "700 10px Inter, system-ui, sans-serif";
          ctx!.fillStyle = "rgba(231,251,255,.82)";
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
        ctx!.fillStyle = "rgba(100,244,255,.85)";
        ctx!.shadowColor = "rgba(100,244,255,.85)";
        ctx!.shadowBlur = 16;
        ctx!.beginPath();
        ctx!.moveTo(0, -7);
        ctx!.lineTo(5, 6);
        ctx!.lineTo(0, 3);
        ctx!.lineTo(-5, 6);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
        ctx!.strokeStyle = "rgba(100,244,255,.07)";
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
          ctx!.fillStyle = "rgba(255,255,255,.96)";
          ctx!.shadowColor = "rgba(109,255,172,.75)";
          ctx!.shadowBlur = 22;
          ctx!.fillText(lab.name, pt.x + 18, pt.y - 20);
          ctx!.shadowBlur = 0;
        } else if (lab.city) {
          ctx!.font = "750 11px Inter, system-ui, sans-serif";
          ctx!.fillStyle = "rgba(226,251,255,.78)";
          ctx!.fillText(lab.name, pt.x + 8, pt.y + 3);
        } else {
          ctx!.font = lab.water
            ? "italic 700 12px Inter, system-ui, sans-serif"
            : "800 12px Inter, system-ui, sans-serif";
          ctx!.fillStyle = lab.water ? "rgba(117,206,255,.36)" : "rgba(205,228,235,.45)";
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
        ctx!.strokeStyle = `rgba(109,255,172,${(1 - pulse) * (0.4 - i * 0.07)})`;
        ctx!.lineWidth = i === 0 ? 1.7 : 1.0;
        ctx!.beginPath();
        ctx!.arc(l.x, l.y, r, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.strokeStyle = "rgba(255,255,255,.84)";
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
      ctx!.fillStyle = "#6dffac";
      ctx!.shadowColor = "rgba(109,255,172,.88)";
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
      ctx!.fillStyle = "#fff";
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "#ff5a77";
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx!.fill();
      const boxW = 250;
      const boxH = 72;
      const bx = Math.min(width - boxW - 22, Math.max(22, l.x + 38));
      const by = Math.max(22, Math.min(height - boxH - 22, l.y - 92));
      ctx!.fillStyle = "rgba(4, 16, 30, .72)";
      roundRect(bx, by, boxW, boxH, 18);
      ctx!.fill();
      ctx!.strokeStyle = "rgba(109,255,172,.34)";
      ctx!.stroke();
      ctx!.font = "900 12px Inter, system-ui, sans-serif";
      ctx!.fillStyle = "#6dffac";
      ctx!.fillText("GPS LOCK ACQUIRED", bx + 16, by + 24);
      ctx!.font = "900 21px Inter, system-ui, sans-serif";
      ctx!.fillStyle = "#ffffff";
      ctx!.fillText("Lebanon", bx + 16, by + 49);
      ctx!.font = "700 11px Inter, system-ui, sans-serif";
      ctx!.fillStyle = "rgba(203,230,238,.72)";
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
      ctx!.strokeStyle = "rgba(100,244,255,.18)";
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
      ctx!.fillStyle = "rgba(255,209,102,.10)";
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, maxR * 1.05, maxR * 0.38, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawOneFrame(now: number): void {
      const time = now / 1000;
      drawBackground(time);
      const gp = globeParams(time);
      const fp = flatParams(time);
      drawFlatLayer(fp, time);
      drawSphereBase(gp, time);
      drawUnfoldCues(time);
    }

    function frame(now: number): void {
      if (currentMode === "ambient" && now - lastAmbientDraw < AMBIENT_FRAME_INTERVAL_MS) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      lastAmbientDraw = now;
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

    let scrollTrigger: ScrollTrigger | null = null;

    if (reducedMotion) {
      drawOneFrame(performance.now());
    } else {
      const runway = trigger.offsetHeight - window.innerHeight;
      const usePin = runway > MIN_RUNWAY_PX;
      if (usePin) {
        scrollTrigger = ScrollTrigger.create({
          trigger,
          start: "top top",
          end: "bottom bottom",
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
        const tweenTarget = { value: 0 };
        scrollTrigger = ScrollTrigger.create({
          trigger,
          start: "top center",
          end: "bottom bottom",
          onEnter: () => {
            gsap.to(tweenTarget, {
              value: 1,
              duration: 2,
              ease: "power2.out",
              onUpdate: () => {
                target = tweenTarget.value;
              },
            });
          },
          onLeave: () => {
            currentMode = "ambient";
            setMode("ambient");
          },
          onEnterBack: () => {
            currentMode = "pinned";
            setMode("pinned");
            target = 1;
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

  return (
    <div
      ref={wrapperRef}
      data-testid="globe-hero-background"
      data-motion-mode={reducedMotion ? "static" : "animated"}
      aria-hidden="true"
      className={
        mode === "pinned"
          ? "sticky top-0 z-0 h-[100svh] w-full overflow-hidden"
          : "fixed inset-0 z-0 overflow-hidden opacity-[0.08] transition-opacity duration-700"
      }
      style={{
        background:
          "radial-gradient(circle at 72% 48%, rgba(19, 242, 207,.22), transparent 30%), radial-gradient(circle at 41% 19%, rgba(96, 165, 250,.18), transparent 28%), radial-gradient(circle at 15% 78%, rgba(255, 209, 102,.12), transparent 25%), linear-gradient(135deg,#030712 0%,#071426 43%,#03101d 100%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 59% 51%, transparent 0 48%, rgba(1,5,12,.42) 76%, rgba(0,0,0,.84) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/home/GlobeHeroBackground.test.tsx`
Expected: PASS (all 3 tests green)

- [ ] **Step 5: Run the type checker**

Run: `npx tsc --noEmit`
Expected: no errors. `ScrollTrigger`'s type needs importing for the `let scrollTrigger: ScrollTrigger | null` annotation — it's exported from `gsap/ScrollTrigger` as both a value and (via `gsap`'s bundled types) usable as a type here; if `tsc` flags it, change the annotation to `ReturnType<typeof ScrollTrigger.create> | null` instead, which sidesteps needing the type import.

- [ ] **Step 6: Commit**

```bash
git add components/home/GlobeHeroBackground.tsx components/home/GlobeHeroBackground.test.tsx
git commit -m "feat: add scroll-driven hero globe background component"
```

---

## Task 4: Integrate into `HeroSection.tsx`, remove superseded components

**Files:**
- Modify: `components/home/HeroSection.tsx`
- Delete: `components/home/BackgroundAnimation.tsx`
- Delete: `components/home/LebanonGlobeZoom.tsx`

**Interfaces:**
- Consumes: `GlobeHeroBackground` from Task 3.

- [ ] **Step 1: Delete the superseded components**

```bash
git rm components/home/BackgroundAnimation.tsx components/home/LebanonGlobeZoom.tsx
```

- [ ] **Step 2: Rewrite `components/home/HeroSection.tsx`**

Replace the full file with:

```tsx
"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Radio, ArrowRight, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { DotGridBackground } from "@/components/ui/DotGridBackground";

const GlobeHeroBackground = dynamic(
  () =>
    import("@/components/home/GlobeHeroBackground").then(
      (mod) => mod.GlobeHeroBackground,
    ),
  { ssr: false },
);

interface HeroSectionProps {
  locale: Locale;
  headline: string;
  subheadline: string;
}

export function HeroSection({
  locale,
  headline,
  subheadline,
}: HeroSectionProps): React.ReactElement {
  const t = useTranslations("homepage");
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={trackRef}
      className="relative min-h-[100svh] overflow-hidden motion-safe:md:min-h-[calc(100svh+180vh)]"
    >
      {/* GlobeHeroBackground must stay a direct child of this <section>, never nested
          inside a motion.* element — a CSS transform on an ancestor would break the
          `position: fixed` it switches to for the post-hero ambient phase. */}
      <GlobeHeroBackground trackRef={trackRef} />

      <div className="sticky top-0 z-10 flex min-h-[100svh] items-center overflow-hidden">
        <DotGridBackground variant="world" />
        <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-accentWarm/10 blur-[120px]" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-32 lg:grid-cols-2 lg:px-10">
          <div className="text-center lg:text-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent"
            >
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              {t("heroBadge")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-lg text-muted lg:mx-0"
            >
              {subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link
                href={`/${locale}/book-installation`}
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-background shadow-xl shadow-accent/25 transition-transform hover:scale-105"
              >
                {t("heroCtaPrimary")}
                <ArrowRight
                  className="h-4 w-4 transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/10"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {t("heroCtaSecondary")}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mx-auto h-[340px] w-[340px] sm:h-[420px] sm:w-[420px] lg:h-[500px] lg:w-[500px]"
          >
            {!reduceMotion && (
              <>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  aria-hidden="true"
                  className="absolute start-0 top-6 rounded-xl border border-white/10 bg-background/80 px-3 py-2 text-xs text-foreground shadow-xl backdrop-blur"
                >
                  {t("heroFloatingA")}
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  aria-hidden="true"
                  className="absolute bottom-8 end-0 rounded-xl border border-white/10 bg-background/80 px-3 py-2 text-xs text-foreground shadow-xl backdrop-blur"
                >
                  {t("heroFloatingB")}
                </motion.div>
              </>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest">
              {t("scrollHint")}
            </span>
            <div className="h-8 w-5 rounded-full border border-white/20 p-1">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

Notes on what changed from the current (uncommitted) version:
- `min-h-[100svh]` → `min-h-[100svh] motion-safe:md:min-h-[calc(100svh+180vh)]` on the root `<section>`: the extra 180vh pin runway only exists on screens ≥768px (Tailwind `md:`) when the OS has no reduced-motion preference (Tailwind `motion-safe:`) — pure CSS, evaluated by the browser, present in the server-rendered HTML, so there's no client-side height recalculation and no CLS. This 180vh figure is a plain literal here, not imported from `GlobeHeroBackground.tsx` — Tailwind's JIT scanner needs a literal string in source to generate the class, so a shared JS constant couldn't drive it anyway; `GlobeHeroBackground.tsx`'s own `MIN_RUNWAY_PX` threshold is independently self-contained (see its comment).
- The root `<section>` now carries `ref={trackRef}` and is the `ScrollTrigger` trigger element `GlobeHeroBackground` measures against.
- Everything that used to be direct children of `<section>` (the dot grid, blur blobs, content grid, scroll hint) is now wrapped in one `sticky top-0 z-10 min-h-[100svh]` div, so it holds in place for exactly the same scroll range the globe pins for, and releases at the same instant.
- The old `h-[340px]... lg:h-[500px]` visual slot that used to hold the small `LebanonGlobeZoom` widget is kept as a layout placeholder for the floating "heroFloatingA/B" badges (removing it would shift their position) but no longer renders a globe — the big background layer replaces it.
- `BackgroundAnimation` and `LebanonGlobeZoom` imports are gone.

- [ ] **Step 3: Add a minimal structural test for the restructured hero**

Create `components/home/HeroSection.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/home/GlobeHeroBackground", () => ({
  GlobeHeroBackground: () => <div data-testid="mock-globe-background" />,
}));

describe("HeroSection", () => {
  it("renders the headline, subheadline, and primary CTA", () => {
    render(
      <HeroSection locale="en" headline="Track everything" subheadline="Fleet visibility for Lebanon" />,
    );
    expect(screen.getByText("Track everything")).toBeInTheDocument();
    expect(screen.getByText("Fleet visibility for Lebanon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /heroCtaPrimary/i })).toHaveAttribute(
      "href",
      "/en/book-installation",
    );
  });
});
```

Note: `dynamic(..., { ssr: false })` renders `null` during the Vitest/jsdom render pass regardless of mocking, since `next/dynamic` defers to a client-only loader; mocking the underlying module keeps the test focused on `HeroSection`'s own contract (headline/CTA) rather than asserting on `GlobeHeroBackground` internals, which Task 3 already covers.

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/home/HeroSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full test suite and type checker**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors. This also confirms nothing else in the codebase imports the two deleted files (`BackgroundAnimation`, `LebanonGlobeZoom`) — if `tsc` reports a missing-module error elsewhere, find and update that import before continuing.

- [ ] **Step 6: Commit**

```bash
git add components/home/HeroSection.tsx components/home/HeroSection.test.tsx
git commit -m "feat: wire scroll-driven globe background into hero, remove superseded widgets"
```

---

## Task 5: Manual verification pass

No new files — this task confirms the behavior Task 3/4's unit tests structurally can't reach (see Task 3's design notes: `canvas.getContext("2d")` is `null` under jsdom, so the actual pin/scroll/ambient behavior only runs in a real browser).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts without errors; visit `http://localhost:3000/en`.

- [ ] **Step 2: Desktop pin-and-release behavior (1440px)**

Resize the browser to ~1440px wide. Scroll down slowly from the top of the page. Confirm:
- The globe visibly animates (globe → unfold → flat MENA/Lebanon map) as you scroll, and the headline/CTA stay in place and remain clickable the whole time.
- Once the globe finishes zooming into Lebanon, the section releases and the page scrolls normally into `MarqueeTicker`/`CoreValueSection` etc.
- After scrolling well past the hero, a faint (~8% opacity) version of the Lebanon map is visible behind the rest of the page content wherever a section has any transparency/gaps.
- Scroll back up: the hero re-pins and the globe animates back toward its earlier state.

- [ ] **Step 3: Mobile viewport (375px)**

Use devtools device emulation at 375px width (or resize the window). Confirm:
- No pinning/scroll-jack feeling — the hero behaves like a normal single-viewport section.
- The globe still plays its animation once (auto-play), then scrolling continues normally.
- CTA is reachable and clickable immediately without needing to wait for any animation.

- [ ] **Step 4: `prefers-reduced-motion: reduce`**

In Chrome DevTools, open the Rendering tab (Cmd/Ctrl+Shift+P → "Show Rendering") and set "Emulate CSS media feature prefers-reduced-motion" to `reduce`. Reload `/en`. Confirm:
- The globe shows a static, already-locked-on-Lebanon frame with no animation, and does not pin the scroll.
- No motion appears behind the page after scrolling past the hero.

- [ ] **Step 5: RTL check**

Visit `http://localhost:3000/ar`. Confirm the headline/subheadline/CTA layout is correct and mirrored as expected; the globe's own visuals are unaffected (geographic data isn't mirrored).

- [ ] **Step 6: Lighthouse pass**

In Chrome DevTools, run a Lighthouse audit (Performance category, mobile) against `/en`. Confirm LCP stays under 2.5s and CLS stays under 0.1. If either regresses, the most likely causes are (a) the GEO fetch blocking something it shouldn't — confirm it's not on the LCP element's critical path — or (b) the pin runway height class not matching between server and client render (check for a hydration warning in the console).

- [ ] **Step 7: Fast-scroll edge case**

Using a trackpad or fast mouse-wheel flick, scroll from the very top of the page to well past the hero as quickly as possible in one motion. Confirm there's no visible "pop"/snap in the globe's final frame right as the pin releases. If there is one, it means the eased `progress` didn't catch up to `target` before release — note it, but per the design spec this is a tunable constant, not a structural bug; increasing either the `180vh` pin runway (`HeroSection.tsx`) or the `1 - Math.pow(0.0008, dt)` easing rate (`GlobeHeroBackground.tsx`) fixes it.

No commit for this task — it's verification only. If any step surfaces a bug, fix it in the relevant Task's file and amend that task's commit-worthy state with a new commit (`fix: ...`) rather than reopening history.

---

## Self-Review Notes

- **Spec coverage:** §3 (architecture/placement) → Task 4. §4 (data/perf) → Task 1 + fetch in Task 3. §5 (scroll mechanics) → Task 3 (measured-runway pin/autoplay branch, replacing the spec's originally-described single ScrollTrigger with a two-branch version once the CLS-safety analysis showed a single JS-side mobile check would risk disagreeing with the CSS breakpoint — behavior matches spec intent, mechanism is more robust). §6 (ambient background) → Task 3 (`onLeave`/`onEnterBack`, opacity/frame-throttle). §7 (cleanup) → Task 4 Step 1. §8 (accessibility/responsive) → Task 3 (`useReducedMotion`, measured runway) + Task 5 manual checks. §9 (testing) → Task 5. §10 (out of scope) → respected, nothing in this plan touches it.
- **Placeholder scan:** none found — every step has complete code or an exact command.
- **Type consistency:** `GlobeHeroBackgroundProps.trackRef` (Task 3) matches the `trackRef` prop passed from `HeroSection.tsx` (Task 4), both typed `RefObject<HTMLElement | null>`. An earlier draft of this plan also exported a `GLOBE_PIN_RUNWAY_VH` constant from Task 3 for Task 4 to import — removed during self-review since Tailwind's JIT scanner requires the `180vh` figure to appear as a literal in source, so the import would never actually be used and would fail lint as dead code; each file now documents the figure independently instead.
