# TrackWay Content & Visual Refresh — Plan 1 of 4 (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the existing (already-shipped) pages up to the client's visual and content bar — numbered-row feature cards with icons, a visible bilingual language selector, a complete footer, and a sitewide reduced-motion baseline — with zero backend dependency, so it can ship independently of the other three Phase 1 plans.

**Architecture:** Pure frontend changes to existing Next.js App Router components and the Sanity `feature` content model. No new routes except a minimal static `/privacy` stub (content arrives in Phase 3). No new npm dependencies.

**Tech Stack:** Next.js App Router, TypeScript strict, Tailwind CSS, next-intl, Sanity (schema only — content re-seeding is a manual Studio task), Vitest + React Testing Library.

## Global Constraints

- TypeScript strict — no `any`, no implicit returns.
- Every component tested at `dir="rtl"` is out of scope for *this* plan (no new RTL-sensitive layout logic is introduced — the language selector uses plain flex order, which mirrors automatically under the existing `dir="rtl"` on `<html>`), but must not regress existing RTL behavior.
- No numeric stats/counters, no fake data, no placeholder text (`TBD`, `[INSERT]`, etc.) in any shipped copy.
- Brand is "TrackWay" in all copy — never "GPSNAVIX", "Khalil", or "GPSNAVIX".
- "Driver behavior" must never appear as a capability, keyword, or feature name.
- The 9 approved Key Capabilities are exactly: Live Tracking, Trip History, Speed Alerts, Geofencing, Ignition Alerts, Movement Alerts, Engine Control, Fleet Reports, Multi-Vehicle Management — no more, no fewer.
- `prefers-reduced-motion: reduce` must produce a static-equivalent experience, not just a slower one.
- Run `npm run test` (Vitest) and `npm run typecheck` (tsc --noEmit) after every task; both must pass before moving to the next task.

---

## File Structure

| File | Change |
|---|---|
| `sanity/schemaTypes/feature.ts` | Modify — add `icon` field with fixed option list |
| `sanity/schemaTypes/index.test.ts` | Modify — assert the icon field's option list |
| `sanity/types.ts` | Modify — add `icon?: string` to `Feature` |
| `sanity/queries.ts` | Modify — include `icon` in `getFeatures` projection |
| `sanity/queries.test.ts` | Modify — assert the query string requests `icon` |
| `components/ui/CapabilityIcon.tsx` | Create — SVG icon set for the 9 Key Capabilities |
| `components/ui/CapabilityIcon.test.tsx` | Create |
| `components/ui/FeatureCard.tsx` | Modify — numbered horizontal row layout + optional icon + arrow |
| `components/ui/FeatureCard.test.tsx` | Modify — add icon-rendering assertions |
| `app/[locale]/page.tsx` | Modify — pass `icon` through to `FeatureCard` |
| `app/[locale]/page.test.tsx` | Modify — assert icon renders on the homepage |
| `app/globals.css` | Modify — add `prefers-reduced-motion` baseline |
| `app/globals.css.test.ts` | Create — regression guard on the CSS content |
| `components/layout/Header.tsx` | Modify — literal "EN \| العربية" dual-label selector |
| `components/layout/Header.test.tsx` | Modify — add dual-label assertions |
| `components/layout/Footer.tsx` | Modify — "Serving customers throughout Lebanon" line + Privacy Policy link |
| `components/layout/Footer.test.tsx` | Modify — add assertions for both |
| `app/[locale]/privacy/page.tsx` | Create — minimal stub page |
| `app/[locale]/privacy/page.test.tsx` | Create |
| `messages/en.json` | Modify — add `footer.servingLebanon`, `footer.privacyPolicy`, `privacy.title`, `privacy.body` |
| `messages/ar.json` | Modify — same keys, Arabic copy |

---

### Task 1: Add `icon` field to the feature content model (schema + type + query)

**Files:**
- Modify: `sanity/schemaTypes/feature.ts`
- Modify: `sanity/schemaTypes/index.test.ts`
- Modify: `sanity/types.ts`
- Modify: `sanity/queries.ts`
- Modify: `sanity/queries.test.ts`

