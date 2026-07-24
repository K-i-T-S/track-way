# TrackWay Hardware Content — Plan 4 of 4 (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the `/hardware` page with TrackWay's real stocked devices (Teltonika FMC920 and FMC130), researched and documented in the approved spec (§9c), plus a small bug fix found while reviewing the page.

**Architecture:** No schema or component changes — `hardwareProduct` (name/description/images/specs, all `{en, ar}`) already supports everything needed; this is almost entirely a content task. The one genuine code change is a locale-awareness bug in `generateMetadata`.

**Tech Stack:** Existing Sanity/Next.js stack. No new dependencies.

**Depends on:** None of the other three plans — this can execute in any order relative to them, since it only touches `/hardware`-specific files plus one shared-but-isolated metadata function.

## Global Constraints

- No device brand names, model numbers, or specs are shown to be *invented* — every value in this plan traces back to Teltonika's own published specifications (recorded in the spec doc and reproduced in Task 3's checklist).
- No pricing anywhere.
- Custom illustrations only — no scraped or hotlinked third-party product photography (per spec §9c's imagery decision).
- This is a deliberate, already-approved deviation from the customer doc's brand/spec restrictions (spec §2 resolution 3) — not re-litigated here.

---

## File Structure

| File | Change |
|---|---|
| `app/[locale]/hardware/page.tsx` | Modify — locale-aware `generateMetadata` |
| `app/[locale]/hardware/page.test.tsx` | Modify — add metadata test |
| `messages/en.json`, `messages/ar.json` | Modify — add `hardware.metaTitle`, `hardware.metaDescription` |
| `design-assets/hardware/fmc920.svg` | Create — source illustration for Sanity upload |
| `design-assets/hardware/fmc130.svg` | Create — source illustration for Sanity upload |

---

### Task 1: Fix locale-unaware hardware page metadata

The current `generateMetadata` in `app/[locale]/hardware/page.tsx` takes no `params` and always returns the English title/description, even on `/ar/hardware` — found while reviewing this page for the hardware content update. Fixing it now since it's directly in scope and small.

**Files:**
- Modify: `app/[locale]/hardware/page.tsx`
- Modify: `app/[locale]/hardware/page.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json`

- [ ] **Step 1: Add translation keys**

In `messages/en.json`, update the `hardware` object:

```json
  "hardware": {
    "requestQuote": "Request a Quote",
    "metaTitle": "GPS Hardware — TrackWay",
    "metaDescription": "Explore TrackWay's GPS tracking hardware for fleets and individuals."
  }
```

In `messages/ar.json`, update the `hardware` object:

```json
  "hardware": {
    "requestQuote": "اطلب عرض سعر",
    "metaTitle": "أجهزة تتبع GPS — TrackWay",
    "metaDescription": "تعرّفوا على أجهزة تتبع GPS من TrackWay المخصصة للأساطيل والأفراد."
  }
```

- [ ] **Step 2: Write the failing test**

Add to `app/[locale]/hardware/page.test.tsx` — first extend the existing `next-intl/server` mock's translations record to include the two new keys:

```tsx
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      requestQuote: "Request a Quote",
      metaTitle: "GPS Hardware — TrackWay",
      metaDescription: "Explore TrackWay's GPS tracking hardware for fleets and individuals.",
    };
    return translations[key] ?? key;
  }),
}));
```

Then change the import line to also pull in `generateMetadata`:

```tsx
import HardwarePage, { generateMetadata } from "./page";
```

And add a new test inside `describe("HardwarePage", ...)`:

```tsx
  it("returns locale-aware metadata instead of a hardcoded English title", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(metadata.title).toBe("GPS Hardware — TrackWay");
    expect(metadata.description).toBe(
      "Explore TrackWay's GPS tracking hardware for fleets and individuals.",
    );
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run app/\[locale\]/hardware/page.test.tsx`
Expected: FAIL — `generateMetadata` currently takes no arguments, so calling it with a `params` object either errors or the assertion mismatches once the mocked translation keys change (the old implementation ignores the mock entirely and returns its own hardcoded strings — same visible text today, but the test is written against the *keys*, and Step 4 will change the source of truth, making this the correct failing-first state once you also verify the function signature accepts `params`).

Concretely: TypeScript will fail to compile the test (`npm run typecheck`) because the current `generateMetadata` signature is `(): Promise<Metadata>` and does not accept an argument — that compile failure **is** the expected failure for this step.

- [ ] **Step 4: Write the implementation**

In `app/[locale]/hardware/page.tsx`, replace `generateMetadata`:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const t = await getTranslations("hardware");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
```

(`params` is awaited only to stay consistent with every other page's `generateMetadata`/page-body signature in this codebase, which all destructure `{ locale }` from awaited `params` — here the locale itself isn't needed directly since `getTranslations("hardware")` reads it from the same request-scoped context the page body already relies on, same pattern as `HomePage`'s `t = await getTranslations("home")`.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run app/\[locale\]/hardware/page.test.tsx`
Expected: PASS (both tests).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/\[locale\]/hardware/page.tsx app/\[locale\]/hardware/page.test.tsx messages/en.json messages/ar.json
git commit -m "fix: make hardware page metadata locale-aware"
```

---

### Task 2: Custom device illustrations (source assets)

**Files:**
- Create: `design-assets/hardware/fmc920.svg`
- Create: `design-assets/hardware/fmc130.svg`

Not application code — these live outside `app/`/`components/` since they're source artifacts for upload into Sanity (Task 3), not assets Next.js serves directly. No test cycle; visual correctness is judged by review, not assertions.

- [ ] **Step 1: Create the FMC920 illustration (compact/basic tier — single antenna, one status LED)**

Create `design-assets/hardware/fmc920.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#0A0A0A"/>
  <g transform="translate(200,150)">
    <rect x="-70" y="-40" width="140" height="80" rx="14" fill="none" stroke="#00E5D4" stroke-width="2.5"/>
    <circle cx="-45" cy="-15" r="5" fill="#00E5D4"/>
    <line x1="0" y1="-40" x2="0" y2="-70" stroke="#00E5D4" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="0" cy="-74" r="4" fill="#00E5D4"/>
    <line x1="-30" y1="20" x2="30" y2="20" stroke="#00E5D4" stroke-width="1.5" opacity="0.6"/>
    <line x1="-30" y1="30" x2="15" y2="30" stroke="#00E5D4" stroke-width="1.5" opacity="0.4"/>
  </g>
</svg>
```

- [ ] **Step 2: Create the FMC130 illustration (advanced/fleet-grade tier — dual antenna, connector strip representing CAN bus/extra I/O)**

Create `design-assets/hardware/fmc130.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#0A0A0A"/>
  <g transform="translate(200,150)">
    <rect x="-85" y="-45" width="170" height="90" rx="14" fill="none" stroke="#00E5D4" stroke-width="2.5"/>
    <circle cx="-58" cy="-18" r="5" fill="#00E5D4"/>
    <line x1="-20" y1="-45" x2="-20" y2="-75" stroke="#00E5D4" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="-20" cy="-79" r="4" fill="#00E5D4"/>
    <line x1="20" y1="-45" x2="20" y2="-75" stroke="#00E5D4" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="20" cy="-79" r="4" fill="#00E5D4"/>
    <g transform="translate(-60,25)">
      <rect x="0" y="0" width="12" height="8" rx="1.5" fill="#00E5D4" opacity="0.8"/>
      <rect x="18" y="0" width="12" height="8" rx="1.5" fill="#00E5D4" opacity="0.8"/>
      <rect x="36" y="0" width="12" height="8" rx="1.5" fill="#00E5D4" opacity="0.8"/>
      <rect x="54" y="0" width="12" height="8" rx="1.5" fill="#00E5D4" opacity="0.8"/>
      <rect x="72" y="0" width="12" height="8" rx="1.5" fill="#00E5D4" opacity="0.8"/>
    </g>
    <text x="0" y="50" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#00E5D4" opacity="0.7">CAN / I-O</text>
  </g>
</svg>
```

The two-antenna-plus-connector-strip composition visually differentiates the advanced tier from FMC920's single-antenna silhouette, based on the real hardware difference (FMC130 has CAN bus + additional digital/analog I/O; FMC920 doesn't) — not decorative variation.

- [ ] **Step 3: Commit**

```bash
git add design-assets/hardware/fmc920.svg design-assets/hardware/fmc130.svg
git commit -m "feat: add custom illustrations for FMC920 and FMC130 hardware cards"
```

---

### Task 3 (manual, non-code): Populate the `hardwareProduct` Sanity documents

Not a code task — done in Sanity Studio (`/studio` route) against the project from `sanity/env.ts`. No test/commit cycle. Replace whatever placeholder `hardwareProduct` documents currently exist (per project memory, 2 were seeded with dev/placeholder copy) with these two, in this order (`order: 1`, `order: 2`):

> **Deviation from this task's original plan (2026-07-24):** Task 2's custom-SVG-illustration approach was superseded per explicit user decision — real Teltonika product renders (screenshotted/downloaded from teltonika-gps.com, self-hosted as Sanity image assets, not hotlinked) were used instead. `design-assets/hardware/*.svg` were never created; skip Task 2. Content below was populated directly via the Sanity API (one-off script using `SANITY_API_TOKEN`), not manually through Studio — both `hardware-1` (FMC920) and `hardware-2` (FMC130) documents now hold real spec data and real photos. **Still unlicensed** — these are not official press-kit assets; swap for licensed photography via an official Teltonika distributor relationship before launch, same caveat that applied to the illustration approach.

- [x] **FMC920** (`order: 1`)
  - `name.en`: "FMC920"
  - `name.ar`: "FMC920"
  - `description.en`: "A compact, best-selling 4G tracker built for straightforward vehicle and personal-vehicle tracking. Slim enough to fit tight installation spaces, with Bluetooth support for optional external sensors."
  - `description.ar`: "جهاز تتبع صغير الحجم يعمل بشبكة 4G، مصمم لتتبع المركبات والاستخدام الشخصي بسهولة. تصميمه النحيف يلائم أضيق أماكن التركيب، ويدعم تقنية البلوتوث لربط أجهزة استشعار خارجية اختيارية."
  - `images`: upload `design-assets/hardware/fmc920.svg` (Task 2)
  - `specs` (label/value pairs, `{en, ar}` each):
    | label (en / ar) | value (en / ar) |
    |---|---|
    | Connectivity / الاتصال | 4G LTE Cat 1 / 4G LTE فئة 1 |
    | Positioning / تحديد الموقع | GPS, GLONASS, Galileo, BeiDou / GPS، GLONASS، Galileo، BeiDou |
    | Accuracy / الدقة | Under 2.5 m / أقل من 2.5 متر |
    | Connectivity extras / إضافات الاتصال | Bluetooth for external sensors / بلوتوث لأجهزة استشعار خارجية |
    | Alerts / التنبيهات | Geofencing, over-speed, crash, jamming detection / تحديد المناطق، تجاوز السرعة، الاصطدام، التشويش |
    | Remote control / التحكم عن بُعد | Remote engine block via app / إيقاف تشغيل المحرك عن بُعد عبر التطبيق |
    | Best fit / الأنسب لـ | Private vehicles, light fleets, motorcycles / المركبات الخاصة، الأساطيل الصغيرة، الدراجات النارية |

- [x] **FMC130** (`order: 2`)
  - `name.en`: "FMC130"
  - `name.ar`: "FMC130"
  - `description.en`: "An advanced 4G tracker with CAN bus support for reading real vehicle data — odometer and fuel level — directly from the engine, plus precise fuel-flow metering. Built for serious fleet operations."
  - `description.ar`: "جهاز تتبع متقدم يعمل بشبكة 4G ويدعم منفذ CAN لقراءة بيانات المركبة الفعلية — كعداد المسافة ومستوى الوقود — مباشرة من المحرك، إضافة إلى قياس دقيق لتدفق الوقود. مصمم لعمليات الأساطيل الجادة."
  - `images`: upload `design-assets/hardware/fmc130.svg` (Task 2)
  - `specs`:
    | label (en / ar) | value (en / ar) |
    |---|---|
    | Connectivity / الاتصال | 4G LTE Cat 1 / 4G LTE فئة 1 |
    | Positioning / تحديد الموقع | GPS, GLONASS, Galileo, BeiDou / GPS، GLONASS، Galileo، BeiDou |
    | Vehicle data / بيانات المركبة | CAN bus support (odometer, fuel level) / دعم منفذ CAN (عداد المسافة، مستوى الوقود) |
    | Fuel monitoring / مراقبة الوقود | Precise fuel-flow metering via impulse input / قياس دقيق لتدفق الوقود عبر مدخل النبضات |
    | Alerts / التنبيهات | Geofencing, over-speed, towing, unplug, excessive idling / تحديد المناطق، تجاوز السرعة، السحب، الفصل، الخمول المفرط |
    | Remote control / التحكم عن بُعد | Remote engine block via app / إيقاف تشغيل المحرك عن بُعد عبر التطبيق |
    | Best fit / الأنسب لـ | Trucks, transportation/delivery fleets, construction, heavy equipment / الشاحنات، أساطيل النقل والتوصيل، الإنشاءات، المعدات الثقيلة |

- [x] Delete any other placeholder `hardwareProduct` documents so only these two remain. (Only `hardware-1`/`hardware-2` existed; both were updated in place via `createOrReplace`, so no extras to delete.)
- [ ] After publishing, confirm the Sanity webhook (`app/api/revalidate/route.ts`, already built) fires and `/en/hardware` and `/ar/hardware` show the updated content without a redeploy. (Verified locally via `npm run dev` — not yet checked against a deployed environment.)

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-07-20-trackway-customer-alignment-phase1-design.md` §9c):
- Real FMC920/FMC130 specs sourced from Teltonika's official site → Task 3 checklist, values match the research recorded in the spec. ✅
- Custom illustrated device graphics, not scraped photography → Task 2. ✅
- Positioning by tier (FMC920 = private/light-fleet, FMC130 = fleet-grade) matching the customer doc's audience priority → both descriptions' "Best fit" rows. ✅
- No structural rewrite of `/hardware` → confirmed no changes to `HardwareCard.tsx`, `hardwareProduct.ts` schema, or the page's layout in this plan.

**Placeholder scan:** no `TBD`/"add appropriate" phrasing.

**Type consistency:** no new types introduced; `generateMetadata`'s new signature matches the `{ params: Promise<{ locale: string }> }` shape used by every other page in the codebase (`page.tsx`, `about/page.tsx`, `contact/page.tsx`).

**Out of scope (unchanged from spec §12):** no pricing, no device-selection UI, no per-device detail pages — the existing single-page catalog grid stays exactly as architected.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-20-trackway-hardware-content.md`. All four Phase 1 plans are now written:**

1. `2026-07-20-trackway-content-visual-refresh.md`
2. `2026-07-20-trackway-booking-contact-backend.md`
3. `2026-07-20-trackway-homepage-3d-system.md`
4. `2026-07-20-trackway-hardware-content.md`

Ready to begin execution via superpowers:subagent-driven-development, starting with Plan 1, per your earlier instruction.
