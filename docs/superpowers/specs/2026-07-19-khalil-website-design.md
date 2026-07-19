# TrackWay Website — Design Spec

**Date:** 2026-07-19
**Status:** Approved by user, pending spec review sign-off

## 1. Purpose

TrackWay provides GPS tracking hardware and software for vehicle fleets (B2B)
and individuals (B2C) across Lebanon. This project is a bilingual
(English/Arabic) marketing website whose job is to explain the service and
hardware, build trust, and convert visitors into leads via direct contact
(phone, WhatsApp, email, socials) — not to process payments or manage leads
in a CRM.

B2B and B2C are **not** treated as separate audiences with separate
pages/toggles: TrackWay's offering is essentially the same product for both,
so copy addresses both naturally within shared sections rather than
branching content or navigation.

## 2. Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- `next-intl` for EN/AR routing and RTL
- Sanity (headless CMS) for editable content
- Vercel for hosting/deploy
- No database — contact forms resolve to `mailto:` / `wa.me` links, no lead
  storage or CRM integration

## 3. Routing

Locale-prefixed URLs (not cookie-only), so both languages are independently
indexable by search engines:

```
/en                 — homepage
/en/hardware         — GPS hardware catalog (single page, all devices)
/en/about            — company info
/en/contact          — contact page (phone, WhatsApp, email, socials)
/ar/...              — mirrors all of the above, RTL
```

`next-intl` middleware handles locale detection/redirect on first visit;
`dir="rtl"` and mirrored layout logic apply automatically for `/ar`.

Rendering: static generation with ISR. A Sanity webhook triggers on-demand
revalidation on publish, so editors see changes within seconds rather than
waiting for a timed revalidation window.

## 4. Visual Design System

Inspired by navleb.com (a competitor site the client explicitly likes),
adapted with a distinct accent color to avoid look-alike branding:

- **Background:** near-black (`#0A0A0A`) throughout
- **Accent:** electric cyan (`#00E5D4`) — CTAs, links, section labels,
  icons, numbered badges, marquee ticker strip
- **Type:** bold/heavy sans-serif headings (large scale, white); muted gray
  body copy (~`#A0A0A0`)
- **Motifs:** dot-grid map/location background textures (fits a GPS
  company's subject matter), numbered feature/product cards (01, 02, ...),
  a horizontal marquee ticker cycling capability keywords (LIVE TRACKING ·
  FLEET MANAGEMENT · DRIVER BEHAVIOR · FUEL MONITORING · HARDWARE),
  circular "Explore ↗" style badge CTAs
- **Persistent contact affordances:** floating WhatsApp button
  (bottom-right in LTR), back-to-top button (bottom-left in LTR) — both
  must flip corners in RTL, not just mirror text
- **RTL requirement:** every component using directional visual logic
  (marquee scroll direction, floating button placement, numbering) must be
  explicitly handled for RTL, not left to `dir="rtl"` alone

## 5. Content Model (Sanity)

Field-level i18n: each translatable text field is stored as an object
`{en: "...", ar: "..."}` inside a single document, rather than maintaining
parallel document trees per locale — simpler to keep in sync for a small
content set with one or two editors.

Content types:

- **`siteSettings`** (singleton) — logo, phone numbers, WhatsApp number,
  email, social links, address, footer text
- **`homePage`** (singleton) — hero headline/subheadline, marquee keyword
  list, about-teaser text, contact CTA text
- **`feature`** (repeatable) — title, description, order/number, icon —
  powers the numbered services grid (live tracking, fleet management,
  driver behavior, fuel monitoring, geofencing, etc.)
- **`hardwareProduct`** (repeatable) — name, images, short description,
  spec list (key/value pairs), order — powers the `/hardware` catalog
- **`aboutPage`** (singleton) — company story text, image

Every page-level document also carries SEO fields (meta title/description,
per locale).

**Pricing:** not shown publicly anywhere on the site (per client decision —
common practice locally given USD/LBP volatility). Hardware and service
CTAs are "Request a Quote" rather than displaying prices.

## 6. Pages

- **`/`** — hero, marquee ticker, features grid (numbered cards), hardware
  teaser linking to `/hardware`, about teaser, contact CTA section
- **`/hardware`** — full device catalog grid (single showcase page, not
  individual product pages); each card shows specs inline; "Request a
  Quote" CTA, no pricing
- **`/about`** — company story
- **`/contact`** — phone numbers, WhatsApp deep link, email, social icons,
  address, and a simple inquiry form that submits via `mailto:`/`wa.me:`
  (no backend, no lead database)

## 7. Component Structure

Shared component library, each component locale/RTL-aware:

- `MarqueeTicker` — scrolling keyword strip, direction-aware for RTL
- `FeatureCard` — numbered service/feature card
- `HardwareCard` — device card (image, specs, "Request a Quote" CTA)
- `DotGridBackground` — reusable map-texture background art
- `WhatsAppButton` — floating, fixed-position, corner flips for RTL
- `Header` — nav + locale switcher
- `Footer` — contact block, socials, quick links

## 8. i18n Mechanics

Two distinct kinds of text, two distinct sources:

- **UI strings** (nav labels, buttons like "Read More", form labels) —
  static JSON message files (`messages/en.json`, `messages/ar.json`) in the
  repo, since these don't need CMS editing
- **Page content** (headlines, service descriptions, hardware specs) —
  pulled from Sanity's `{en, ar}` fields at render time

## 9. Deployment

Vercel project connected to this repo.

Env vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
`SANITY_API_TOKEN` (draft/preview mode).

## 10. Acceptance Bar

- TypeScript strict — no `any`, no implicit returns
- Mobile-first: every page tested at 375px before 1440px
- Every component tested at `dir="rtl"`, not just visually skimmed
- Lighthouse LCP < 2.5s, CLS < 0.1 before any page is considered done
- No public pricing anywhere on the site

## 11. Explicitly Out of Scope

- Separate B2B/B2C pages, toggles, or query-param-driven audience routing
- Individual per-device hardware product pages
- Lead database / CRM integration — contact is direct-to-WhatsApp/email only
- E-commerce / checkout / payment processing
- Public pricing display