**Interfaces:**
- Produces: `Feature.icon?: string` (in `sanity/types.ts`, consumed by Task 4); a fixed 9-value option list on the Sanity `feature` schema's `icon` field.

- [ ] **Step 1: Write the failing schema test**

Add to `sanity/schemaTypes/index.test.ts` (inside the existing `describe("schemaTypes", ...)` block, after the last `it`):

```ts
  it("gives feature a fixed set of icon options matching the 9 Key Capabilities", () => {
    const feature = schemaTypes.find((s) => s.name === "feature")!;
    if (feature.type !== "document") {
      throw new Error("Expected feature to be a document schema type");
    }
    const iconField = feature.fields.find((f) => f.name === "icon") as
      | { options?: { list?: Array<string | { value: string }> } }
      | undefined;
    expect(iconField).toBeDefined();
    const values = (iconField?.options?.list ?? []).map((opt) =>
      typeof opt === "string" ? opt : opt.value,
    );
    expect(values.sort()).toEqual(
      [
        "live-tracking",
        "trip-history",
        "speed-alerts",
        "geofencing",
        "ignition-alerts",
        "movement-alerts",
        "engine-control",
        "fleet-reports",
        "multi-vehicle",
      ].sort(),
    );
  });
```

**Files:** `sanity/schemaTypes/index.test.ts`

- [ ] **Step 2: Write the failing query test**

Add to `sanity/queries.test.ts`, inside the existing `'getFeatures fetches feature documents ordered by "order"'` test, right after the two existing `expect(client.fetch).toHaveBeenCalledWith(...)` lines:

```ts
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining("icon"));
```

- [ ] **Step 3: Run both tests, verify they fail**

Run: `npx vitest run sanity/schemaTypes/index.test.ts sanity/queries.test.ts`
Expected: the new schema test FAILs with `expected undefined to be defined` (no `icon` field yet); the query test FAILs because the current `getFeatures` projection string doesn't contain `"icon"`.

- [ ] **Step 4: Implement — schema, type, query**

In `sanity/schemaTypes/feature.ts`, add a new field after `description` and before the closing `],` of `fields`:

```ts
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      options: {
        list: [
          { title: "Live Tracking", value: "live-tracking" },
          { title: "Trip History", value: "trip-history" },
          { title: "Speed Alerts", value: "speed-alerts" },
          { title: "Geofencing", value: "geofencing" },
          { title: "Ignition Alerts", value: "ignition-alerts" },
          { title: "Movement Alerts", value: "movement-alerts" },
          { title: "Engine Control", value: "engine-control" },
          { title: "Fleet Reports", value: "fleet-reports" },
          { title: "Multi-Vehicle Management", value: "multi-vehicle" },
        ],
      },
    }),
```

In `sanity/types.ts`, add to the `Feature` interface:

```ts
export interface Feature {
  _id: string;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  icon?: string;
}
```

In `sanity/queries.ts`, update `getFeatures`:

```ts
export async function getFeatures(): Promise<Feature[]> {
  return client.fetch(`*[_type == "feature"] | order(order asc){
    _id,
    order,
    title,
    description,
    icon
  }`);
}
```

- [ ] **Step 5: Run tests again, verify they pass**

