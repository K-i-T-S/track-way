# Hero Globe Scroll Artifact — Design

## 1. Background

The Phase 1 spec (`2026-07-20-trackway-customer-alignment-phase1-design.md`, §9a) named "Convoy" (wireframe vehicles on light-trail lanes) as the hero's flagship 3D concept, built as `FleetNetworkScene` (React Three Fiber) behind `dynamic(ssr:false)` + `SceneErrorBoundary` + a static `prefers-reduced-motion` fallback.

Since then, exploratory work (uncommitted) swapped that out for two Canvas 2D experiments — `BackgroundAnimation.tsx` (particles/hex grid) and a small always-rotating `LebanonGlobeZoom.tsx` widget — and a standalone HTML artifact, `lebanon_globe_zoom_v3.html`, was designed separately: a full-viewport Canvas 2D globe that projects the world onto a sphere and "unfolds" into a flat Lebanon/MENA-focused map as a 0→1 progress value advances, currently driven by capturing the page's own `wheel` events.

This spec supersedes §9a's "Convoy" flagship. The new hero visual is a scroll-driven port of `lebanon_globe_zoom_v3.html`, engineered to fit this project's LCP/CLS budget and to avoid literal scroll-jacking.

## 2. Source Artifact

`lebanon_globe_zoom_v3.html` (664 lines): Canvas 2D only (no WebGL/Three.js). Draws a rotating sphere with real country borders (Natural Earth 110m `FeatureCollection`, inlined as ~220KB of JS on one line) and animates a globe→flat-map transition centered on Lebanon as `progress` advances. Also includes its own DOM UI (hero text panel, telemetry cards, timeline/step nav, locate/back/next buttons) and a leftover Cloudflare challenge-platform snippet at the end of the file — both are dropped in the port (see §4, §7).

## 3. Component Architecture

New `GlobeHeroBackground.tsx` (Canvas 2D, `"use client"`), loaded via `dynamic(() => import(...), { ssr: false })` behind a static poster/placeholder, matching the existing `FleetNetworkScene` safeguard pattern. Rendered inside `HeroSection.tsx` as an absolutely-positioned, full-bleed layer (`inset-0`):

