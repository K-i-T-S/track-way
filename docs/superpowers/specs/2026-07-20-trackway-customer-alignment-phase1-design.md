# TrackWay Website — Customer Alignment, Phase 1 Design

**Date:** 2026-07-20
**Status:** Approved by user, pending spec review sign-off
**Relationship to prior spec:** This is an amendment to
`2026-07-19-khalil-website-design.md`, not a replacement. Sections below only
cover what changes or adds to that spec. Anything not mentioned here (stack,
routing, i18n mechanics, RTL rules, Sanity content model for editorial
content) still applies as originally written.

## 1. Background

The client (owner of TrackWay) sent a detailed customization document
(`TrackWay  INFORMATION.txt`) after the initial build. It was reviewed
against the approved spec and against internal best practices; several
points conflicted and were resolved with the user (KiTS, acting as
developer/consultant) via interview before any implementation. This document
records those resolutions and specs out Phase 1, the first of three planned
phases.

## 2. Conflicts Identified and Resolutions

| # | Conflict | Resolution |
|---|----------|-------------|
| 1 | Customer doc mixes "TrackWay" (site brand, CTAs, About copy) with "GPSNAVIX" (WhatsApp/email templates, SEO keyword list, testing checklist's `gpsnavix@gmail.com`) — internally inconsistent, reads like an unfinished find-replace from a template. | **TrackWay is the brand**, used in all copy, WhatsApp/email templates, and SEO keywords. `gpsnavix@gmail.com` is kept as the literal contact **mailbox address** for now (not brand copy) per user instruction — user will supply the real TrackWay address later. |
| 2 | Approved spec says "no lead database," lists CRM/lead storage as **out of scope**. Customer doc requires a persisted booking database, status workflow, and an authenticated admin dashboard. | **Build the full backend.** Supabase (Postgres + Auth + RLS), provisioned via the connected Supabase MCP tool. This supersedes the "no backend" decision in the prior spec for the booking/contact flows specifically; static Sanity-driven content pages are unaffected. |
| 3 | Existing `/hardware` page lists device brand/model/spec sheets. Customer doc never requests a hardware catalog and explicitly bans naming device brands, models, or specs on the public site. | **Keep `/hardware` exactly as-is**, per explicit user decision, despite the conflict with the customer's written restriction. **Flagged as a deliberate deviation** to raise with the customer before launch — not a silent assumption. |
| 4 | Customer doc §8 (sitemap) is truncated in the source file — only items 11–13 survived ("Booking Request Details view", "404", "Error and loading states"); items 1–10 are missing. | Sitemap inferred from the rest of the document: Home, Fleet Solutions, Industries hub + 10 industry sub-sections, Features, About, Book an Installation, Contact, Privacy Policy, plus Booking Request Details / 404 / error states, plus the admin dashboard (not in public nav). Phased per §3 below. |
| 5 | Booking form (Phase 1) collects personal data (name, phone, email, company) before the Privacy Policy page exists (scheduled Phase 3). | Add a minimal inline privacy note + link on the booking form pointing to a stub `/privacy` page in Phase 1; full policy content ships in Phase 3. **Flagged**: full Privacy Policy must exist before any real (non-test) traffic hits the booking form in production. |
| 6 | User identified high-end 3D graphics/animation as a top design priority ("wow factor" for the Lebanese market). The same customer doc that wants this also mandates LCP < 2.5s, CLS < 0.1, "avoid unnecessary dependencies," "avoid large background videos," and full mobile performance — heavy WebGL can violate all of these if built carelessly. | Not a hard conflict — resolvable with disciplined engineering. Adding `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, and `framer-motion` as new dependencies is a **deliberate, scoped exception** to "avoid unnecessary dependencies," justified by explicit user priority and mitigated by code-splitting every 3D module so it never loads on the critical path. See §9–§9a for the concrete design and the non-negotiable performance guardrails attached to it. |
| 7 | Real Teltonika model numbers (FMC920, FMC130), specs, and likely manufacturer photography for the hardware page compounds resolution #3 — the customer doc explicitly bans "branded third-party GPS devices" in imagery (§24) on top of banning brand/model/spec mentions (§15). | User confirmed this direction a second time with real model numbers, so it's treated as settled, not re-litigated. Carried forward on the pre-launch flag list (§13) as a deviation to raise with the customer. Product photography specifically is NOT scraped from search results — see §15 for the imagery sourcing decision. |

## 3. Phasing

Given the scope spans four largely independent sub-projects, work is split
into three phases, each with its own spec/plan/implementation cycle:

- **Phase 1 (this document):** Brand/content compliance fixes on existing
  pages, booking + contact backend (Supabase + Resend), and the new
  `/book-installation` page.
- **Phase 2:** Authenticated admin dashboard.
- **Phase 3:** Remaining public pages — Fleet Solutions, Industries (hub +
  10), Features (detailed), Privacy Policy, 404/error/loading states.

## 4. Architecture Additions (Phase 1)

- **Supabase** — new project provisioned via the connected Supabase MCP
  tool. Postgres tables with RLS; no anonymous read or direct table access.
  All writes go through Next.js Server Actions using the service-role key
  (server-only, never shipped to the client).
- **Resend** — server-side transactional email for (a) the booking form's
  "Send Request by Email" path, sent to the business inbox
  (`gpsnavix@gmail.com`, temporary), and (b) the Contact page inquiry form.
  Never sends an automatic confirmation email to the visitor, per customer
  doc.
- **New env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  (server-only), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
  `RESEND_FROM_EMAIL` uses a placeholder/testing sender
  (`onboarding@resend.dev`) until a real domain is acquired — flagged as a
  pre-launch requirement (real domain needed for reliable deliverability).

## 5. Data Model

### `booking_requests`
- `full_name` (text, required)
- `company_name` (text, nullable — required by validation when
  `customer_type` is a business type, not for Private Vehicle Owner)
- `phone` (text, required)
- `email` (text, required, validated)
- `customer_type` (enum: Truck and Transportation Fleet, Car-Rental Company,
  Delivery Company, Private Vehicle Owner, School Transportation,
  Construction Fleet, Corporate Vehicles, Taxi Fleet, Heavy Equipment,
  Emergency or Service Vehicles, Other)
- `num_vehicles` (integer, required, positive; defaults to 1 for Private
  Vehicle Owner)
- `vehicle_type` (enum: Cars, Trucks, Vans, Buses, Motorcycles, Heavy
  Equipment, Mixed Fleet, Other)
- `preferred_area` (text, required)
- `preferred_date` (date, required; must not be in the past)
- `message` (text, nullable)
- `submission_channel` (enum: "whatsapp" | "email")
- `status` (enum: New Request, Contacted, Confirmed, Completed, Cancelled;
  default "New Request" — full status-change UI is Phase 2, but the column
  and values exist now so Phase 2 doesn't need a migration)
- `internal_notes` (text, nullable — same rationale as `status`; no UI to
  edit it until Phase 2)
- `created_at`, `updated_at` (timestamps)

### `contact_inquiries`
- `full_name`, `phone`, `email`, `message`, `created_at` — kept as a
  separate table from `booking_requests` per customer doc §18.

### RLS
Both tables: no policy grants anonymous `select`/`insert`/`update`/`delete`.
All access goes through Server Actions using the service-role key, which
bypasses RLS by design at the server boundary — satisfies "public users must
never be able to read/list/edit/delete requests" without relying on
obscurity.

## 6. Content Compliance Changes (existing pages)

- Replace every "GPSNAVIX" copy reference (WhatsApp/email templates, success
  messages, SEO keyword list) with "TrackWay". The `gpsnavix@gmail.com`
  address itself is unaffected (see §2, resolution 1).
- Remove "driver behavior" from marquee keywords / feature content —
  explicitly banned in the customer doc.
- Re-seed the `feature` Sanity documents to the doc's 9 "Key Capabilities":
  Live Tracking, Trip History, Speed Alerts, Geofencing, Ignition Alerts,
  Movement Alerts, Engine Control, Fleet Reports, Multi-Vehicle Management.
  Content-only change.
- Add an optional `icon` field (string, one of a fixed set of icon names
  matching the 9 Key Capabilities — e.g. `live-tracking`, `trip-history`,
  `speed-alerts`, `geofencing`, `ignition-alerts`, `movement-alerts`,
  `engine-control`, `fleet-reports`, `multi-vehicle`) to the `feature`
  schema, rendered via a small SVG icon set in the restyled feature-row
  component (see §9) with a subtle entrance/hover animation — currently
  text-only, no icon support.
- Verify no numeric stats/counters appear anywhere on the homepage (explicit
  ban in the Core Value section).

## 7. Header / Footer / Nav Changes

- Add a prominent **"Book an Installation"** CTA button to `Header`
  (desktop + mobile menu), linking to `/book-installation`.
- Add a literal **"EN | العربية"** dual-label language selector (doc wants
  both labels visible, not just a link to "the other" language).
- Footer: clickable WhatsApp/phone/email links, "Serving customers
  throughout Lebanon" line, Privacy Policy link (points to the Phase 1 stub
  page until Phase 3 fills in real content), copyright. No address/hours per
  doc §11.

## 8. New Page: `/book-installation`

Form fields, options, and validation exactly per customer doc §17: no
preferred time, no service-required field, no pricing fields, no
device-selection fields, no consent checkbox, no file upload, no
current-tracking-system field, no warranty questions, no social-media
fields.

Two submission paths, both gated on a successful DB save first (per doc: do
not open WhatsApp, and do not show success, until the request is actually
saved):

- **Continue on WhatsApp:** validate → save to `booking_requests`
  (`submission_channel = "whatsapp"`, `status = "New Request"`) via Server
  Action → on success, open a `wa.me` deep link with the URL-encoded
  English/Arabic message template from the doc (brand corrected to
  TrackWay). On save failure: honest error message, retry allowed, WhatsApp
  never opens.
- **Send Request by Email:** validate → save to `booking_requests`
  (`submission_channel = "email"`) → send via Resend to the business inbox →
  honest success/error state using the doc's exact copy ("Your request has
  been received. Your preferred date is not yet confirmed...", with the
  Arabic equivalent for `/ar`).

Spam/duplicate prevention (Phase 1, no paid service): honeypot field,
disable-on-submit, and a server-side duplicate-submission check (reject a
new insert with the same phone + preferred_date as an existing row created
within the last 5 minutes) before insert.

## 9. Visual Design Refinements

Per user request, the visual language draws further inspiration from
navleb.com (viewed directly during this session), while staying within the
customer doc's content restrictions and the prior spec's decision to use a
distinct accent color:

- **Restyle `FeatureCard`** from a boxed grid card to a **numbered
  horizontal row**: bold accent number (01, 02, ...), title left,
  description right, arrow icon far right, thin divider line between rows —
  matches navleb's "Solution we provide" section, reads more premium than
  boxed cards.
- Keep the existing `DotGridBackground variant="world"` hero pattern — it
  already matches navleb's dotted-world-map-with-glowing-pins motif.
- Keep the circular "Explore ↗" badge CTA pattern (already in the master
  spec, confirmed as a real navleb pattern worth keeping).
- Keep cyan (`#00E5D4`) as the accent, not navleb's yellow — deliberate,
  avoids look-alike branding with this specific competitor.
- Do **not** copy navleb's real dashboard screenshot in their "White Label"
  section — customer doc bans fabricated/real software screenshots; the
  Fleet-Control Visual section stays an abstract/generic interface
  visualization (custom cards, map graphics, status indicators), not a
  screenshot.
- No Pricing/Plans, Testimonials, or Blog sections — out of scope per
  customer doc.

## 9a. 3D / Motion System

Following a direct user request to make high-end 3D/animation a top design
priority, this section specs the concrete build. A three-agent parallel
creative-concepting pass (independent Opus-generated concepts: an abstract
route/map treatment, a floating fleet-control-cards treatment, and a
wireframe-vehicle-convoy treatment) was run and synthesized rather than
picking one concept wholesale — the three converged independently on the
same technical baseline (below), which is a strong signal those are the
right defaults, and their creative differences map cleanly onto two
separate sections the customer doc already specifies rather than
overloading one scene.

### Scope: sitewide ("Everywhere"), tiered by section weight

Per explicit user decision, 3D/motion touches are not confined to the hero —
most sections and pages get some treatment. To keep this compatible with
the doc's own performance mandate, investment is tiered by how
LCP-sensitive and above-the-fold each spot is:

- **Flagship tier** (heaviest, most bespoke): Hero and the Fleet-Control
  Visual homepage section — see below.
- **Standard tier** (consistent but lighter, reused component patterns, not
  bespoke scenes): Key Capabilities row icons (subtle 3D/animated icon per
  capability, hover/entrance motion), Industries Preview cards (tilt/depth
  on hover, GSAP entrance stagger), numbered feature-row entrance
  animations, page-section reveals (scroll-triggered fade/slide per the
  "Scrollytelling" pattern), button/CTA micro-interactions.
- **Everywhere else**: standard Framer Motion/CSS-transform micro-
  interactions (hover, tap, focus states) — no WebGL, negligible cost.

No page ships 3D without first passing the same Lighthouse gate the master
spec already requires (LCP < 2.5s, CLS < 0.1) — this is non-negotiable
acceptance criteria, not a target to approach. If a section's 3D treatment
can't hit it after optimization, it gets downgraded to the standard tier
(CSS/Framer Motion equivalent) for that section rather than shipped over
budget.

### Flagship 1 — Hero: "Convoy"

Wireframe/low-poly vehicles (generic, non-brand-resembling — trucks, vans,
buses, cars as procedural edge-geometry, built from primitives, not an
external asset) streaming along 3–4 curved light-trail lanes over the
existing `DotGridBackground variant="world"` reinterpreted as a floor
plane. Cyan trails, staggered speeds, camera does a small mouse-driven
parallax only (no scroll-hijack). Chosen over the other two hero
candidates because it's the only one that actually depicts vehicles, which
the doc's hero brief explicitly asks for, and it's the cheapest of the
three (~8–12 draw calls via `InstancedMesh` per vehicle type — 4 base
meshes, ~30 instances total).

### Flagship 2 — Fleet-Control Visual (homepage §E): "Control Room"

A loose 3D constellation of abstract monitoring-card chrome (status dots,
procedural sparklines, simplified vehicle glyphs — no text, no numbers, no
mockup of a real dashboard) at varying depth, threaded by faint cyan
route-lines, on a slow idle "breath" + mouse-parallax. Reserved for this
dedicated section (not the hero) because it's below the fold and can
lazy-mount on scroll-into-view — so it can absorb its heavier budget
(~25–35 draw calls, uses `MeshTransmissionMaterial` for glass cards,
swapped to a cheaper flat-fresnel shader under 768px) without touching
LCP. This is also literally what §E's doc brief describes ("custom
abstract interface cards, map graphics, status indicators").

The third candidate concept (glowing route-lines + pulsing-ring location
pins on the map, no vehicles or cards) isn't built as its own section —
its location-pin pulse-ring technique and its static-SVG-fallback approach
are reused inside both sections above.

### Shared technical baseline (mandatory for both flagship builds)

- **No post-processing bloom** (`EffectComposer`/`UnrealBloomPass`) —
  faked with additive-blended sprites and wider low-opacity duplicate
  lines instead. All three independent concepts flagged real bloom as the
  most likely thing to break the mobile budget; treat this as settled.
- **Lazy-mount behind a static poster**: the R3F `<Canvas>` is a
  `next/dynamic({ ssr: false })` import, mounted into a server-rendered,
  fixed-height container after first paint. The LCP element is always the
  static headline + poster image, never the canvas. CLS stays ~0 because
  the container's dimensions are reserved at SSR.
- **`frameloop="demand"`** with `invalidate()` driven by an
  IntersectionObserver-gated internal loop — no GPU work while the section
  is off-screen or the tab is backgrounded.
- **Device-tier downgrade**: cap DPR at 1.5–1.75 on mobile, reduce
  instance/particle counts, and disable the heavier material
  (`MeshTransmissionMaterial`) below a `deviceMemory < 4` or narrow-
  viewport threshold, falling back to a flat shader equivalent.
- **`prefers-reduced-motion` and failed-WebGL fallback**: render a fully
  **static** SVG/poster version of the same composition (not merely
  slowed or paused) — pre-composed once, not regenerated at runtime.
- **Text-safe-zone masking**: every flagship scene constrains motion/glow
  to a defined zone away from headline text, backed by a scrim/vignette,
  with any object that drifts into the text bounding box force-dimmed.
  Identified independently by all three concepts as the top risk
  (legibility) — treated as a hard requirement, not a nice-to-have.
- Geometry is **procedural only** (built from primitives/shaders in code)
  per the earlier "zero cost" decision — no external generated or licensed
  3D assets for these two flagship scenes.

## 9b. Homepage Sections To Build

Reviewing the current homepage code (`app/[locale]/page.tsx`) against the
customer doc's homepage brief (§12, sections A–G) found it's incomplete
against that brief: today it has hero text, marquee ticker, a features
grid, an about teaser, a hardware teaser, and a contact CTA. Missing
entirely:

- **§B Core Value** — 3-up section: Reliable Tracking Technology / Advanced
  Fleet Software / Flexible Installation. No numeric stats/counters
  (explicit doc ban) — verify none creep in.
- **§D Industries Preview** — strip of 5 industry cards (Transportation
  Fleets, Car-Rental Companies, Delivery Fleets, School Transportation,
  Private Vehicles) with a CTA to "explore all industries." That CTA's
  target (`/industries`) doesn't exist until Phase 3 — link it once Phase 3
  ships; until then the CTA is present but the section can point at
  `/fleet-solutions` or be omitted from nav-linking without blocking this
  section's build.
- **§E Fleet-Control Visual** — see §9a Flagship 2 above.
- **§F How It Works** — 3-step process (Submit Details → Continue via
  WhatsApp/Email → Confirm Installation) plus the doc's required notice
  text: "Submitting a preferred date does not automatically confirm the
  appointment."
- **§G Final CTA** — closing banner, "Ready to Take Control of Your
  Vehicles?" with both CTA buttons.

This was implicitly required by the original master spec's page list
(`/` = full homepage) but under-specified there; per user decision (§2,
folding this into Phase 1 rather than a separate Phase 1b), all five
sections ship as part of this phase, styled per §9's numbered-row /
navleb-inspired refinements and using the §9a 3D/motion tiers where
applicable (Industries Preview cards get the "standard tier" treatment;
Core Value, How It Works, and Final CTA are content sections with
Framer Motion entrance animations only, no WebGL — no reason for it).

## 9c. Hardware Content (Teltonika FMC920 / FMC130)

Per user instruction, the `/hardware` page (kept as-is per §2 resolution 3)
is populated with TrackWay's actual stocked hardware, researched directly
from Teltonika's official product pages during this session:

- **FMC920** (basic tier) — 79×43×12mm, 54g; 4G LTE Cat 1 with
  GPS/GLONASS/Galileo/BeiDou/SBAS/QZSS, <2.5m accuracy; Bluetooth LE for
  external sensors (temperature, humidity, magnet, movement); remote
  engine block; auto/manual geofencing; crash/jamming/over-speed
  detection; eco-driving scoring. Doc-confirmed use cases: basic track &
  trace, anti-theft/stolen-vehicle recovery, green driving. Positioned as
  the private-vehicle / light-fleet tier.
- **FMC130** (advanced tier) — 55g, IP41; same core connectivity/GNSS as
  FMC920, plus CAN bus adapter support (reads odometer/fuel level directly
  from the vehicle ECU) and impulse input for precise fuel-flow metering;
  negative input (doors/alarm/seatbelt sensors), 3 configurable digital
  outputs, immobilizer, towing/unplug/excessive-idling detection.
  Applications: automotive, agricultural, marine, motorcycle. Positioned
  as the fleet-grade tier (trucks, transportation/delivery fleets,
  construction/heavy equipment) — matches the customer doc's audience
  priority order.

**Imagery decision:** Teltonika's public product pages don't expose a
downloadable photo/media kit; that's normally distributed through their
partner/reseller portal or on request once a distributor relationship is
confirmed. Rather than scrape/hotlink product photography without
confirming licensing, Phase 1 default is **custom illustrated/rendered
device graphics** (consistent with the site's abstract visual language,
zero licensing risk) — swapped for official photos if/when TrackWay
obtains them through its Teltonika distributor contact. Carried forward on
the pre-launch flag list (§13).

## 10. Contact Page Backend Wiring

Replace the current pure `mailto:`/`wa.me` `ContactForm` (client-only, no
validation, no loading/success/error states) with one that validates
client + server and submits via a Server Action → Resend, storing into
`contact_inquiries`, with real loading/success/error states. Direct
clickable WhatsApp/phone/email links elsewhere on the Contact page remain
plain links per doc §18.

## 11. Testing (Phase 1 slice of customer doc §32)

- Vitest: booking validation (conditional company-name rule, private-owner
  default of 1 vehicle, past-date rejection), WhatsApp message encoding
  (EN + AR), Server Action save-then-send ordering (no WhatsApp open and no
  false success on save failure).
- Playwright e2e: full booking submission happy path on both channels,
  contact form happy path, mobile viewport (375px) check for both forms.

## 12. Explicitly Out of Scope for Phase 1

- Admin dashboard and admin authentication (Phase 2).
- Fleet Solutions, Industries, Features-detail, Privacy Policy (full
  content), 404/loading/error-state pages (Phase 3).
- Hardware page structural rewrite — kept as-is per explicit user decision
  (§2); only its content is updated per §9c.
- Paid rate-limiting service.
- Real production domain and real business email address — both use
  placeholders per user instruction, to be swapped in before launch.
- Bespoke 3D treatment beyond the two flagship sections and the standard-
  tier component patterns listed in §9a — no per-industry-page or per-
  feature-detail-page 3D scenes until those pages exist in Phase 3.

## 13. Pre-Launch Flags (carried forward, not blocking Phase 1 work)

- `/hardware` names a real third-party brand (Teltonika) and real
  model/spec data — contradicts the customer doc's brand/spec ban; raise
  with the customer before launch.
- Booking form collects personal data before the full Privacy Policy exists
  (stub only in Phase 1) — full policy must ship before real traffic.
- `gpsnavix@gmail.com`, placeholder sender domain, and placeholder site
  domain are all temporary — must be swapped for real TrackWay values before
  launch.
- Hardware imagery is custom-illustrated by default (§9c) — swap for
  official Teltonika photography if/when a distributor relationship
  provides licensed assets.
- New 3D/animation dependencies (`three`, `@react-three/fiber`,
  `@react-three/drei`, `gsap`, `framer-motion`) must be verified
  code-split and off the critical path — re-run Lighthouse on every page
  that ships 3D before considering Phase 1 done, per §9a's non-negotiable
  gate. Test on a real mid-range Android device representative of the
  Lebanese market, not just desktop DevTools throttling.