Run: `npx vitest run sanity/schemaTypes/index.test.ts sanity/queries.test.ts`
Expected: PASS (all tests in both files).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add sanity/schemaTypes/feature.ts sanity/schemaTypes/index.test.ts sanity/types.ts sanity/queries.ts sanity/queries.test.ts
git commit -m "feat: add icon field to feature content model"
```

---

### Task 2: Build the capability icon set

**Files:**
- Create: `components/ui/CapabilityIcon.tsx`
- Test: `components/ui/CapabilityIcon.test.tsx`

**Interfaces:**
- Produces: `CapabilityIcon({ name: CapabilityIconName, className?: string })` and the exported type `CapabilityIconName` (a 9-value string union), consumed by Task 3 (`FeatureCard`) and Task 4 (`page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `components/ui/CapabilityIcon.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CapabilityIcon } from "./CapabilityIcon";

describe("CapabilityIcon", () => {
  it("renders a distinct, decorative svg for each of the 9 Key Capabilities", () => {
    const names = [
      "live-tracking",
      "trip-history",
      "speed-alerts",
      "geofencing",
      "ignition-alerts",
      "movement-alerts",
      "engine-control",
      "fleet-reports",
      "multi-vehicle",
    ] as const;

    const markups = names.map((name) => {
      const { container } = render(<CapabilityIcon name={name} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      return container.innerHTML;
    });

    expect(new Set(markups).size).toBe(names.length);
  });

  it("applies a passed className to the svg element", () => {
    const { container } = render(
      <CapabilityIcon name="live-tracking" className="h-8 w-8 text-accent" />,
    );
    expect(container.querySelector("svg")).toHaveClass(
      "h-8",
      "w-8",
      "text-accent",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ui/CapabilityIcon.test.tsx`
Expected: FAIL — `Failed to resolve import "./CapabilityIcon"`.

- [ ] **Step 3: Write the implementation**

Create `components/ui/CapabilityIcon.tsx`:

```tsx
import type { ReactNode } from "react";

export type CapabilityIconName =
  | "live-tracking"
  | "trip-history"
  | "speed-alerts"
  | "geofencing"
  | "ignition-alerts"
  | "movement-alerts"
  | "engine-control"
  | "fleet-reports"
  | "multi-vehicle";

interface CapabilityIconProps {
  name: CapabilityIconName;
  className?: string;
}

const ICON_PATHS: Record<CapabilityIconName, ReactNode> = {
  "live-tracking": (
    <>
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  "trip-history": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  "speed-alerts": (
    <>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M12 12 16 8" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  geofencing: (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  "ignition-alerts": (
    <>
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h9" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </>
  ),
  "movement-alerts": (
    <>
      <path d="M3 12h13" />
      <path d="m12 6 6 6-6 6" />
    </>
  ),
  "engine-control": (
    <>
      <path d="M12 3v7" />
      <path d="M7 6a7 7 0 1 0 10 0" />
    </>
  ),
  "fleet-reports": (
    <>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </>
  ),
  "multi-vehicle": (
    <>
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="m4 11 8 4 8-4" />
      <path d="m4 15 8 4 8-4" />
    </>
  ),
};

export function CapabilityIcon({
  name,
  className,
}: CapabilityIconProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/ui/CapabilityIcon.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/CapabilityIcon.tsx components/ui/CapabilityIcon.test.tsx
git commit -m "feat: add CapabilityIcon set for the 9 Key Capabilities"
```

---

### Task 3: Restyle FeatureCard to a numbered horizontal row

**Files:**
- Modify: `components/ui/FeatureCard.tsx`
- Modify: `components/ui/FeatureCard.test.tsx`

**Interfaces:**
- Consumes: `CapabilityIcon` and `CapabilityIconName` from Task 2 (`@/components/ui/CapabilityIcon` — relative import `./CapabilityIcon` since same directory).
- Produces: `FeatureCard({ number: string, title: string, description: string, icon?: CapabilityIconName })`, consumed by Task 4.

- [ ] **Step 1: Write the failing tests**

Add to `components/ui/FeatureCard.test.tsx` (after the existing `it` block, inside the same `describe`):

```tsx
  it("renders the capability icon when provided", () => {
    render(
      <FeatureCard
        number="01"
        title="Live Tracking"
        description="See vehicles in real time."
        icon="live-tracking"
      />,
    );
    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("omits the icon block when no icon is provided", () => {
    render(
      <FeatureCard
        number="02"
        title="Trip History"
        description="Review past routes."
      />,
    );
    expect(document.querySelector("svg")).toBeNull();
  });
```

- [ ] **Step 2: Run tests to verify the new positive-case test fails**

