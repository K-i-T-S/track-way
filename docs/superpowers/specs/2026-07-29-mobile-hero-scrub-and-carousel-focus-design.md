# Mobile Hero Scroll-Scrub, Remaining Globe Perf, and Carousel Focus — Design

## 1. Background

A prior fix (commit `2020832`) addressed severe scroll jank on lower-end devices by capping `GlobeHeroBackground`'s pinned/scrub-mode redraw to ~30fps (measured via CPU-throttled load testing: long-task time during hero scroll dropped from 3116ms to 211ms) and reverting the `Button` border-trace ring to hover-only.

Three items remain, all requested together:

1. Mobile currently gets a fundamentally different, weaker hero experience: a fixed one-shot 2s autoplay tween on `IntersectionObserver` entry (`components/home/GlobeHeroBackground.tsx`, the `isMobile` branch of the main effect), instead of real scroll-linked scrubbing. This was originally a deliberate tradeoff to avoid GSAP `pin: true`'s known mobile viewport-resize jank (documented in `docs/superpowers/specs/2026-07-24-hero-globe-scroll-artifact-design.md` §5, §8). The request is to make mobile "visually appealing and fully functional," not merely different-but-safe.
2. The frame-rate cap fixed *frequency* of redraws but not the *cost per redraw* — flagged as not addressed in the prior fix. Still relevant on weak hardware and now doubly relevant on mobile once mobile gets a live scrub loop instead of a short one-shot tween.
3. `ServiceCarousel`'s front-facing card treatment (`components/home/ServiceCarousel.tsx`, `ServiceCard`'s `isFrontFacing` logic) uses a binary angle threshold (`facingFront < 45°`). Given typical card counts (spacing 40–60° apart), more than one card can cross this threshold simultaneously, so 2–3 cards get identical "front" styling at once — reported as looking "uniformly transparent" rather than having one clear focal card.

## 2. Mobile Hero: Scroll-Linked Scrub Without Pin

**Root insight:** the mobile-jank concern that motivated skipping the scroll animation entirely is specific to GSAP's `pin: true` (it re-measures and repositions the pinned element against a viewport that mobile browsers resize mid-scroll, as their address bar hides/shows). `ScrollTrigger`'s `scrub` option — mapping scroll position within a `[start, end]` window to a progress callback — does not pin, fix, or transform anything; it only reads scroll position. This is safe on mobile and is already the exact mechanism desktop uses (minus `pin`/`pinSpacing`).

**Change:** replace the mobile branch's `onEnter`-triggered one-shot `gsap.to(tweenTarget, ...)` tween with a `ScrollTrigger.create({ trigger, start, end, scrub: true, onUpdate: (self) => { target = self.progress }, onLeave, onEnterBack })`, structurally identical to the desktop branch minus `pin`/`pinSpacing`.

**Decoupling scroll distance from section height:** `GlobeHeroBackground`'s canvas is already always `position: fixed` (portaled to `#ambient-bg-root`), independent of the hero `<section>`'s own box size, in both "pinned" and "ambient" modes (see the existing large comment block explaining why — canvas/context must never remount). Because of this, the scrub's `end` distance does **not** need to match the section's actual layout height: the hero section stays exactly `min-h-[100svh]` (headline/CTA visible immediately, unchanged, scrolls away normally like any in-flow content), while the fixed canvas keeps animating for a separately-tunable scroll distance (`end: () => "+=" + window.innerHeight * MOBILE_SCRUB_VH`, `MOBILE_SCRUB_VH = 1.15`) measured from the same trigger start point. Once the user has scrolled past that distance, `onLeave` switches to the existing throttled "ambient" mode exactly as today. Scrolling back up reverses via `onEnterBack`, exactly as the desktop branch already does.

No change to: reduced-motion handling (unaffected — still short-circuits to a static frame before this branch is reached), the always-fixed/portaled canvas architecture, the ambient post-hero phase, or the "no scroll-jacking" project-wide constraint (native scroll is still never intercepted).

