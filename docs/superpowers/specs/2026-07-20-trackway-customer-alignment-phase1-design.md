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
  Fleet-Control Visual section (Phase 1 homepage section, already in master
  spec) stays an abstract/generic interface visualization (custom cards, map
  graphics, status indicators), not a screenshot.
- No Pricing/Plans, Testimonials, or Blog sections — out of scope per
  customer doc.

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
- Hardware page rewrite — kept as-is per explicit user decision (§2).
- Paid rate-limiting service.
- Real production domain and real business email address — both use
  placeholders per user instruction, to be swapped in before launch.

## 13. Pre-Launch Flags (carried forward, not blocking Phase 1 work)

- `/hardware` still names device brands/models/specs — contradicts the
  customer doc; raise with the customer before launch.
- Booking form collects personal data before the full Privacy Policy exists
  (stub only in Phase 1) — full policy must ship before real traffic.
- `gpsnavix@gmail.com`, placeholder sender domain, and placeholder site
  domain are all temporary — must be swapped for real TrackWay values before
  launch.
