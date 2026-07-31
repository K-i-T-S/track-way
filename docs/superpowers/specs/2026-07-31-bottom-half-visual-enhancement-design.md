# Bottom-half visual enhancement — design

## Problem

`HowItWorksSection` and `HardwareTeaserSection` (and to a lesser extent
`ServicesFeatureList`) read visually flat/dark compared to the top half of
the homepage (`HeroSection`, `CoreValueSection`), which uses dual-color
blurred glow orbs, glassmorphic cards, hover radial glows, animated
border-trace rings, and floating decorative orbs. The bottom sections
mostly use a single teal glow (or none at all, in `HardwareTeaserSection`'s
case) and no color variety.

## Decisions

1. **Palette**: `accentWarm` (`#FB923C`, orange) is replaced sitewide with
   a new gold (`#FFC857`) — same token name (`accentWarm`), new hex value,
   so every existing Tailwind utility class (`bg-accentWarm/10`, etc.)
   picks it up automatically. All hardcoded hex duplicates of `#FB923C` /
   `rgba(251,146,60,...)` across the codebase are updated in lockstep so
   there's one consistent "warm" accent site-wide (no orange left).
2. **Scope**: `HowItWorksSection` and `HardwareTeaserSection` get major
   treatment (bring them up to the top-half's visual density).
   `ServicesFeatureList` gets a light touch (color variety only — its
   motion/structure is already good). `AboutTeaserSection` and
   `FinalCtaSection` are already rich and already use the full trio, so no
   structural changes — the palette swap alone keeps them consistent with
   the rest.

## Component changes

### HowItWorksSection
- Dual-tone ambient background glow (teal + gold blurred orbs) instead of
  a single teal blob.
- Step badge / icon / hover-glow tint / decorative corner line rotate
  teal → gold → ice per card, mirroring `CoreValueSection`'s `RING_COLORS`
  pattern.
- Small floating blurred orb per card (bottom corner), echoing
  `CoreValueCard`.
- Card surface brightened slightly (`bg-white/[0.03]` → `[0.04]`,
  `border-white/10` → `/12`).

### HardwareTeaserSection
- Add dual-tone ambient glow field behind the section (currently none).
- Animated border-trace ring around the device icon box (reusing the
  stroke-dashoffset technique already used in `CoreValueCard`/`Button`).
- "GPS" badge alternates teal/gold pulse instead of teal-only.
- A couple of ambient floating particles near the device visual.

### ServicesFeatureList
- Floating background particles and per-row hover glow alternate
  teal/gold instead of teal-only.

### Palette-only files
`tailwind.config.ts`, `components/ui/Button.tsx`, `CoreValueSection.tsx`,
`ControlRoomSection.tsx`, `IndustriesSection.tsx`, `FinalCtaSection.tsx`,
`AboutTeaserSection.tsx`, `HardwareProductShowcase.tsx` — hex-value swap
only, no structural change.

## Out of scope

- `trackway-design-rehaul/` and `new-hardware-page/` — unimported
  reference/scratch files, not part of the live app.
- New copy/content (e.g. hardware spec chips) — visual polish only, no
  new translation keys.
- Top-half sections beyond the palette swap (Hero, ServiceCarousel,
  CoreValueSection, IndustriesSection, ControlRoomSection) — already
  visually rich, not touched structurally.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run test` (no existing tests
  assert on the `#FB923C` hex value, confirmed via grep).
- Browser screenshot verification is unreliable for this project's dev
  server (Chrome-extension automation issue noted in a prior session) —
  relying on tests + code review instead, flagged explicitly to the user.