## 3. Remaining Globe Render Cost

Two independent, additive reductions, both applied inside `GlobeHeroBackground.tsx`'s draw functions:

- **Coarser grid sampling:** `drawGlobeGrid`'s parallel/meridian step (currently 3° longitude / 2° latitude for line tracing) and `drawFlatGrid`'s equivalent steps roughly double, cutting the trig-heavy point count for graticule lines by about half. These are thin decorative lines; the visual difference at this canvas's on-screen size is negligible.
- **Lower `devicePixelRatio` cap on coarse-pointer devices:** `resize()`'s `dpr = Math.min(window.devicePixelRatio || 1, 2)` becomes `Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1 : 2)`. Canvas fill/stroke cost scales roughly with pixel count, so this is a ~4x reduction in per-pixel work on typical 2x-3x-DPR phones, at a resolution loss invisible on small screens.

Both are verified with the existing CPU-throttle + long-task measurement method (4x throttle, scroll through the hero, compare before/after), same as the prior fix.

## 4. Carousel: Continuous Depth-of-Field Instead of Binary Threshold

In `ServiceCard` (`components/home/ServiceCarousel.tsx`), replace the binary `isFrontFacing` (`facingFront < 45` driving a two-state style switch) with a continuous falloff function of `facingFront` (0° = dead-center, 180° = directly behind):

- `focus = 1 - smoothstep(0, 100, facingFront)` (0 at/behind the far side, 1 dead-center; `smoothstep` gives an eased, non-linear falloff rather than a linear ramp, so the centered card holds its "in-focus" look over a small arc instead of visibly fading the instant it moves).
- Opacity: `lerp(0.35, 1, focus)`.
- Scale: `lerp(0.82, 1.08, focus)`.
- Blur: `lerp(3px, 0px, focus)` via CSS `filter: blur(...)`, giving a real camera depth-of-field feel.
- `zIndex`: continuous, `Math.round(focus * 100)`, so exactly one card is ever unambiguously topmost — no more simultaneous ties.

Existing hover behavior (`brightness-125 !scale-110` on `isHovered && isFrontFacing`) is preserved but re-gated on `focus > 0.85` (i.e., "close enough to dead-center to count as the current card") instead of the old binary flag. RTL (`spinDirection`) and reduced-motion (rotation freezes, but whichever card is centered when frozen still renders fully in-focus) are unaffected — both are already orthogonal to this per-card styling logic.

## 5. Testing Plan

- Manual check at 1440px, 768px, 375px for the hero: scroll-scrub feels responsive on a real or emulated touch viewport, headline/CTA remain visible and clickable throughout, ambient transition and scroll-back-up reversal both work.
- Repeat the CPU-throttle + `PerformanceObserver` long-task measurement (as used in the prior fix) on both the desktop pinned path and the new mobile scrub path, confirming no regression and quantifying the grid/DPR reduction's impact.
- Visual check of the carousel at each of the three responsive radius tiers (`sm`, `md`, `lg` breakpoints already in the component) confirming exactly one card reads as "in focus" at a time, with smooth handoff as rotation continues.
- Existing test suites (`GlobeHeroBackground.test.tsx`, `HeroSection.test.tsx`, `ServiceCarousel.test.tsx`) continue to pass; no new test framework or approach introduced.

## 6. Explicitly Out of Scope

- Any change to desktop's pinned hero behavior beyond what item 3 (perf) already touches.
- Any change to `prefers-reduced-motion` handling — already correct, not implicated by any of the three requests.
- Redesigning the carousel's rotation speed, card count, or content — only the per-card focus/opacity/scale/blur treatment changes.
- Cleanup of the still-untracked superseded prototype files (`BackgroundAnimation.tsx`, `LebanonGlobeZoom.tsx`, `ScrollSequence.tsx`, root-level scratch HTML) — unrelated to this work, previously flagged as out of scope in the original hero-globe spec.
