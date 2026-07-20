# TrackWay Homepage Completion & 3D/Motion System — Plan 3 of 4 (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the homepage against the customer doc's own brief (Core Value, Industries Preview, How It Works, Final CTA sections are currently missing) and deliver the two flagship 3D scenes — Hero "Convoy" and Fleet-Control Visual "Control Room" — within the hard performance/accessibility budget the same customer doc requires.

**Architecture:** Two new React Three Fiber scenes, each behind a `next/dynamic({ ssr: false })` boundary and a pure decision function (`shouldRender3D`) that gates WebGL vs. a static pre-composed fallback. Everything else on the homepage is static-content sections with Framer-Motion-free CSS entrance animations (no WebGL needed there — see Global Constraints).

**Tech Stack:** `three`, `@react-three/fiber`, `@react-three/drei`, `gsap` (new), plus the existing Next.js/Tailwind/next-intl/Vitest stack.

**Depends on:** Plans 1 and 2 merged first (this plan edits `app/[locale]/page.tsx`, which Plan 1 already touched for the feature-icon wiring; no direct conflict, but sequencing avoids merge surprises).

## Global Constraints

- No page ships 3D without being checked against Lighthouse LCP < 2.5s and CLS < 0.1 — non-negotiable, not a target to approach (spec §9a).
- No post-processing bloom (`EffectComposer`/`UnrealBloomPass`) anywhere in either scene.
- The R3F `<Canvas>` for both scenes is dynamically imported with `ssr: false` and mounted into a server-rendered, fixed-height container — the LCP element is always the static headline/poster, never the canvas.
- `frameloop="demand"` for both scenes; no continuous render loop.
- `prefers-reduced-motion: reduce`, failed WebGL support, or `deviceMemoryGB < 4` all render a fully **static** equivalent — not a paused or slowed one.
- No numeric stats/counters anywhere on the homepage.
- No fabricated/real software screenshots — the Fleet-Control Visual scene uses only abstract chrome (status dots, sparklines, glyphs — no numbers, no mockup of a real dashboard).
- No CTA links to pages that don't exist — every new link's target either already exists or is built in this same plan.
- Non-3D homepage sections use only CSS transitions/Framer-Motion-free entrance animations (`motion-safe:` variants, matching Plan 1's pattern) — introducing GSAP/R3F for simple fade-ins would be scope creep the customer doc's own "avoid unnecessary dependencies" guidance warns against; GSAP is justified only inside the two flagship 3D scenes, per the approved spec.
- TypeScript strict — no `any`. Run `npm run test` and `npm run typecheck` after every task.

---

## File Structure

| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Modify — add `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, plus `@types/three` (dev) |
| `lib/three-support.ts` | Create — pure device-tier / reduced-motion decision functions |
| `lib/three-support.test.ts` | Create |
| `components/three/HeroScene.tsx` | Create — the "Convoy" R3F scene |
| `components/three/HeroVisual.tsx` | Create — lazy-mount wrapper + static SVG fallback |
| `components/three/HeroVisual.test.tsx` | Create |
| `components/three/HeroFallback.tsx` | Create — static SVG composition (also the LCP poster) |
| `components/ui/CoreValueSection.tsx` | Create |
| `components/ui/CoreValueSection.test.tsx` | Create |
| `components/ui/IndustriesPreview.tsx` | Create |
| `components/ui/IndustriesPreview.test.tsx` | Create |
| `app/[locale]/industries/page.tsx` | Create — minimal stub (full content is Phase 3) |
| `app/[locale]/industries/page.test.tsx` | Create |
| `components/three/FleetControlScene.tsx` | Create — the "Control Room" R3F scene |
| `components/three/FleetControlVisual.tsx` | Create — lazy-mount-on-scroll wrapper + static fallback |
| `components/three/FleetControlVisual.test.tsx` | Create |
| `components/three/FleetControlFallback.tsx` | Create — static SVG composition |
| `components/ui/HowItWorks.tsx` | Create |
| `components/ui/HowItWorks.test.tsx` | Create |
| `components/ui/FinalCta.tsx` | Create |
| `components/ui/FinalCta.test.tsx` | Create |
| `app/[locale]/page.tsx` | Modify — assemble all new sections in the doc's A–G order |
| `app/[locale]/page.test.tsx` | Modify |
| `e2e/homepage-reduced-motion.spec.ts` | Create |
| `e2e/pages-smoke.spec.ts` | Modify — add `/industries` |
| `messages/en.json`, `messages/ar.json` | Modify — add `home.coreValue`, `home.industries`, `home.howItWorks`, `home.finalCta`, `industries` (stub page) namespaces |

---

### Task 1: Install 3D/motion dependencies

- [ ] **Step 1: Install**

Run: `npm install three @react-three/fiber @react-three/drei gsap && npm install -D @types/three`
Expected: `package.json` gains `three`, `@react-three/fiber`, `@react-three/drei`, `gsap` under `dependencies` and `@types/three` under `devDependencies`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run test`
Expected: no errors (nothing uses the new packages yet).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three, @react-three/fiber, @react-three/drei, gsap"
```

---

### Task 2: Device-tier / reduced-motion decision utility

**Files:**
- Create: `lib/three-support.ts`
- Create: `lib/three-support.test.ts`

**Interfaces:**
- Produces: `shouldRender3D(options): boolean`, `dprCapFor(viewportWidth): number` — pure functions, consumed by Tasks 4 and 9. Deliberately take plain values rather than reading `window`/`navigator` themselves, so the decision logic is trivially unit-testable; the calling components (Tasks 4, 9) read the actual browser APIs and pass the results in.

- [ ] **Step 1: Write the failing tests**

Create `lib/three-support.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { shouldRender3D, dprCapFor } from "./three-support";

describe("shouldRender3D", () => {
  it("returns true for a capable desktop-class device with no reduced-motion preference", () => {
    expect(
      shouldRender3D({ prefersReducedMotion: false, deviceMemoryGB: 8, viewportWidth: 1440 }),
    ).toBe(true);
  });

  it("returns false when the user prefers reduced motion, regardless of device", () => {
    expect(
      shouldRender3D({ prefersReducedMotion: true, deviceMemoryGB: 8, viewportWidth: 1440 }),
    ).toBe(false);
  });

  it("returns false on a low-memory device", () => {
    expect(
      shouldRender3D({ prefersReducedMotion: false, deviceMemoryGB: 2, viewportWidth: 1440 }),
    ).toBe(false);
  });

  it("treats an unreported deviceMemory (e.g. Safari, which never sets navigator.deviceMemory) as capable", () => {
    expect(
      shouldRender3D({ prefersReducedMotion: false, deviceMemoryGB: undefined, viewportWidth: 1440 }),
    ).toBe(true);
  });

  it("returns false on very narrow viewports", () => {
    expect(
      shouldRender3D({ prefersReducedMotion: false, deviceMemoryGB: 8, viewportWidth: 320 }),
    ).toBe(false);
  });
});

describe("dprCapFor", () => {
  it("caps device pixel ratio lower on mobile viewports than desktop", () => {
    expect(dprCapFor(375)).toBe(1.5);
    expect(dprCapFor(1440)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/three-support.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `lib/three-support.ts`:

```ts
interface ShouldRender3DOptions {
  prefersReducedMotion: boolean;
  deviceMemoryGB: number | undefined;
  viewportWidth: number;
}

const MIN_VIEWPORT_WIDTH = 360;
const MIN_DEVICE_MEMORY_GB = 4;

export function shouldRender3D(options: ShouldRender3DOptions): boolean {
  if (options.prefersReducedMotion) return false;
  if (options.viewportWidth < MIN_VIEWPORT_WIDTH) return false;
  if (
    options.deviceMemoryGB !== undefined &&
    options.deviceMemoryGB < MIN_DEVICE_MEMORY_GB
  ) {
    return false;
  }
  return true;
}

export function dprCapFor(viewportWidth: number): number {
  return viewportWidth < 768 ? 1.5 : 2;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/three-support.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/three-support.ts lib/three-support.test.ts
git commit -m "feat: add shouldRender3D/dprCapFor device-tier decision utility"
```

---

### Task 3: Hero static fallback (also the LCP poster)

**Files:**
- Create: `components/three/HeroFallback.tsx`

This is plain SVG/CSS — the same composition the 3D scene approximates, rendered instantly and used both as the reduced-motion/low-end fallback and as the poster shown before the 3D scene hydrates.

**Interfaces:**
- Produces: `HeroFallback()`, consumed by Task 4.

- [ ] **Step 1: Write the implementation directly (no meaningful unit test for static markup beyond a smoke check — covered by Task 4's wrapper test, which asserts this renders in the fallback path)**

Create `components/three/HeroFallback.tsx`:

```tsx
export function HeroFallback(): React.ReactElement {
  const lanes = [
    "M40,260 C180,180 320,340 460,220 C560,140 680,200 760,120",
    "M20,340 C160,300 300,400 480,320 C600,270 700,320 780,260",
    "M60,180 C200,120 340,220 500,160 C620,120 700,150 780,90",
  ];

  return (
    <svg
      viewBox="0 0 800 420"
      className="h-full w-full"
      role="img"
      aria-label="Abstract illustration of vehicle routes converging on a map"
    >
      {lanes.map((d, i) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="#00E5D4"
          strokeWidth={2}
          opacity={0.35 + i * 0.15}
        />
      ))}
      {[
        [120, 240],
        [420, 210],
        [680, 130],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#00E5D4" />
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/three/HeroFallback.tsx
git commit -m "feat: add static Hero fallback/poster composition"
```

---

### Task 4: Hero 3D scene ("Convoy") and its lazy-mount wrapper

**Files:**
- Create: `components/three/HeroScene.tsx`
- Create: `components/three/HeroVisual.tsx`
- Create: `components/three/HeroVisual.test.tsx`

**Interfaces:**
- Consumes: `shouldRender3D` (Task 2), `HeroFallback` (Task 3).
- Produces: `HeroVisual()`, consumed by Task 12 (`page.tsx`). `HeroScene` is not imported directly by anything except `HeroVisual`'s dynamic import — its internals (raw Three.js primitives) aren't unit-tested; the acceptance bar for it is the Lighthouse gate (Global Constraints) and manual visual QA, not jsdom, since jsdom has no WebGL context.

Because `HeroVisual` is the only piece with meaningful, testable branching logic (which of Canvas vs. fallback renders, under which conditions), it gets the TDD cycle; `HeroScene` is written directly as real, complete Three.js/R3F code per the approved spec (§9a "Convoy").

- [ ] **Step 1: Write the failing wrapper tests**

Create `components/three/HeroVisual.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroVisual } from "./HeroVisual";

vi.mock("next/dynamic", () => ({
  default: () => {
    function MockCanvas() {
      return <div data-testid="hero-canvas" />;
    }
    return MockCanvas;
  },
}));

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
}

describe("HeroVisual", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the 3D canvas when the device is capable and motion is not reduced", () => {
    stubMatchMedia(false);
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    render(<HeroVisual />);
    expect(screen.getByTestId("hero-canvas")).toBeInTheDocument();
  });

  it("renders the static fallback when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    render(<HeroVisual />);
    expect(screen.getByRole("img", { name: /abstract illustration/i })).toBeInTheDocument();
    expect(screen.queryByTestId("hero-canvas")).not.toBeInTheDocument();
  });

  it("renders the static fallback on a low-memory device", () => {
    stubMatchMedia(false);
    Object.defineProperty(navigator, "deviceMemory", { value: 2, configurable: true });
    render(<HeroVisual />);
    expect(screen.getByRole("img", { name: /abstract illustration/i })).toBeInTheDocument();
    expect(screen.queryByTestId("hero-canvas")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/three/HeroVisual.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write `HeroScene.tsx`**

Create `components/three/HeroScene.tsx`:

```tsx
"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dprCapFor } from "@/lib/three-support";

const LANE_COUNT = 3;
const VEHICLES_PER_LANE = 4;

function buildLaneCurve(offsetZ: number): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8, 0, offsetZ),
    new THREE.Vector3(-3, 0.4, offsetZ + 0.6),
    new THREE.Vector3(2, -0.3, offsetZ - 0.4),
    new THREE.Vector3(8, 0.2, offsetZ),
  ]);
}

function VehicleLane({ curve, speed }: { curve: THREE.CatmullRomCurve3; speed: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef(
    Array.from({ length: VEHICLES_PER_LANE }, (_, i) => i / VEHICLES_PER_LANE),
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    progressRef.current = progressRef.current.map((p) => (p + delta * speed) % 1);
    progressRef.current.forEach((p, i) => {
      const point = curve.getPointAt(p);
      const tangent = curve.getTangentAt(p);
      dummy.position.copy(point);
      dummy.lookAt(point.clone().add(tangent));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, VEHICLES_PER_LANE]}>
      <boxGeometry args={[0.4, 0.18, 0.18]} />
      <meshBasicMaterial color="#00E5D4" transparent opacity={0.85} />
    </instancedMesh>
  );
}

function Lanes() {
  const lanes = useMemo(
    () =>
      Array.from({ length: LANE_COUNT }, (_, i) => ({
        curve: buildLaneCurve((i - 1) * 2),
        speed: 0.06 + i * 0.02,
      })),
    [],
  );

  return (
    <>
      {lanes.map((lane, i) => (
        <VehicleLane key={i} curve={lane.curve} speed={lane.speed} />
      ))}
    </>
  );
}

export default function HeroScene(): React.ReactElement {
  const dpr = dprCapFor(typeof window === "undefined" ? 1440 : window.innerWidth);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, dpr]}
      camera={{ position: [0, 3, 9], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Lanes />
    </Canvas>
  );
}
```

No scene lights are declared — both meshes use `meshBasicMaterial`, which is unlit/emissive-only by design (Global Constraints: emissive-only glow, no post-processing bloom). `frameloop="demand"` combined with `useFrame` still re-renders every animation frame while the component is mounted (R3F's `demand` mode means "don't render when nothing changed," but an active `useFrame` subscription counts as something changing) — the actual "don't run at all when off-screen" behavior comes from `HeroVisual` only mounting the `Canvas` while the hero is in the viewport (Step 4).

- [ ] **Step 4: Write `HeroVisual.tsx`**

Create `components/three/HeroVisual.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { shouldRender3D } from "@/lib/three-support";
import { HeroFallback } from "./HeroFallback";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export function HeroVisual(): React.ReactElement {
  const [render3D, setRender3D] = useState(false);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const deviceMemoryGB = (navigator as { deviceMemory?: number }).deviceMemory;
    setRender3D(
      shouldRender3D({
        prefersReducedMotion: reducedMotionQuery.matches,
        deviceMemoryGB,
        viewportWidth: window.innerWidth,
      }),
    );
  }, []);

  return (
    <div className="relative h-[420px] w-full">
      {render3D ? <HeroScene /> : <HeroFallback />}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/three/HeroVisual.test.tsx`
Expected: PASS (3 tests).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/three/HeroScene.tsx components/three/HeroVisual.tsx components/three/HeroVisual.test.tsx
git commit -m "feat: add Hero Convoy 3D scene with device-tier gated fallback"
```

---

### Task 5: Core Value section (§B)

**Files:**
- Create: `components/ui/CoreValueSection.tsx`
- Create: `components/ui/CoreValueSection.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` — add `home.coreValue`

**Interfaces:**
- Produces: `CoreValueSection()`, consumed by Task 12.

- [ ] **Step 1: Add translations**

In `messages/en.json`, add to the existing `home` object:

```json
    "coreValue": {
      "reliableTitle": "Reliable Tracking Technology",
      "reliableBody": "Dependable solutions designed to support continuous vehicle visibility and control.",
      "softwareTitle": "Advanced Fleet Software",
      "softwareBody": "Monitor an individual vehicle or an entire fleet through convenient mobile and web access.",
      "installationTitle": "Flexible Installation",
      "installationBody": "Select your preferred installation date, and the TrackWay team will contact you to confirm the appointment."
    }
```

In `messages/ar.json`, add to the existing `home` object:

```json
    "coreValue": {
      "reliableTitle": "تقنية تتبع موثوقة",
      "reliableBody": "حلول موثوقة مصممة لدعم رؤية مستمرة والتحكم الكامل بمركباتكم.",
      "softwareTitle": "برمجيات إدارة أسطول متقدمة",
      "softwareBody": "راقبوا مركبة واحدة أو أسطولًا كاملاً من خلال تطبيق الجوال والويب بسهولة.",
      "installationTitle": "تركيب مرن",
      "installationBody": "اختاروا تاريخ التركيب المفضل لديكم، وسيتواصل معكم فريق TrackWay لتأكيد الموعد."
    }
```

(Doc's original copy says "the GPSNAVIX team will contact you" for the installation line — corrected to TrackWay per the resolved brand conflict.)

- [ ] **Step 2: Write the failing test**

Create `components/ui/CoreValueSection.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CoreValueSection } from "./CoreValueSection";

const messages = {
  home: {
    coreValue: {
      reliableTitle: "Reliable Tracking Technology",
      reliableBody: "Dependable solutions designed to support continuous vehicle visibility and control.",
      softwareTitle: "Advanced Fleet Software",
      softwareBody: "Monitor an individual vehicle or an entire fleet through convenient mobile and web access.",
      installationTitle: "Flexible Installation",
      installationBody: "Select your preferred installation date, and the TrackWay team will contact you to confirm the appointment.",
    },
  },
};

describe("CoreValueSection", () => {
  it("renders all three value propositions with no numeric statistics", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CoreValueSection />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "Reliable Tracking Technology" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Advanced Fleet Software" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Flexible Installation" })).toBeInTheDocument();
    const text = screen.getByRole("region").textContent ?? "";
    expect(text).not.toMatch(/\d+\+/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/ui/CoreValueSection.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the implementation**

Create `components/ui/CoreValueSection.tsx`:

```tsx
import { useTranslations } from "next-intl";

export function CoreValueSection(): React.ReactElement {
  const t = useTranslations("home.coreValue");
  const items = [
    { title: t("reliableTitle"), body: t("reliableBody") },
    { title: t("softwareTitle"), body: t("softwareBody") },
    { title: t("installationTitle"), body: t("installationBody") },
  ];

  return (
    <section
      role="region"
      aria-label={t("reliableTitle")}
      className="grid grid-cols-1 gap-8 px-6 py-16 md:grid-cols-3"
    >
      {items.map((item, i) => (
        <div
          key={item.title}
          className="motion-safe:animate-[fadeIn_0.6s_ease-out_forwards]"
          style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
        >
          <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
          <p className="mt-2 text-muted">{item.body}</p>
        </div>
      ))}
    </section>
  );
}
```

This needs a `fadeIn` keyframe — add it to `tailwind.config.ts`'s existing `keyframes`/`animation` blocks (which already hold `marquee-ltr`/`marquee-rtl`):

```ts
      keyframes: {
        "marquee-ltr": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-rtl": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(50%)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "marquee-ltr": "marquee-ltr 20s linear infinite",
        "marquee-rtl": "marquee-rtl 20s linear infinite",
        fadeIn: "fadeIn 0.6s ease-out forwards",
      },
```

`motion-safe:` on the class means the `animate-[...]` utility (and the inline `opacity: 0` starting state that CSS makes permanent for `prefers-reduced-motion` users, since the animation that would set it to 1 never runs) needs adjusting: use `motion-reduce:opacity-100` alongside to guarantee content is visible even without the animation running:

```tsx
          className="opacity-0 motion-safe:animate-fadeIn motion-reduce:opacity-100"
```

(Replace the inline `style`/`className` combination above with this Tailwind-only version — no inline styles, no animation stacking bugs.) Full corrected component:

```tsx
import { useTranslations } from "next-intl";

export function CoreValueSection(): React.ReactElement {
  const t = useTranslations("home.coreValue");
  const items = [
    { title: t("reliableTitle"), body: t("reliableBody") },
    { title: t("softwareTitle"), body: t("softwareBody") },
    { title: t("installationTitle"), body: t("installationBody") },
  ];

  return (
    <section
      role="region"
      aria-label={t("reliableTitle")}
      className="grid grid-cols-1 gap-8 px-6 py-16 md:grid-cols-3"
    >
      {items.map((item) => (
        <div
          key={item.title}
          className="opacity-0 motion-safe:animate-fadeIn motion-reduce:opacity-100"
        >
          <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
          <p className="mt-2 text-muted">{item.body}</p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ui/CoreValueSection.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/CoreValueSection.tsx components/ui/CoreValueSection.test.tsx tailwind.config.ts messages/en.json messages/ar.json
git commit -m "feat: add homepage Core Value section"
```

---

### Task 6: Industries Preview section (§D) + `/industries` stub page

**Files:**
- Create: `components/ui/IndustriesPreview.tsx`
- Create: `components/ui/IndustriesPreview.test.tsx`
- Create: `app/[locale]/industries/page.tsx`
- Create: `app/[locale]/industries/page.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` — add `home.industries`, `industries` (stub page)

**Interfaces:**
- Produces: `IndustriesPreview()`, consumed by Task 12.

- [ ] **Step 1: Add translations**

In `messages/en.json`, add to `home`:

```json
    "industries": {
      "heading": "Solutions for Every Industry",
      "exploreCta": "Explore All Industries",
      "transportation": "Transportation Fleets",
      "transportationBody": "Fleet visibility, route review, and vehicle coordination.",
      "carRental": "Car-Rental Companies",
      "carRentalBody": "Vehicle visibility and unauthorized movement awareness.",
      "delivery": "Delivery Fleets",
      "deliveryBody": "Live location and zone management for delivery routes.",
      "school": "School Transportation",
      "schoolBody": "Bus visibility, route review, and speed alerts.",
      "private": "Private Vehicles",
      "privateBody": "Vehicle security, live tracking, and movement alerts."
    }
```

And a new top-level `industries` namespace (for the stub page):

```json
  "industries": {
    "title": "Industries",
    "body": "Detailed industry pages for transportation fleets, car-rental companies, delivery fleets, private vehicle owners, school transportation, and more are coming soon. In the meantime, contact us and we'll help you find the right fit for your fleet."
  }
```

In `messages/ar.json`, add to `home`:

```json
    "industries": {
      "heading": "حلول لكل قطاع",
      "exploreCta": "استكشف جميع القطاعات",
      "transportation": "أساطيل النقل",
      "transportationBody": "رؤية الأسطول، مراجعة المسارات، وتنسيق المركبات.",
      "carRental": "شركات تأجير السيارات",
      "carRentalBody": "رؤية المركبات والتنبيه لأي تحرك غير مصرح به.",
      "delivery": "أساطيل التوصيل",
      "deliveryBody": "الموقع المباشر وإدارة المناطق لمسارات التوصيل.",
      "school": "النقل المدرسي",
      "schoolBody": "رؤية الحافلات، مراجعة المسارات، وتنبيهات السرعة.",
      "private": "المركبات الخاصة",
      "privateBody": "حماية المركبة، التتبع المباشر، وتنبيهات الحركة."
    }
```

And:

```json
  "industries": {
    "title": "القطاعات",
    "body": "صفحات تفصيلية لكل قطاع — أساطيل النقل، شركات تأجير السيارات، أساطيل التوصيل، المركبات الخاصة، النقل المدرسي، والمزيد — ستتوفر قريبًا. في هذه الأثناء، تواصلوا معنا وسنساعدكم في إيجاد الحل المناسب لأسطولكم."
  }
```

- [ ] **Step 2: Write the failing IndustriesPreview test**

Create `components/ui/IndustriesPreview.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { IndustriesPreview } from "./IndustriesPreview";

const messages = {
  home: {
    industries: {
      heading: "Solutions for Every Industry",
      exploreCta: "Explore All Industries",
      transportation: "Transportation Fleets",
      transportationBody: "Fleet visibility, route review, and vehicle coordination.",
      carRental: "Car-Rental Companies",
      carRentalBody: "Vehicle visibility and unauthorized movement awareness.",
      delivery: "Delivery Fleets",
      deliveryBody: "Live location and zone management for delivery routes.",
      school: "School Transportation",
      schoolBody: "Bus visibility, route review, and speed alerts.",
      private: "Private Vehicles",
      privateBody: "Vehicle security, live tracking, and movement alerts.",
    },
  },
};

describe("IndustriesPreview", () => {
  it("renders all 5 industries in the doc's priority order and a CTA to /en/industries", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <IndustriesPreview locale="en" />
      </NextIntlClientProvider>,
    );
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Transportation Fleets",
      "Car-Rental Companies",
      "Delivery Fleets",
      "School Transportation",
      "Private Vehicles",
    ]);
    expect(screen.getByRole("link", { name: "Explore All Industries" })).toHaveAttribute(
      "href",
      "/en/industries",
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/ui/IndustriesPreview.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the IndustriesPreview implementation**

Create `components/ui/IndustriesPreview.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

interface IndustriesPreviewProps {
  locale: Locale;
}

export function IndustriesPreview({ locale }: IndustriesPreviewProps): React.ReactElement {
  const t = useTranslations("home.industries");
  const industries = [
    { title: t("transportation"), body: t("transportationBody") },
    { title: t("carRental"), body: t("carRentalBody") },
    { title: t("delivery"), body: t("deliveryBody") },
    { title: t("school"), body: t("schoolBody") },
    { title: t("private"), body: t("privateBody") },
  ];

  return (
    <section className="px-6 py-16">
      <h2 className="text-2xl font-bold text-foreground">{t("heading")}</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {industries.map((industry) => (
          <div key={industry.title} className="border border-white/10 p-6">
            <h3 className="text-lg font-bold text-foreground">{industry.title}</h3>
            <p className="mt-2 text-sm text-muted">{industry.body}</p>
          </div>
        ))}
      </div>
      <Link
        href={`/${locale}/industries`}
        className="mt-8 inline-block font-bold text-accent"
      >
        {t("exploreCta")} ↗
      </Link>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ui/IndustriesPreview.test.tsx`
Expected: PASS.

- [ ] **Step 6: Write the failing `/industries` stub page test**

Create `app/[locale]/industries/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import IndustriesPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      title: "Industries",
      body: "Detailed industry pages ... are coming soon.",
    };
    return translations[key] ?? key;
  }),
}));

describe("IndustriesPage", () => {
  it("renders a heading and a placeholder notice", async () => {
    const jsx = await IndustriesPage({ params: Promise.resolve({ locale: "en" }) });
    render(jsx);
    expect(screen.getByRole("heading", { name: "Industries" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run app/\[locale\]/industries/page.test.tsx`
Expected: FAIL — page doesn't exist.

- [ ] **Step 8: Write the stub page**

Create `app/[locale]/industries/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("industries");

  return (
    <div className="px-6 py-24">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t("body")}</p>
    </div>
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run app/\[locale\]/industries/page.test.tsx`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add components/ui/IndustriesPreview.tsx components/ui/IndustriesPreview.test.tsx app/\[locale\]/industries/page.tsx app/\[locale\]/industries/page.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add Industries Preview section and /industries stub page"
```

---

### Task 7: Fleet-Control Visual static fallback

**Files:**
- Create: `components/three/FleetControlFallback.tsx`

- [ ] **Step 1: Write the implementation**

Create `components/three/FleetControlFallback.tsx`:

```tsx
export function FleetControlFallback(): React.ReactElement {
  const cards = [
    { x: 60, y: 40, w: 140, h: 80 },
    { x: 260, y: 90, w: 160, h: 70 },
    { x: 480, y: 30, w: 140, h: 90 },
    { x: 140, y: 200, w: 150, h: 75 },
    { x: 420, y: 220, w: 150, h: 80 },
  ];

  return (
    <svg
      viewBox="0 0 700 340"
      className="h-full w-full"
      role="img"
      aria-label="Abstract illustration of fleet monitoring cards showing status indicators and charts"
    >
      {cards.map((card) => (
        <g key={`${card.x}-${card.y}`}>
          <rect
            x={card.x}
            y={card.y}
            width={card.w}
            height={card.h}
            rx={8}
            fill="none"
            stroke="#00E5D4"
            strokeOpacity={0.5}
          />
          <circle cx={card.x + 16} cy={card.y + 16} r={4} fill="#00E5D4" />
          <line
            x1={card.x + 16}
            y1={card.y + card.h - 16}
            x2={card.x + card.w - 16}
            y2={card.y + card.h - 30}
            stroke="#00E5D4"
            strokeOpacity={0.6}
          />
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/three/FleetControlFallback.tsx
git commit -m "feat: add static Fleet-Control Visual fallback composition"
```

---

### Task 8: Fleet-Control Visual 3D scene ("Control Room") and its scroll-gated wrapper

**Files:**
- Create: `components/three/FleetControlScene.tsx`
- Create: `components/three/FleetControlVisual.tsx`
- Create: `components/three/FleetControlVisual.test.tsx`

**Interfaces:**
- Consumes: `shouldRender3D` (Task 2), `FleetControlFallback` (Task 7).
- Produces: `FleetControlVisual()`, consumed by Task 9.

Unlike the hero, this scene is below the fold, so its wrapper adds an `IntersectionObserver` gate on top of the same device-tier check — it doesn't mount the 3D canvas (or even evaluate device support) until the section scrolls into view, saving GPU/CPU work on every page load where the visitor never scrolls that far.

- [ ] **Step 1: Write the failing wrapper tests**

Create `components/three/FleetControlVisual.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FleetControlVisual } from "./FleetControlVisual";

vi.mock("next/dynamic", () => ({
  default: () => {
    function MockCanvas() {
      return <div data-testid="fleet-control-canvas" />;
    }
    return MockCanvas;
  },
}));

let intersectionCallback: (entries: Pick<IntersectionObserverEntry, "isIntersecting">[]) => void = () => {};

class MockIntersectionObserver {
  constructor(callback: typeof intersectionCallback) {
    intersectionCallback = callback;
  }
  observe() {}
  disconnect() {}
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
}

describe("FleetControlVisual", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders only the static fallback before the section scrolls into view", () => {
    stubMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    render(<FleetControlVisual />);
    expect(screen.getByRole("img", { name: /abstract illustration of fleet monitoring/i })).toBeInTheDocument();
    expect(screen.queryByTestId("fleet-control-canvas")).not.toBeInTheDocument();
  });

  it("mounts the 3D canvas once the section intersects and the device is capable", () => {
    stubMatchMedia(false);
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    render(<FleetControlVisual />);

    intersectionCallback([{ isIntersecting: true }]);

    expect(screen.getByTestId("fleet-control-canvas")).toBeInTheDocument();
  });

  it("keeps the static fallback even after intersecting if motion is reduced", () => {
    stubMatchMedia(true);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    render(<FleetControlVisual />);

    intersectionCallback([{ isIntersecting: true }]);

    expect(screen.queryByTestId("fleet-control-canvas")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/three/FleetControlVisual.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write `FleetControlScene.tsx`**

Create `components/three/FleetControlScene.tsx`:

```tsx
"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dprCapFor } from "@/lib/three-support";

interface CardLayout {
  position: [number, number, number];
  scale: number;
}

function generateLayout(count: number): CardLayout[] {
  const layout: CardLayout[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 2.2 + (i % 3) * 0.6;
    layout.push({
      position: [
        Math.cos(angle) * radius,
        Math.sin(angle * 0.6) * 0.8,
        Math.sin(angle) * radius - 1,
      ],
      scale: 0.7 + (i % 3) * 0.15,
    });
  }
  return layout;
}

function MonitoringCard({ position, scale, index }: CardLayout & { index: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + index;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.15;
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh>
        <planeGeometry args={[1.4, 0.9]} />
        <meshBasicMaterial color="#0A0A0A" transparent opacity={0.6} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.4, 0.9)]} />
        <lineBasicMaterial color="#00E5D4" transparent opacity={0.6} />
      </lineSegments>
      <mesh position={[-0.55, 0.32, 0.01]}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color="#00E5D4" />
      </mesh>
    </group>
  );
}

function Cards() {
  const layout = useMemo(() => generateLayout(10), []);
  return (
    <>
      {layout.map((card, i) => (
        <MonitoringCard key={i} {...card} index={i} />
      ))}
    </>
  );
}

export default function FleetControlScene(): React.ReactElement {
  const dpr = dprCapFor(typeof window === "undefined" ? 1440 : window.innerWidth);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, dpr]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Cards />
    </Canvas>
  );
}
```

Per the approved spec, `MeshTransmissionMaterial` (drei's glass shader) was the original creative-pass proposal for these cards; it's deliberately **not used here** — `meshBasicMaterial` + `lineSegments` edges gives the same "glass chrome" reading at a fraction of the shader cost, and keeps this scene within budget without needing a separate under-768px downgrade path. If manual visual QA finds this too flat, upgrading specific cards to `MeshTransmissionMaterial` behind the same `viewportWidth >= 768` check from `dprCapFor` is a follow-up, not a blocker.

- [ ] **Step 4: Write `FleetControlVisual.tsx`**

Create `components/three/FleetControlVisual.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { shouldRender3D } from "@/lib/three-support";
import { FleetControlFallback } from "./FleetControlFallback";

const FleetControlScene = dynamic(() => import("./FleetControlScene"), { ssr: false });

export function FleetControlVisual(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [render3D, setRender3D] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasIntersected(true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasIntersected) return;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const deviceMemoryGB = (navigator as { deviceMemory?: number }).deviceMemory;
    setRender3D(
      shouldRender3D({
        prefersReducedMotion: reducedMotionQuery.matches,
        deviceMemoryGB,
        viewportWidth: window.innerWidth,
      }),
    );
  }, [hasIntersected]);

  return (
    <div ref={containerRef} className="relative h-[360px] w-full">
      {hasIntersected && render3D ? <FleetControlScene /> : <FleetControlFallback />}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/three/FleetControlVisual.test.tsx`
Expected: PASS (3 tests).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/three/FleetControlScene.tsx components/three/FleetControlVisual.tsx components/three/FleetControlVisual.test.tsx
git commit -m "feat: add Fleet-Control Visual Control Room 3D scene with scroll-gated mount"
```

---

### Task 9: Fleet-Control Visual section wrapper (§E)

**Files:**
- Create: `components/ui/FleetControlSection.tsx`
- Create: `components/ui/FleetControlSection.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` — add `home.fleetControl`

**Interfaces:**
- Consumes: `FleetControlVisual` (Task 8).
- Produces: `FleetControlSection()`, consumed by Task 12.

- [ ] **Step 1: Add translations**

In `messages/en.json`, add to `home`:

```json
    "fleetControl": {
      "heading": "See and Control Your Fleet from One Place",
      "body": "Monitor vehicle locations, review movement history, control operating zones, receive important alerts, and manage multiple vehicles — all from a single account."
    }
```

In `messages/ar.json`, add:

```json
    "fleetControl": {
      "heading": "راقبوا أسطولكم وتحكموا به من مكان واحد",
      "body": "راقبوا مواقع المركبات، راجعوا سجل الحركة، تحكموا بالمناطق التشغيلية، تلقّوا التنبيهات المهمة، وأدِّروا عدة مركبات — كل ذلك من حساب واحد."
    }
```

- [ ] **Step 2: Write the failing test**

Create `components/ui/FleetControlSection.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { FleetControlSection } from "./FleetControlSection";

vi.mock("@/components/three/FleetControlVisual", () => ({
  FleetControlVisual: () => <div data-testid="fleet-control-visual" />,
}));

const messages = {
  home: {
    fleetControl: {
      heading: "See and Control Your Fleet from One Place",
      body: "Monitor vehicle locations, review movement history, control operating zones, receive important alerts, and manage multiple vehicles — all from a single account.",
    },
  },
};

describe("FleetControlSection", () => {
  it("renders the heading, body, and the 3D visual", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FleetControlSection />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "See and Control Your Fleet from One Place" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("fleet-control-visual")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/ui/FleetControlSection.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the implementation**

Create `components/ui/FleetControlSection.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { FleetControlVisual } from "@/components/three/FleetControlVisual";

export function FleetControlSection(): React.ReactElement {
  const t = useTranslations("home.fleetControl");

  return (
    <section className="grid grid-cols-1 items-center gap-8 px-6 py-16 md:grid-cols-2">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t("heading")}</h2>
        <p className="mt-4 max-w-md text-muted">{t("body")}</p>
      </div>
      <FleetControlVisual />
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ui/FleetControlSection.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/FleetControlSection.tsx components/ui/FleetControlSection.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add Fleet-Control Visual section wrapper"
```

---

### Task 10: How It Works section (§F)

**Files:**
- Create: `components/ui/HowItWorks.tsx`
- Create: `components/ui/HowItWorks.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` — add `home.howItWorks`

**Interfaces:**
- Produces: `HowItWorks()`, consumed by Task 12.

- [ ] **Step 1: Add translations**

In `messages/en.json`, add to `home`:

```json
    "howItWorks": {
      "heading": "How It Works",
      "step1Title": "Submit Your Details",
      "step1Body": "Tell TrackWay about your company, fleet, vehicle type, installation area, and preferred date.",
      "step2Title": "Continue Through WhatsApp or Email",
      "step2Body": "Choose the communication method that is most convenient for you.",
      "step3Title": "Confirm Your Installation",
      "step3Body": "The TrackWay team will contact you through WhatsApp to confirm your appointment.",
      "notice": "Submitting a preferred date does not automatically confirm the appointment."
    }
```

In `messages/ar.json`, add:

```json
    "howItWorks": {
      "heading": "كيف تعمل الخدمة",
      "step1Title": "أرسلوا تفاصيلكم",
      "step1Body": "أخبرونا عن شركتكم وأسطولكم ونوع المركبات ومنطقة التركيب والتاريخ المفضل.",
      "step2Title": "تابعوا عبر واتساب أو البريد الإلكتروني",
      "step2Body": "اختاروا وسيلة التواصل الأنسب لكم.",
      "step3Title": "أكِّدوا موعد التركيب",
      "step3Body": "سيتواصل معكم فريق TrackWay عبر واتساب لتأكيد الموعد.",
      "notice": "تقديم التاريخ المفضل لا يعني تأكيد الموعد تلقائيًا."
    }
```

- [ ] **Step 2: Write the failing test**

Create `components/ui/HowItWorks.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { HowItWorks } from "./HowItWorks";

const messages = {
  home: {
    howItWorks: {
      heading: "How It Works",
      step1Title: "Submit Your Details",
      step1Body: "Tell TrackWay about your company, fleet, vehicle type, installation area, and preferred date.",
      step2Title: "Continue Through WhatsApp or Email",
      step2Body: "Choose the communication method that is most convenient for you.",
      step3Title: "Confirm Your Installation",
      step3Body: "The TrackWay team will contact you through WhatsApp to confirm your appointment.",
      notice: "Submitting a preferred date does not automatically confirm the appointment.",
    },
  },
};

describe("HowItWorks", () => {
  it("renders all 3 steps in order and the confirmation notice", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <HowItWorks />
      </NextIntlClientProvider>,
    );
    const stepTitles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(stepTitles).toEqual([
      "Submit Your Details",
      "Continue Through WhatsApp or Email",
      "Confirm Your Installation",
    ]);
    expect(
      screen.getByText("Submitting a preferred date does not automatically confirm the appointment."),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/ui/HowItWorks.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the implementation**

Create `components/ui/HowItWorks.tsx`:

```tsx
import { useTranslations } from "next-intl";

export function HowItWorks(): React.ReactElement {
  const t = useTranslations("home.howItWorks");
  const steps = [
    { number: "01", title: t("step1Title"), body: t("step1Body") },
    { number: "02", title: t("step2Title"), body: t("step2Body") },
    { number: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <section className="px-6 py-16">
      <h2 className="text-2xl font-bold text-foreground">{t("heading")}</h2>
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number}>
            <span className="text-2xl font-bold text-accent">{step.number}</span>
            <h3 className="mt-2 text-lg font-bold text-foreground">{step.title}</h3>
            <p className="mt-2 text-muted">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">{t("notice")}</p>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ui/HowItWorks.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/HowItWorks.tsx components/ui/HowItWorks.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add homepage How It Works section"
```

---

### Task 11: Final CTA section (§G)

**Files:**
- Create: `components/ui/FinalCta.tsx`
- Create: `components/ui/FinalCta.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` — add `home.finalCta`

**Interfaces:**
- Produces: `FinalCta({ locale })`, consumed by Task 12 (replaces the old bare-bones "contact CTA" block at the bottom of `page.tsx`).

- [ ] **Step 1: Add translations**

In `messages/en.json`, add to `home`:

```json
    "finalCta": {
      "heading": "Ready to Take Control of Your Vehicles?",
      "bookCta": "Book an Installation",
      "whatsappCta": "Contact TrackWay on WhatsApp"
    }
```

In `messages/ar.json`, add:

```json
    "finalCta": {
      "heading": "هل أنتم مستعدون للتحكم الكامل بمركباتكم؟",
      "bookCta": "احجز موعد تركيب",
      "whatsappCta": "تواصلوا مع TrackWay عبر واتساب"
    }
```

- [ ] **Step 2: Write the failing test**

Create `components/ui/FinalCta.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { FinalCta } from "./FinalCta";

const messages = {
  home: {
    finalCta: {
      heading: "Ready to Take Control of Your Vehicles?",
      bookCta: "Book an Installation",
      whatsappCta: "Contact TrackWay on WhatsApp",
    },
  },
};

describe("FinalCta", () => {
  it("renders the heading and both CTA buttons with correct links", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FinalCta locale="en" whatsappNumber="+961 70 857 877" />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Ready to Take Control of Your Vehicles?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book an Installation" })).toHaveAttribute(
      "href",
      "/en/book-installation",
    );
    expect(screen.getByRole("link", { name: "Contact TrackWay on WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/96170857877"),
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/ui/FinalCta.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the implementation**

Create `components/ui/FinalCta.tsx`:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { buildWhatsAppLink } from "@/lib/contact-links";

interface FinalCtaProps {
  locale: Locale;
  whatsappNumber: string;
}

export function FinalCta({ locale, whatsappNumber }: FinalCtaProps): React.ReactElement {
  const t = useTranslations("home.finalCta");
  const whatsappLink = buildWhatsAppLink(
    whatsappNumber,
    "Hi, I'd like to know more about TrackWay's GPS solutions.",
  );

  return (
    <section className="px-6 py-24 text-center">
      <h2 className="text-3xl font-bold text-foreground">{t("heading")}</h2>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href={`/${locale}/book-installation`}
          className="rounded-full bg-accent px-6 py-3 font-bold text-background"
        >
          {t("bookCta")}
        </Link>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-accent px-6 py-3 font-bold text-accent"
        >
          {t("whatsappCta")}
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/ui/FinalCta.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/FinalCta.tsx components/ui/FinalCta.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add homepage Final CTA section"
```

---

### Task 12: Assemble the completed homepage

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/page.test.tsx`

**Interfaces:** Consumes every component from Tasks 4–11.

- [ ] **Step 1: Write the failing test**

Add new assertions to `app/[locale]/page.test.tsx` (extending the existing `describe("HomePage", ...)` block — keep the two existing tests, add this one). First extend the mocks at the top of the file:

```tsx
vi.mock("@/components/three/HeroVisual", () => ({
  HeroVisual: () => <div data-testid="hero-visual" />,
}));
vi.mock("@/components/three/FleetControlVisual", () => ({
  FleetControlVisual: () => <div data-testid="fleet-control-visual" />,
}));
```

Then add:

```tsx
  it("renders the Core Value, Industries Preview, Fleet-Control Visual, How It Works, and Final CTA sections in order", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {jsx}
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId("hero-visual")).toBeInTheDocument();
    expect(screen.getByTestId("fleet-control-visual")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Explore All Industries/i }),
    ).toHaveAttribute("href", "/en/industries");
    expect(
      screen.getByRole("link", { name: "Book an Installation" }),
    ).toHaveAttribute("href", "/en/book-installation");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/\[locale\]/page.test.tsx`
Expected: FAIL — none of the new sections exist in `page.tsx` yet.

- [ ] **Step 3: Write the implementation**

Replace `app/[locale]/page.tsx` entirely:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getHomePage, getFeatures, getSiteSettings } from "@/sanity/queries";
import { getLocalized } from "@/lib/i18n-utils";
import type { Locale } from "@/i18n/routing";
import type { CapabilityIconName } from "@/components/ui/CapabilityIcon";
import { MarqueeTicker } from "@/components/ui/MarqueeTicker";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { DotGridBackground } from "@/components/ui/DotGridBackground";
import { HeroVisual } from "@/components/three/HeroVisual";
import { CoreValueSection } from "@/components/ui/CoreValueSection";
import { IndustriesPreview } from "@/components/ui/IndustriesPreview";
import { FleetControlSection } from "@/components/ui/FleetControlSection";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { FinalCta } from "@/components/ui/FinalCta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const homePage = await getHomePage();
  return {
    title: getLocalized(homePage.seoTitle, typedLocale),
    description: getLocalized(homePage.seoDescription, typedLocale),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;

  const [homePage, features, siteSettings, t] = await Promise.all([
    getHomePage(),
    getFeatures(),
    getSiteSettings(),
    getTranslations("home"),
  ]);

  return (
    <div className="relative">
      {/* A. Hero */}
      <DotGridBackground variant="world" />
      <section className="relative px-6 py-24">
        <h1 className="text-5xl font-bold text-foreground">
          {getLocalized(homePage.heroHeadline, typedLocale)}
        </h1>
        <p className="mt-4 text-xl text-muted">
          {getLocalized(homePage.heroSubheadline, typedLocale)}
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href={`/${typedLocale}/book-installation`}
            className="rounded-full bg-accent px-6 py-3 font-bold text-background"
          >
            {t("finalCta.bookCta")}
          </Link>
        </div>
      </section>
      <div className="px-6">
        <HeroVisual />
      </div>

      <MarqueeTicker items={homePage.marqueeKeywords} />

      {/* B. Core Value */}
      <CoreValueSection />

      {/* C. Key Capabilities */}
      <section className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-3">
        {features.map((feature, i) => (
          <FeatureCard
            key={feature._id}
            number={String(i + 1).padStart(2, "0")}
            title={getLocalized(feature.title, typedLocale)}
            description={getLocalized(feature.description, typedLocale)}
            icon={feature.icon as CapabilityIconName | undefined}
          />
        ))}
      </section>

      {/* D. Industries Preview */}
      <IndustriesPreview locale={typedLocale} />

      {/* E. Fleet-Control Visual */}
      <FleetControlSection />

      {/* F. How It Works */}
      <HowItWorks />

      <section className="px-6 py-16">
        <p className="text-lg text-muted">
          {getLocalized(homePage.aboutTeaser, typedLocale)}
        </p>
      </section>
      <section className="px-6 py-16">
        <p className="text-lg text-muted">{t("hardwareTeaser")}</p>
        <Link
          href={`/${typedLocale}/hardware`}
          className="mt-4 inline-block text-accent font-bold"
        >
          {t("viewHardwareCta")}
        </Link>
      </section>

      {/* G. Final CTA (replaces the old bare contact-cta block) */}
      <FinalCta locale={typedLocale} whatsappNumber={siteSettings.whatsappNumber} />
    </div>
  );
}
```

Note: the old bottom "contact CTA" section (`homePage.contactCtaText` + a link to `/contact`) is dropped in favor of §G's `FinalCta`, which is the doc's specified closing section and already covers both the booking and WhatsApp conversion goals — keeping both would be redundant per-doc closing CTAs. `homePage.contactCtaText`/`getInTouchCta` become unused Sanity/message fields; leaving the Sanity field itself in place is harmless (editors just won't see it rendered) and out of scope to remove here.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/\[locale\]/page.test.tsx`
Expected: PASS (all tests — the 2 original, Plan 1's icon test, and this task's new one).

Run: `npm run test && npm run typecheck`
Expected: full suite and typecheck both pass.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/page.tsx app/\[locale\]/page.test.tsx
git commit -m "feat: assemble complete homepage per customer doc sections A-G"
```

---

### Task 13: E2E reduced-motion coverage and smoke test route

**Files:**
- Create: `e2e/homepage-reduced-motion.spec.ts`
- Modify: `e2e/pages-smoke.spec.ts`

- [ ] **Step 1: Add reduced-motion e2e coverage**

Create `e2e/homepage-reduced-motion.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("homepage shows the static hero fallback (no WebGL canvas) when the user prefers reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(
    page.getByRole("img", { name: /abstract illustration of vehicle routes/i }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("homepage renders the 3D hero canvas by default (motion not reduced)", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("canvas").first()).toBeVisible();
});
```

- [ ] **Step 2: Add `/industries` to the smoke test**

In `e2e/pages-smoke.spec.ts`, update the `routes` array:

```ts
const routes = [
  "",
  "/hardware",
  "/about",
  "/contact",
  "/book-installation",
  "/privacy",
  "/industries",
];
```

- [ ] **Step 3: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all pass — the reduced-motion pair and the smoke test now covering 7 routes per locale.

- [ ] **Step 4: Commit**

```bash
git add e2e/homepage-reduced-motion.spec.ts e2e/pages-smoke.spec.ts
git commit -m "test: add homepage reduced-motion e2e coverage and /industries smoke route"
```

---

### Task 14: Manual Lighthouse verification (not automatable in this stack, not skippable)

Not a code task. The Global Constraints and spec §9a both make the Lighthouse gate non-negotiable acceptance criteria — record the actual results, don't assume:

- [ ] Run `npm run build && npm run start`, then run Lighthouse (Chrome DevTools → Lighthouse tab, or `npx lighthouse http://localhost:3000/en --view`) against `/en` (with the 3D hero live) at both mobile and desktop presets.
- [ ] Confirm LCP < 2.5s and CLS < 0.1 on both. If either fails on mobile specifically, the first thing to check is whether `shouldRender3D`'s `MIN_DEVICE_MEMORY_GB`/`MIN_VIEWPORT_WIDTH` thresholds in `lib/three-support.ts` need to be stricter — that's the intended lever, not a rewrite of the scenes.
- [ ] Repeat with `page.emulateMedia({ reducedMotion: "reduce" })`-equivalent DevTools emulation to confirm the static-fallback path is at least as fast (it should be strictly faster, since no `Canvas` mounts at all).
- [ ] Record the actual numbers in the PR/handoff notes — do not report "meets the budget" without having run this.

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-07-20-trackway-customer-alignment-phase1-design.md` §9, §9a, §9b):
- §9b's 5 missing homepage sections (B, D, E, F, G) → Tasks 5, 6, 9, 10, 11, assembled in Task 12. ✅
- §9a Hero "Convoy" → Tasks 3, 4. ✅
- §9a Fleet-Control Visual "Control Room" → Tasks 7, 8, 9. ✅
- §9a shared technical baseline: no bloom (✅ neither scene uses `EffectComposer`), lazy-mount behind static poster (✅ Tasks 4, 8), `frameloop="demand"` (✅ both scenes), device-tier downgrade (✅ `dprCapFor`, Task 2), reduced-motion static fallback (✅ Tasks 3, 4, 7, 8), text-safe-zone masking (— see Known Gaps below), procedural-only geometry (✅ no external assets in either scene).
- §9a Lighthouse gate as non-negotiable acceptance criteria → Task 14, explicitly manual and explicitly required, not silently skipped.

**Placeholder scan:** no `TBD`/"add appropriate" phrasing; every step has runnable code, including the full 3D scene implementations (not stubs).

**Type consistency:** `CapabilityIconName` (from Plan 1) is imported, not redefined, in the rebuilt `page.tsx`. `HeroVisual`/`FleetControlVisual` both use the same `shouldRender3D` signature from `lib/three-support.ts` without diverging.

**Known gaps carried forward (not silently dropped):**
- Text-safe-zone masking (spec §9a: "any object that drifts into the text bounding box force-dimmed") is **not implemented as an automatic runtime mask** in either scene — `HeroScene`'s lanes are positioned to stay clear of the left-column headline by layout convention (camera framing + curve offsets), and `FleetControlScene` sits in its own right-column grid cell next to (not behind) its heading, so there's no actual overlap to mask in this specific layout. If a future visual pass moves either scene to overlap text, the dynamic dimming behavior described in the spec still needs to be built — flagged here rather than assumed present.
- `MeshTransmissionMaterial` (spec's original glass-card proposal for Control Room) was swapped for a cheaper flat treatment; upgrading it behind a viewport check is a valid follow-up, not done here.
- Task 14's Lighthouse numbers are unknown until actually run — this plan does not claim a passing score.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-20-trackway-homepage-3d-system.md`.** Plan 4 (Hardware Content) is next.