- Stacking order (back to front): page background (`DotGridBackground`, blur blobs) → `GlobeHeroBackground` (its own radial-gradient wash, vignette, film grain, ported from the artifact's `body:before`/`.vignette`/`.grain` styles) → existing `z-10` content grid (headline, subheadline, CTAs — unchanged, visible immediately, never gated behind the animation).
- No canvas-drawn/DOM UI chrome is ported: no telemetry cards, no stage-copy panel, no step nav, no locate/back/next buttons. The existing React headline/CTA (next-intl, RTL-aware) is the only text layer.
- `aria-hidden="true"` on the canvas — it is decorative and never blocks keyboard or screen-reader access to content.

## 4. Data & Performance Handling

The inlined ~220KB world GeoJSON moves to a static asset, `public/data/world-110m.json`, fetched client-side after mount (not blocking first paint, not inflating the JS bundle). Full world coverage is kept (not trimmed to MENA-only) so the opening "world scan" phase still reads correctly. The Cloudflare snippet at the end of the source HTML is dropped entirely — it's an artifact of how the page was captured, not part of the design.

## 5. Scroll Mechanics — Bounded Pin (not scroll-jacking)

The source artifact captures `wheel` with `preventDefault()`. This is replaced with a `position: sticky` pin driven by GSAP `ScrollTrigger` (`scrub`, already a project dependency — no new package):

- A wrapper (~180vh tall) holds the canvas as `position: sticky; top: 0`. `ScrollTrigger` maps scroll position within that wrapper to `progress` (0→1) on the ported draw logic.
- Native scroll is never intercepted — no `preventDefault`, no wheel capture — so trackpad/touch momentum is never fought and the user can never get stuck.
- **Desktop, no reduced-motion preference:** full interactive pin as above.
- **Mobile (coarse pointer / narrow viewport) or `prefers-reduced-motion: reduce`:** no sticky pin at all. The canvas plays through once automatically (0→1 over ~2s) on first intersection (`IntersectionObserver`), then normal scrolling proceeds untouched. Under `prefers-reduced-motion`, it may instead render a single static "locked on Lebanon" frame with no animation, consistent with the existing `FleetNetworkScene` fallback pattern.

## 6. Persistent Ambient Background (post-hero)

Once `progress === 1` and the wrapper has scrolled fully past the viewport, the canvas transitions from `position: sticky` (bound to the hero) to `position: fixed; inset: 0; z-index: 0` (behind all page content) at low opacity (~8%). It continues rendering at that point but drops to an idle mode:

- Slow ambient rotation layered on top of the final Lebanon-locked view.
- Frame-skipped to ~15fps (not full 60fps).
- Paused entirely on `document.visibilitychange` when the tab isn't active.
- Scrolling back up into the hero's range reverses this automatically (`ScrollTrigger` is bidirectional) — the canvas re-pins and resumes full-fidelity rendering.
- Under `prefers-reduced-motion: reduce`, the ambient phase does not animate — it freezes on the final frame (or the canvas unmounts) rather than running indefinite motion behind the rest of the page.
- No other section's background styling changes — existing solid/opaque section backgrounds are left as-is; the ambient layer is only visible in gaps/margins where it already shows through, per the "subtle glow, not a redesign" decision.

## 7. Cleanup of Superseded Work

`HeroSection.tsx` drops its current (uncommitted) imports/usage of `BackgroundAnimation` and the small `LebanonGlobeZoom` widget — both become redundant, fully covered by the new full-bleed layer, and would otherwise run wasted render loops. Both files are deleted outright rather than left as dead code, since they were experimental/untracked and are now superseded by `GlobeHeroBackground.tsx`.

Root-level scratch files (`lebanon_globe_zoom.html`, `simple_lebanon_globe_zoom.html`, `scroll-sequence.html`, `background.html`, and the source `lebanon_globe_zoom_v3.html` itself once ported) are left untouched — out of scope for this task.

## 8. Accessibility & Responsive Behavior

- Canvas is `aria-hidden`; it never gates access to page content (progress is scroll-derived, not a blocking gate — keyboard scroll via Space/PageDown drives `ScrollTrigger` the same as any other scroll input).
- `prefers-reduced-motion: reduce`: no pin, no scroll-driven animation, no perpetual ambient motion post-hero (see §5, §6).
- Mobile/coarse-pointer: no sticky pin (avoids known mobile scroll-jank with pin-based scrollytelling); single autoplay-through instead. Ambient post-hero phase still applies (cheap/throttled, no reason to withhold).
- CTA buttons and headline remain fully visible and clickable through every phase of the animation — nothing about this feature can block conversion.

## 9. Testing Plan

- Manual check at 1440px, 768px, 375px: pin start/end offsets feel correct, CTA is clickable throughout.
- Lighthouse pass on the homepage post-integration, specifically LCP and CLS (this is the item most likely to regress given the dataset size and continuous canvas rendering).
- Manual check with `prefers-reduced-motion: reduce` emulated in devtools, and on a real mobile viewport, to confirm the no-pin/autoplay-once path.
- Confirm `/ar` (RTL) hero still lays out correctly — the canvas itself isn't mirrored (it's geographic data), only the text/CTA layer needs RTL correctness, which is unchanged by this work.

## 10. Explicitly Out of Scope

- Porting the artifact's own DOM UI (telemetry panels, step nav, locate/back/next controls) — superseded by existing hero copy (§3).
- Any redesign of section backgrounds elsewhere on the page to make the ambient layer more visible — subtle/peek-through only (§6).
- Cleanup of the root-level scratch HTML files (§7).
- Re-litigating the "Convoy" hero concept from the Phase 1 spec — this document supersedes it for the hero only; Flagship 2 ("Control Room," Phase 1 §9a) is unaffected.

## 11. Assumptions Flagged

- Wrapper height for the pin is set to ~180vh as a starting point; may need tuning once seen in the browser.
- Ambient opacity (~8%) and idle frame rate (~15fps) are starting values, tunable after a visual pass.
- `BackgroundAnimation.tsx` and the small `LebanonGlobeZoom.tsx` widget are deleted, not archived — flagged in case there was intent to reuse them elsewhere.