Run: `npx vitest run components/ui/FeatureCard.test.tsx`
Expected: the "renders the capability icon when provided" test FAILs (`document.querySelector("svg")` is `null` — current `FeatureCard` renders no icon and doesn't accept an `icon` prop). The "omits the icon block" test passes trivially either way — that's expected, it documents behavior rather than driving it.

- [ ] **Step 3: Write the implementation**

Replace `components/ui/FeatureCard.tsx` entirely:

```tsx
import { CapabilityIcon, type CapabilityIconName } from "./CapabilityIcon";

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  icon?: CapabilityIconName;
}

export function FeatureCard({
  number,
  title,
  description,
  icon,
}: FeatureCardProps): React.ReactElement {
  return (
    <div className="group flex items-center gap-6 border-b border-white/10 py-8 first:border-t">
      <span className="text-2xl font-bold text-accent">{number}</span>
      {icon && (
        <CapabilityIcon
          name={icon}
          className="h-8 w-8 shrink-0 text-accent transition-transform duration-300 motion-safe:group-hover:scale-110"
        />
      )}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-muted">{description}</p>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1"
      >
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/ui/FeatureCard.test.tsx`
Expected: PASS (3 tests — the original plus the two new ones).

- [ ] **Step 5: Commit**

```bash
git add components/ui/FeatureCard.tsx components/ui/FeatureCard.test.tsx
git commit -m "feat: restyle FeatureCard as a numbered row with icon and arrow"
```

---

### Task 4: Wire the icon through the homepage Key Capabilities section

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/page.test.tsx`

**Interfaces:**
- Consumes: `Feature.icon?: string` (Task 1), `CapabilityIconName` (Task 2), `FeatureCard`'s `icon` prop (Task 3).

- [ ] **Step 1: Write the failing test**

In `app/[locale]/page.test.tsx`, update the `getFeatures` mock to include an `icon`, and add a new test. Replace the `getFeatures` mock array with:

```tsx
  getFeatures: vi.fn().mockResolvedValue([
    {
      _id: "1",
      order: 1,
      title: { en: "Live Tracking", ar: "تتبع مباشر" },
      description: {
        en: "Real-time location.",
        ar: "الموقع في الوقت الفعلي.",
      },
      icon: "live-tracking",
    },
  ]),
```

Add a new test inside `describe("HomePage", ...)`:

```tsx
  it("renders the capability icon for each feature that has one", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {jsx}
      </NextIntlClientProvider>,
    );
    const featureHeading = screen.getByRole("heading", { name: "Live Tracking" });
    const card = featureHeading.closest("div.group");
    expect(card?.querySelector("svg")).not.toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/\[locale\]/page.test.tsx`
Expected: FAIL — the feature card renders without a `<svg>` because `page.tsx` doesn't pass `icon` to `FeatureCard` yet.

- [ ] **Step 3: Write the implementation**

In `app/[locale]/page.tsx`, add the import:

```tsx
import type { CapabilityIconName } from "@/components/ui/CapabilityIcon";
```

Update the features map:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/\[locale\]/page.test.tsx`
Expected: PASS (all tests in the file).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/page.tsx app/\[locale\]/page.test.tsx
git commit -m "feat: wire capability icons through the homepage feature grid"
```

---

### Task 5: Sitewide `prefers-reduced-motion` baseline

**Files:**
- Modify: `app/globals.css`
- Create: `app/globals.css.test.ts`

**Interfaces:** None — pure CSS, no exported symbols.

- [ ] **Step 1: Write the failing test**

Create `app/globals.css.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("globals.css", () => {
  it("disables animations and transitions when the user prefers reduced motion", () => {
    const css = readFileSync(join(__dirname, "globals.css"), "utf-8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation-duration: 0.01ms");
    expect(css).toContain("transition-duration: 0.01ms");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/globals.css.test.ts`
Expected: FAIL — none of the three strings exist in the current file.

- [ ] **Step 3: Write the implementation**

Append to `app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/globals.css.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/globals.css.test.ts
git commit -m "feat: add sitewide prefers-reduced-motion baseline"
```

---

### Task 6: Literal "EN | العربية" language selector in the Header

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/Header.test.tsx`

**Interfaces:** None new — `Header`'s props (`locale`, `logoUrl`) are unchanged.

- [ ] **Step 1: Write the failing tests**

Add to `components/layout/Header.test.tsx`, inside `describe("Header", ...)`, after the existing two tests:

```tsx
  it("shows both language labels, marks the current one, and links to the other", () => {
    renderHeader("en", "/hardware");
    expect(screen.getByText("EN")).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "العربية" })).toHaveAttribute(
      "href",
      "/ar/hardware",
    );
  });

  it("marks Arabic as current on the Arabic site and links back to English", () => {
    renderHeader("ar", "/hardware");
    expect(screen.getByText("العربية")).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute(
      "href",
      "/en/hardware",
    );
  });
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: FAIL — the current Header renders only one locale-swap link (labeled with the *other* locale's name), not both "EN" and "العربية" simultaneously, and nothing has `aria-current`.

- [ ] **Step 3: Write the implementation**

Replace `components/layout/Header.tsx` entirely:

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface HeaderProps {
  locale: Locale;
  logoUrl: string;
}

export function Header({ locale, logoUrl }: HeaderProps): React.ReactElement {
  const t = useTranslations("nav");
  const pathnameWithoutLocale = usePathname();
  const enHref = `/en${pathnameWithoutLocale}`;
  const arHref = `/ar${pathnameWithoutLocale}`;

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href={`/${locale}`}>
        <Image src={logoUrl} alt="TrackWay" width={120} height={32} />
      </Link>
      <nav className="flex items-center gap-6">
        <Link href={`/${locale}`}>{t("home")}</Link>
        <Link href={`/${locale}/hardware`}>{t("hardware")}</Link>
        <Link href={`/${locale}/about`}>{t("about")}</Link>
        <div
          className="flex items-center gap-2 text-sm"
          aria-label="Language selector"
        >
          {locale === "en" ? (
            <span className="font-bold text-foreground" aria-current="true">
              EN
            </span>
          ) : (
            <Link href={enHref}>EN</Link>
          )}
          <span aria-hidden="true" className="text-muted">
            |
          </span>
          {locale === "ar" ? (
            <span className="font-bold text-foreground" aria-current="true">
              العربية
            </span>
          ) : (
            <Link href={arHref}>العربية</Link>
          )}
        </div>
        <Link
          href={`/${locale}/contact`}
          className="rounded-full bg-accent px-4 py-2 font-bold text-background"
        >
          {t("contactCta")}
        </Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: PASS (all 4 tests — the original 2 plus the 2 new ones).

- [ ] **Step 5: Commit**

```bash
git add components/layout/Header.tsx components/layout/Header.test.tsx
git commit -m "feat: replace single-link locale switcher with EN | العربية selector"
```

---

### Task 7: Footer — Lebanon service line + Privacy Policy link, and the `/privacy` stub page

**Files:**
- Modify: `components/layout/Footer.tsx`
- Modify: `components/layout/Footer.test.tsx`
- Create: `app/[locale]/privacy/page.tsx`
- Create: `app/[locale]/privacy/page.test.tsx`
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

**Interfaces:** None new — `Footer`'s props are unchanged (`locale` was already a required prop, now actually used).

- [ ] **Step 1: Write the failing Footer test**

Replace `components/layout/Footer.test.tsx` entirely:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Footer } from "./Footer";

const messages = {
  footer: {
    quickLinks: "Quick Links",
    servingLebanon: "Serving customers throughout Lebanon.",
    privacyPolicy: "Privacy Policy",
  },
};

const siteSettings = {
  phoneNumbers: ["+961 3 123 456"],
  whatsappNumber: "+961 3 123 456",
  email: "info@trackway.com",
  socialLinks: [{ platform: "facebook", url: "https://facebook.com/trackway" }],
  addressText: "Beirut, Lebanon",
  footerText: "TrackWay: GPS tracking for everyone.",
};

describe("Footer", () => {
  it("renders phone, email, address, and social links", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Footer locale="en" siteSettings={siteSettings} />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("link", { name: "+961 3 123 456" }),
    ).toHaveAttribute("href", "tel:+961 3 123 456");
    expect(
      screen.getByRole("link", { name: "info@trackway.com" }),
    ).toHaveAttribute("href", "mailto:info@trackway.com");
    expect(screen.getByText("Beirut, Lebanon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /facebook/i })).toHaveAttribute(
      "href",
      "https://facebook.com/trackway",
    );
  });

  it("renders the Lebanon service line and a link to the Privacy Policy page", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Footer locale="en" siteSettings={siteSettings} />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByText("Serving customers throughout Lebanon."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/en/privacy");
  });
});
```

- [ ] **Step 2: Run test to verify the new test fails**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: FAIL — the current `Footer` renders neither the service line nor a Privacy Policy link.

- [ ] **Step 3: Add translation keys**

In `messages/en.json`, update the `footer` object and add a new `privacy` object:

```json
  "footer": {
    "quickLinks": "Quick Links",
    "servingLebanon": "Serving customers throughout Lebanon.",
    "privacyPolicy": "Privacy Policy"
  },
  "privacy": {
    "title": "Privacy Policy",
    "body": "TrackWay's full Privacy Policy is being finalized and will be published here shortly. For questions about how your information is handled, please contact us via WhatsApp or email."
  }
```

In `messages/ar.json`, update the `footer` object and add a new `privacy` object:

```json
  "footer": {
    "quickLinks": "روابط سريعة",
    "servingLebanon": "نخدم العملاء في جميع أنحاء لبنان.",
    "privacyPolicy": "سياسة الخصوصية"
  },
  "privacy": {
    "title": "سياسة الخصوصية",
    "body": "يجري حاليًا إعداد سياسة الخصوصية الكاملة لشركة TrackWay وسيتم نشرها هنا قريبًا. لأي استفسار حول كيفية التعامل مع بياناتكم، يُرجى التواصل معنا عبر واتساب أو البريد الإلكتروني."
  }
```

(Both files keep their other existing top-level keys — `nav`, `home`, `hardware`, `contact` — unchanged.)

- [ ] **Step 4: Write the Footer implementation**

Replace `components/layout/Footer.tsx` entirely:

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

interface FooterSiteSettings {
  phoneNumbers: string[];
  whatsappNumber: string;
  email: string;
  socialLinks: { platform: string; url: string }[];
  addressText: string;
  footerText: string;
}

interface FooterProps {
  locale: Locale;
  siteSettings: FooterSiteSettings;
}

export function Footer({ locale, siteSettings }: FooterProps): React.ReactElement {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <p className="text-muted">{siteSettings.footerText}</p>
      <p className="mt-2 text-muted">{siteSettings.addressText}</p>
      <p className="mt-2 text-muted">{t("servingLebanon")}</p>
      <div className="mt-4 flex flex-col gap-2">
        {siteSettings.phoneNumbers.map((phone) => (
          <a key={phone} href={`tel:${phone}`}>
            {phone}
          </a>
        ))}
        <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
      </div>
      <div className="mt-4 flex gap-4">
        {siteSettings.socialLinks.map((link) => (
          <a key={link.platform} href={link.url} aria-label={link.platform}>
            {link.platform}
          </a>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">{t("quickLinks")}</p>
      <Link
        href={`/${locale}/privacy`}
        className="mt-2 inline-block text-sm text-muted underline"
      >
        {t("privacyPolicy")}
      </Link>
    </footer>
  );
}
```

- [ ] **Step 5: Run Footer test to verify it passes**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 6: Write the failing privacy page test**

Create `app/[locale]/privacy/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      title: "Privacy Policy",
      body: "TrackWay's full Privacy Policy is being finalized and will be published here shortly. For questions about how your information is handled, please contact us via WhatsApp or email.",
    };
    return translations[key] ?? key;
  }),
}));

describe("PrivacyPage", () => {
  it("renders a heading and a placeholder notice", async () => {
    const jsx = await PrivacyPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(jsx);
    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/being finalized and will be published here shortly/),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run app/\[locale\]/privacy/page.test.tsx`
Expected: FAIL — `app/[locale]/privacy/page.tsx` doesn't exist yet.

- [ ] **Step 8: Write the privacy page implementation**

Create `app/[locale]/privacy/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("privacy");

  return (
    <div className="px-6 py-24">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t("body")}</p>
    </div>
  );
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run app/\[locale\]/privacy/page.test.tsx`
Expected: PASS.

Run: `npm run test` and `npm run typecheck`
Expected: the full suite and typecheck both pass.

- [ ] **Step 10: Commit**

```bash
git add components/layout/Footer.tsx components/layout/Footer.test.tsx app/\[locale\]/privacy/page.tsx app/\[locale\]/privacy/page.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add footer Lebanon line, Privacy Policy link, and /privacy stub page"
```

---

### Task 8 (manual, non-code): Re-seed Sanity content

Not a code task — done in Sanity Studio (`/studio` route) against the project from `sanity/env.ts` (project ID `347y5l2s`, dataset `production`, per project memory). No test/commit cycle; this is a content edit checklist for whoever has Studio access.

- [ ] Edit each of the 5 existing `feature` documents (or delete/recreate to reach exactly 9) so the set is exactly these 9, each with its matching `icon` value from Task 1's option list:

  | Title (en) | icon |
  |---|---|
  | Live Tracking | `live-tracking` |
  | Trip History | `trip-history` |
  | Speed Alerts | `speed-alerts` |
  | Geofencing | `geofencing` |
  | Ignition Alerts | `ignition-alerts` |
  | Movement Alerts | `movement-alerts` |
  | Engine Control | `engine-control` |
  | Fleet Reports | `fleet-reports` |
  | Multi-Vehicle Management | `multi-vehicle` |

- [ ] Edit the `homePage` document's `marqueeKeywords` array: remove any entry resembling "driver behavior" (in any casing/wording) and any entry resembling "fuel monitoring" (not in the approved capability list); keep it to wording drawn from the 9 capabilities above.
- [ ] Confirm no `feature` or `homePage` field anywhere contains a numeral used as a marketing statistic (e.g. "500+ vehicles") — the doc bans fabricated counters. Plain factual numbers that aren't claims (none expected at this stage) are not the concern; marketing-style counters are.

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-07-20-trackway-customer-alignment-phase1-design.md` §6, §7, §9's `FeatureCard` restyle, and §2 resolution 5's privacy stub requirement):
- §6 "Restyle FeatureCard... numbered row, icon" → Tasks 2–4. ✅
- §6 "Remove driver behavior... re-seed feature docs to the 9 capabilities" → Task 8 (content, not code — schema support for it is Task 1). ✅
- §6 "Verify no numeric stats/counters" → Task 8 checklist item. ✅
- §7 "EN | العربية dual-label selector" → Task 6. ✅
- §7 "Footer: Serving customers throughout Lebanon, Privacy Policy link" → Task 7. ✅
- §2 resolution 5 "minimal inline privacy note + link... stub `/privacy` page" → Task 7 builds the stub page and the Footer link to it. (The booking-form-specific inline note is Plan 2's responsibility, since the booking form doesn't exist yet.)
- §7 "Book an Installation CTA in Header" is intentionally **not** in this plan — it depends on the `/book-installation` route, which Plan 2 builds. Adding a button that 404s would fail the spec's own quality bar.
- Sitewide `prefers-reduced-motion` baseline isn't a named spec line item but is required by the master spec's accessibility section and directly supports §9a's reduced-motion requirement for the (later) 3D work — included here since it's foundational and independent of any other plan.

**Placeholder scan:** no `TBD`/`TODO`/"add appropriate" phrasing in any step; every step has runnable code or an exact manual instruction.

**Type consistency:** `CapabilityIconName` is defined once in Task 2 and imported (never redefined) in Tasks 3 and 4. `Feature.icon` is `string | undefined` in `sanity/types.ts` (Task 1) — deliberately looser than `CapabilityIconName` since it's CMS-sourced data — and narrowed with an explicit `as CapabilityIconName | undefined` cast at the one point it crosses into typed UI code (Task 4), which is safe because the Studio's `options.list` (Task 1) constrains editors to exactly those 9 values.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-20-trackway-content-visual-refresh.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
