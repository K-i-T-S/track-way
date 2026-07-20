# TrackWay Booking & Contact Backend — Plan 2 of 4 (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TrackWay's two primary conversion paths for real: a persisted `/book-installation` appointment-request form (WhatsApp + email submission channels) and a secure Contact form, both backed by Supabase (storage) and Resend (email), replacing the current client-only `mailto:`/`wa.me` `ContactForm`.

**Architecture:** Next.js Server Actions are the only code path that touches Supabase or Resend — the browser never sees the service-role key or the Resend API key. Server Actions return `{ success: boolean; data?: T; error?: string }` per the project's standard API response shape. Both tables have RLS enabled with **zero** policies, so only the service-role key (server-only) can read or write them — the "public users must never read/list/edit/delete requests" requirement is structural, not just a hidden route.

**Tech Stack:** Next.js Server Actions, `@supabase/supabase-js`, `resend`, existing next-intl / Tailwind / Vitest stack.

**Depends on:** Plan 1 (`2026-07-20-trackway-content-visual-refresh.md`) must be merged first — this plan's Header task builds on Plan 1's "EN | العربية" selector, shown together as one file so there's no ambiguity about the merged result.

## Global Constraints

- API/Server Action responses: `{ success: boolean; data?: T; error?: string }` — no exceptions.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to the client — both are read only inside files with no `"use client"` directive, and only inside functions (not at module top level), so a missing env var fails at call-time with an honest error, never at build time.
- No automatic customer-facing confirmation email — email sends go to TrackWay's own inbox, never to the visitor.
- Do not open WhatsApp or show a success state until the Supabase insert has actually succeeded.
- Company name: required unless `customerType === "Private Vehicle Owner"`.
- Past `preferredDate` values are rejected.
- No pricing fields, no consent checkbox, no file upload, no device-selection field, no "current tracking system" field — per customer doc §17.
- TypeScript strict — no `any`.
- Run `npm run test` and `npm run typecheck` after every task.

---

## File Structure

| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Modify — add `@supabase/supabase-js`, `resend` |
| `.env.example` | Modify — document new env vars |
| `supabase/schema.sql` | Create — `booking_requests` + `contact_inquiries` DDL and RLS |
| `lib/booking-validation.ts` | Create — `BookingFormInput`, `validateBookingForm`, option lists |
| `lib/booking-validation.test.ts` | Create |
| `lib/booking-messages.ts` | Create — WhatsApp/email template builders (EN + AR) |
| `lib/booking-messages.test.ts` | Create |
| `lib/supabase/server.ts` | Create — server-only Supabase client factory |
| `lib/supabase/server.test.ts` | Create |
| `lib/resend.ts` | Create — `sendBookingNotificationEmail`, `sendContactInquiryEmail` |
| `lib/resend.test.ts` | Create |
| `app/[locale]/book-installation/actions.ts` | Create — `submitBookingRequest` Server Action |
| `app/[locale]/book-installation/actions.test.ts` | Create |
| `components/ui/BookingForm.tsx` | Create |
| `components/ui/BookingForm.test.tsx` | Create |
| `app/[locale]/book-installation/page.tsx` | Create |
| `app/[locale]/book-installation/page.test.tsx` | Create |
| `components/layout/Header.tsx` | Modify — add "Book an Installation" CTA (on top of Plan 1's selector) |
| `components/layout/Header.test.tsx` | Modify |
| `app/[locale]/contact/actions.ts` | Create — `submitContactInquiry` Server Action |
| `app/[locale]/contact/actions.test.ts` | Create |
| `components/ui/ContactForm.tsx` | Modify — full rewrite: adds Phone/Email fields, drops direct wa.me/mailto links, submits via Server Action |
| `components/ui/ContactForm.test.tsx` | Modify — full rewrite |
| `app/[locale]/contact/page.tsx` | Modify — stop passing `whatsappNumber`/`email` props to `ContactForm` |
| `app/[locale]/contact/page.test.tsx` | Modify |
| `e2e/booking-form-validation.spec.ts` | Create |
| `e2e/pages-smoke.spec.ts` | Modify — add `/book-installation` and `/privacy` to the route list |
| `messages/en.json`, `messages/ar.json` | Modify — add `nav.bookInstallation`, full `booking` namespace, updated `contact` namespace |

---

### Task 1: Install dependencies

- [ ] **Step 1: Install**

Run: `npm install @supabase/supabase-js resend`
Expected: `package.json` gains both under `dependencies`; `package-lock.json` updates.

- [ ] **Step 2: Verify the project still builds and tests still pass**

Run: `npm run typecheck && npm run test`
Expected: no errors (nothing uses the new packages yet).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js and resend dependencies"
```

---

### Task 2: Supabase schema — `booking_requests` and `contact_inquiries`

Not a Vitest TDD task — this is infrastructure provisioning, verified against the live Supabase project rather than a unit test.

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Write the schema**

Create `supabase/schema.sql`:

```sql
create table booking_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  phone text not null,
  email text not null,
  customer_type text not null check (customer_type in (
    'Truck and Transportation Fleet',
    'Car-Rental Company',
    'Delivery Company',
    'Private Vehicle Owner',
    'School Transportation',
    'Construction Fleet',
    'Corporate Vehicles',
    'Taxi Fleet',
    'Heavy Equipment',
    'Emergency or Service Vehicles',
    'Other'
  )),
  num_vehicles integer not null check (num_vehicles > 0),
  vehicle_type text not null check (vehicle_type in (
    'Cars', 'Trucks', 'Vans', 'Buses', 'Motorcycles',
    'Heavy Equipment', 'Mixed Fleet', 'Other'
  )),
  preferred_area text not null,
  preferred_date date not null,
  message text,
  submission_channel text not null check (submission_channel in ('whatsapp', 'email')),
  status text not null default 'New Request' check (status in (
    'New Request', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'
  )),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table booking_requests enable row level security;

create table contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_inquiries enable row level security;
```

No policies are created on either table — with RLS enabled and zero policies, **no role except the service-role key can read or write anything**, which is the strongest form of "public users can never read/list/edit/delete requests" (structural, not obscurity-based).

- [ ] **Step 2: Provision the project (if it doesn't already exist) and apply the schema**

If no Supabase project exists yet for TrackWay, call `mcp__claude_ai_Supabase__create_project` (org from `mcp__claude_ai_Supabase__list_organizations`, name `trackway-website`, region closest to Lebanon/EU). Otherwise use the existing project ID.

Call `mcp__claude_ai_Supabase__apply_migration` with the exact SQL from Step 1 (`name: "init_booking_and_contact"`).

- [ ] **Step 3: Verify**

Call `mcp__claude_ai_Supabase__list_tables` and confirm both `booking_requests` and `contact_inquiries` appear with `rls_enabled: true` and zero rows.

- [ ] **Step 4: Record connection details**

Call `mcp__claude_ai_Supabase__get_project_url` and `mcp__claude_ai_Supabase__get_publishable_keys` — these give the project URL and the anon/publishable key, but **not** the service-role key (Supabase's MCP tools deliberately don't expose secret keys). The user must copy `SUPABASE_SERVICE_ROLE_KEY` themselves from the Supabase dashboard (Project Settings → API → `service_role` secret) into `.env.local` — flag this explicitly rather than silently blocking. Add `NEXT_PUBLIC_SUPABASE_URL` (from `get_project_url`) to `.env.local` at the same time.

- [ ] **Step 5: Commit the schema file**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema for booking_requests and contact_inquiries"
```

---

### Task 3: Booking form validation

**Files:**
- Create: `lib/booking-validation.ts`
- Create: `lib/booking-validation.test.ts`

**Interfaces:**
- Produces: `BookingFormInput` (canonical shape reused by Tasks 4, 7, 8 — do not redefine it elsewhere), `BookingFormErrors`, `validateBookingForm(input, today)`, `defaultNumVehiclesFor(customerType)`, `CUSTOMER_TYPE_OPTIONS`, `VEHICLE_TYPE_OPTIONS`.

- [ ] **Step 1: Write the failing tests**

Create `lib/booking-validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  validateBookingForm,
  defaultNumVehiclesFor,
  CUSTOMER_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type BookingFormInput,
} from "./booking-validation";

const TODAY = new Date("2026-07-20T00:00:00");

const VALID_INPUT: BookingFormInput = {
  fullName: "Nadia Khoury",
  companyName: "Khoury Logistics",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  customerType: "Truck and Transportation Fleet",
  numVehicles: "5",
  vehicleType: "Trucks",
  preferredArea: "Beirut",
  preferredDate: "2026-07-25",
  message: "",
};

describe("validateBookingForm", () => {
  it("returns no errors for a fully valid submission", () => {
    expect(validateBookingForm(VALID_INPUT, TODAY)).toEqual({});
  });

  it("requires full name, phone, email, customer type, vehicle type, and area", () => {
    const errors = validateBookingForm(
      { ...VALID_INPUT, fullName: "", phone: "", email: "", customerType: "", vehicleType: "", preferredArea: "" },
      TODAY,
    );
    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.customerType).toBeDefined();
    expect(errors.vehicleType).toBeDefined();
    expect(errors.preferredArea).toBeDefined();
  });

  it("rejects a malformed email address", () => {
    const errors = validateBookingForm({ ...VALID_INPUT, email: "not-an-email" }, TODAY);
    expect(errors.email).toBeDefined();
  });

  it("requires a company name for business customer types", () => {
    const errors = validateBookingForm({ ...VALID_INPUT, companyName: "" }, TODAY);
    expect(errors.companyName).toBeDefined();
  });

  it("does not require a company name for Private Vehicle Owner", () => {
    const errors = validateBookingForm(
      { ...VALID_INPUT, customerType: "Private Vehicle Owner", companyName: "" },
      TODAY,
    );
    expect(errors.companyName).toBeUndefined();
  });

  it("rejects a non-positive or non-integer number of vehicles", () => {
    expect(validateBookingForm({ ...VALID_INPUT, numVehicles: "0" }, TODAY).numVehicles).toBeDefined();
    expect(validateBookingForm({ ...VALID_INPUT, numVehicles: "-2" }, TODAY).numVehicles).toBeDefined();
    expect(validateBookingForm({ ...VALID_INPUT, numVehicles: "2.5" }, TODAY).numVehicles).toBeDefined();
    expect(validateBookingForm({ ...VALID_INPUT, numVehicles: "" }, TODAY).numVehicles).toBeDefined();
  });

  it("rejects a preferred date in the past but accepts today", () => {
    expect(
      validateBookingForm({ ...VALID_INPUT, preferredDate: "2026-07-19" }, TODAY).preferredDate,
    ).toBeDefined();
    expect(
      validateBookingForm({ ...VALID_INPUT, preferredDate: "2026-07-20" }, TODAY).preferredDate,
    ).toBeUndefined();
  });
});

describe("defaultNumVehiclesFor", () => {
  it("defaults to 1 for Private Vehicle Owner and empty otherwise", () => {
    expect(defaultNumVehiclesFor("Private Vehicle Owner")).toBe("1");
    expect(defaultNumVehiclesFor("Truck and Transportation Fleet")).toBe("");
    expect(defaultNumVehiclesFor("")).toBe("");
  });
});

describe("option lists", () => {
  it("has exactly the 11 customer types and 8 vehicle types from the customer doc", () => {
    expect(CUSTOMER_TYPE_OPTIONS).toHaveLength(11);
    expect(VEHICLE_TYPE_OPTIONS).toHaveLength(8);
    expect(CUSTOMER_TYPE_OPTIONS).toContain("Private Vehicle Owner");
    expect(VEHICLE_TYPE_OPTIONS).toContain("Mixed Fleet");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/booking-validation.test.ts`
Expected: FAIL — `Failed to resolve import "./booking-validation"`.

- [ ] **Step 3: Write the implementation**

Create `lib/booking-validation.ts`:

```ts
export const CUSTOMER_TYPE_OPTIONS = [
  "Truck and Transportation Fleet",
  "Car-Rental Company",
  "Delivery Company",
  "Private Vehicle Owner",
  "School Transportation",
  "Construction Fleet",
  "Corporate Vehicles",
  "Taxi Fleet",
  "Heavy Equipment",
  "Emergency or Service Vehicles",
  "Other",
] as const;

export const VEHICLE_TYPE_OPTIONS = [
  "Cars",
  "Trucks",
  "Vans",
  "Buses",
  "Motorcycles",
  "Heavy Equipment",
  "Mixed Fleet",
  "Other",
] as const;

export type CustomerType = (typeof CUSTOMER_TYPE_OPTIONS)[number];
export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number];

export interface BookingFormInput {
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  customerType: CustomerType | "";
  numVehicles: string;
  vehicleType: VehicleType | "";
  preferredArea: string;
  preferredDate: string;
  message: string;
}

export interface BookingFormErrors {
  fullName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  customerType?: string;
  numVehicles?: string;
  vehicleType?: string;
  preferredArea?: string;
  preferredDate?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBookingForm(
  input: BookingFormInput,
  today: Date,
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!input.fullName.trim()) errors.fullName = "Full name is required.";
  if (!input.phone.trim()) errors.phone = "Phone number is required.";

  if (!input.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.customerType) {
    errors.customerType = "Customer type is required.";
  } else if (
    input.customerType !== "Private Vehicle Owner" &&
    !input.companyName.trim()
  ) {
    errors.companyName = "Company name is required for this customer type.";
  }

  const numVehicles = Number(input.numVehicles);
  if (
    !input.numVehicles.trim() ||
    !Number.isInteger(numVehicles) ||
    numVehicles <= 0
  ) {
    errors.numVehicles = "Number of vehicles must be a positive whole number.";
  }

  if (!input.vehicleType) errors.vehicleType = "Vehicle type is required.";
  if (!input.preferredArea.trim()) {
    errors.preferredArea = "Preferred installation area is required.";
  }

  if (!input.preferredDate) {
    errors.preferredDate = "Preferred date is required.";
  } else {
    const chosen = new Date(`${input.preferredDate}T00:00:00`);
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    if (chosen < todayMidnight) {
      errors.preferredDate = "Preferred date cannot be in the past.";
    }
  }

  return errors;
}

export function defaultNumVehiclesFor(customerType: CustomerType | ""): string {
  return customerType === "Private Vehicle Owner" ? "1" : "";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/booking-validation.test.ts`
Expected: PASS (all 9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/booking-validation.ts lib/booking-validation.test.ts
git commit -m "feat: add booking form validation"
```

---

### Task 4: Booking WhatsApp/email message builders

**Files:**
- Create: `lib/booking-messages.ts`
- Create: `lib/booking-messages.test.ts`

**Interfaces:**
- Consumes: `BookingFormInput` (Task 3), `buildWhatsAppLink` (existing `lib/contact-links.ts`).
- Produces: `buildBookingWhatsAppMessage`, `buildBookingWhatsAppLink`, `buildBookingEmailBody` — consumed by Tasks 6, 7, 8.

- [ ] **Step 1: Write the failing tests**

Create `lib/booking-messages.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  buildBookingWhatsAppMessage,
  buildBookingWhatsAppLink,
  buildBookingEmailBody,
} from "./booking-messages";
import type { BookingFormInput } from "./booking-validation";

const DETAILS: BookingFormInput = {
  fullName: "Nadia Khoury",
  companyName: "Khoury Logistics",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  customerType: "Truck and Transportation Fleet",
  numVehicles: "5",
  vehicleType: "Trucks",
  preferredArea: "Beirut",
  preferredDate: "2026-07-25",
  message: "Please call before arriving.",
};

describe("buildBookingWhatsAppMessage", () => {
  it("builds the English template with all fields and the TrackWay brand, not GPSNAVIX", () => {
    const message = buildBookingWhatsAppMessage(DETAILS, "en");
    expect(message).toContain("Hello TrackWay");
    expect(message).toContain("Full Name: Nadia Khoury");
    expect(message).toContain("Company Name: Khoury Logistics");
    expect(message).toContain("Number of Vehicles: 5");
    expect(message).toContain("confirmation by TrackWay");
    expect(message).not.toContain("GPSNAVIX");
  });

  it("builds the Arabic template with all fields and the TrackWay brand", () => {
    const message = buildBookingWhatsAppMessage(DETAILS, "ar");
    expect(message).toContain("مرحباً TrackWay");
    expect(message).toContain("الاسم الكامل: Nadia Khoury");
    expect(message).toContain("عدد المركبات: 5");
    expect(message).not.toContain("GPSNAVIX");
  });

  it("renders a dash for an empty optional message rather than the literal empty string", () => {
    const message = buildBookingWhatsAppMessage({ ...DETAILS, message: "" }, "en");
    expect(message).toContain("Additional Message: -");
  });
});

describe("buildBookingWhatsAppLink", () => {
  it("URL-encodes the message into a wa.me link for the given phone number", () => {
    const link = buildBookingWhatsAppLink("+961 70 857 877", DETAILS, "en");
    expect(link).toContain("https://wa.me/96170857877?text=");
    expect(decodeURIComponent(link)).toContain("Nadia Khoury");
  });
});

describe("buildBookingEmailBody", () => {
  it("includes the submission date and all booking fields", () => {
    const body = buildBookingEmailBody(DETAILS, "2026-07-20");
    expect(body).toContain("Submission Date: 2026-07-20");
    expect(body).toContain("Vehicle Type: Trucks");
    expect(body).toContain("Submission Channel: Email");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/booking-messages.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `lib/booking-messages.ts`:

```ts
import { buildWhatsAppLink } from "./contact-links";
import type { BookingFormInput } from "./booking-validation";
import type { Locale } from "@/i18n/routing";

export function buildBookingWhatsAppMessage(
  details: BookingFormInput,
  locale: Locale,
): string {
  const company = details.companyName || "-";
  const message = details.message || "-";

  if (locale === "ar") {
    return `مرحباً TrackWay،

أرغب في تقديم طلب لحجز موعد تركيب.

الاسم الكامل: ${details.fullName}
اسم الشركة: ${company}
رقم الهاتف: ${details.phone}
البريد الإلكتروني: ${details.email}
نوع العميل: ${details.customerType}
عدد المركبات: ${details.numVehicles}
نوع المركبات: ${details.vehicleType}
منطقة التركيب المفضلة: ${details.preferredArea}
التاريخ المفضل: ${details.preferredDate}
رسالة إضافية: ${message}

أفهم أن التاريخ المفضل يخضع لتأكيد TrackWay.`;
  }

  return `Hello TrackWay,

I would like to request an installation appointment.

Full Name: ${details.fullName}
Company Name: ${company}
Phone Number: ${details.phone}
Email: ${details.email}
Customer Type: ${details.customerType}
Number of Vehicles: ${details.numVehicles}
Vehicle Type: ${details.vehicleType}
Preferred Installation Area: ${details.preferredArea}
Preferred Date: ${details.preferredDate}
Additional Message: ${message}

I understand that the preferred date is subject to confirmation by TrackWay.`;
}

export function buildBookingWhatsAppLink(
  phone: string,
  details: BookingFormInput,
  locale: Locale,
): string {
  return buildWhatsAppLink(phone, buildBookingWhatsAppMessage(details, locale));
}

export function buildBookingEmailBody(
  details: BookingFormInput,
  submissionDate: string,
): string {
  return `Submission Date: ${submissionDate}
Full Name: ${details.fullName}
Company Name: ${details.companyName || "-"}
Phone: ${details.phone}
Email: ${details.email}
Customer Type: ${details.customerType}
Number of Vehicles: ${details.numVehicles}
Vehicle Type: ${details.vehicleType}
Preferred Installation Area: ${details.preferredArea}
Preferred Installation Date: ${details.preferredDate}
Additional Message: ${details.message || "-"}
Submission Channel: Email`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/booking-messages.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/booking-messages.ts lib/booking-messages.test.ts
git commit -m "feat: add booking WhatsApp/email message builders"
```

---

### Task 5: Server-only Supabase client factory

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/server.test.ts`

**Interfaces:**
- Produces: `createServerSupabaseClient()`, consumed by Tasks 7 and 11.

- [ ] **Step 1: Write the failing tests**

Create `lib/supabase/server.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createClientMock = vi.fn(() => ({ from: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe("createServerSupabaseClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws an honest error when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createServerSupabaseClient } = await import("./server");
    expect(() => createServerSupabaseClient()).toThrow(
      "Supabase server environment variables are not configured.",
    );
  });

  it("creates a client with the service-role key when env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    const { createServerSupabaseClient } = await import("./server");
    createServerSupabaseClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-service-role-key",
      expect.objectContaining({ auth: expect.objectContaining({ persistSession: false }) }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/supabase/server.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `lib/supabase/server.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/supabase/server.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/server.ts lib/supabase/server.test.ts
git commit -m "feat: add server-only Supabase client factory"
```

---

### Task 6: Resend email wrapper

**Files:**
- Create: `lib/resend.ts`
- Create: `lib/resend.test.ts`

**Interfaces:**
- Produces: `sendBookingNotificationEmail({ customerName, body })`, `sendContactInquiryEmail({ customerName, body })`, both returning `{ success: boolean; error?: string }` — consumed by Tasks 7 and 11.

- [ ] **Step 1: Write the failing tests**

Create `lib/resend.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe("sendBookingNotificationEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns an honest failure when email delivery is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.BOOKING_NOTIFICATION_EMAIL;
    const { sendBookingNotificationEmail } = await import("./resend");
    const result = await sendBookingNotificationEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(result).toEqual({
      success: false,
      error: "Email delivery is not configured.",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends with the correct subject, recipient, and body when configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "bookings@trackway.test";
    process.env.BOOKING_NOTIFICATION_EMAIL = "gpsnavix@gmail.com";
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
    const { sendBookingNotificationEmail } = await import("./resend");
    const result = await sendBookingNotificationEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(sendMock).toHaveBeenCalledWith({
      from: "bookings@trackway.test",
      to: "gpsnavix@gmail.com",
      subject: "New TrackWay Installation Request — Nadia Khoury",
      text: "details",
    });
    expect(result).toEqual({ success: true });
  });

  it("returns an honest failure when Resend itself returns an error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "bookings@trackway.test";
    process.env.BOOKING_NOTIFICATION_EMAIL = "gpsnavix@gmail.com";
    sendMock.mockResolvedValue({ data: null, error: { message: "invalid domain" } });
    const { sendBookingNotificationEmail } = await import("./resend");
    const result = await sendBookingNotificationEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(result).toEqual({ success: false, error: "invalid domain" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/resend.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `lib/resend.ts`:

```ts
import { Resend } from "resend";

interface EmailParams {
  customerName: string;
  body: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

async function sendEmail(params: {
  to: string | undefined;
  from: string | undefined;
  subject: string;
  text: string;
}): Promise<EmailResult> {
  if (!params.from || !params.to) {
    return { success: false, error: "Email delivery is not configured." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send email." };
  }
}

export async function sendBookingNotificationEmail(
  params: EmailParams,
): Promise<EmailResult> {
  return sendEmail({
    to: process.env.BOOKING_NOTIFICATION_EMAIL,
    from: process.env.RESEND_FROM_EMAIL,
    subject: `New TrackWay Installation Request — ${params.customerName}`,
    text: params.body,
  });
}

export async function sendContactInquiryEmail(
  params: EmailParams,
): Promise<EmailResult> {
  return sendEmail({
    to: process.env.BOOKING_NOTIFICATION_EMAIL,
    from: process.env.RESEND_FROM_EMAIL,
    subject: `New TrackWay Contact Inquiry — ${params.customerName}`,
    text: params.body,
  });
}
```

Note: `RESEND_API_KEY` isn't checked before constructing `new Resend(...)` because the Resend SDK accepts `undefined` at construction and only fails on `.send()` — but since `from`/`to` are checked first and both come from env vars that are set together with `RESEND_API_KEY` in practice, this is caught by the same guard in normal operation. The `catch` block covers the case where `RESEND_API_KEY` is missing but `from`/`to` happen to be set, so no exception escapes as an unhandled rejection.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/resend.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/resend.ts lib/resend.test.ts
git commit -m "feat: add Resend email wrapper for booking and contact notifications"
```

---

### Task 7: Booking Server Action

**Files:**
- Create: `app/[locale]/book-installation/actions.ts`
- Create: `app/[locale]/book-installation/actions.test.ts`

**Interfaces:**
- Consumes: `BookingFormInput` (Task 3), `buildBookingEmailBody` (Task 4), `createServerSupabaseClient` (Task 5), `sendBookingNotificationEmail` (Task 6).
- Produces: `submitBookingRequest(input, channel, locale): Promise<{ success: boolean; data?: { id: string }; error?: string }>`, consumed by Task 8.

- [ ] **Step 1: Write the failing tests**

Create `app/[locale]/book-installation/actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

function createFluentMock(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.limit = vi.fn(() => Promise.resolve(result));
  builder.insert = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  return builder;
}

const fromMock = vi.fn();
const sendBookingNotificationEmailMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/resend", () => ({
  sendBookingNotificationEmail: (...args: unknown[]) =>
    sendBookingNotificationEmailMock(...args),
}));

const INPUT = {
  fullName: "Nadia Khoury",
  companyName: "Khoury Logistics",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  customerType: "Truck and Transportation Fleet" as const,
  numVehicles: "5",
  vehicleType: "Trucks" as const,
  preferredArea: "Beirut",
  preferredDate: "2026-07-25",
  message: "",
};

describe("submitBookingRequest", () => {
  beforeEach(() => {
    fromMock.mockReset();
    sendBookingNotificationEmailMock.mockReset();
  });

  it("saves the request and opens WhatsApp without sending an email for the whatsapp channel", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({ data: { id: "booking-1" }, error: null });
    fromMock.mockReturnValueOnce(lookupBuilder).mockReturnValueOnce(insertBuilder);

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "whatsapp", "en");

    expect(result).toEqual({ success: true, data: { id: "booking-1" } });
    expect(sendBookingNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("saves the request and sends an email notification for the email channel", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({ data: { id: "booking-2" }, error: null });
    fromMock.mockReturnValueOnce(lookupBuilder).mockReturnValueOnce(insertBuilder);
    sendBookingNotificationEmailMock.mockResolvedValue({ success: true });

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "email", "en");

    expect(result).toEqual({ success: true, data: { id: "booking-2" } });
    expect(sendBookingNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: "Nadia Khoury" }),
    );
  });

  it("rejects a duplicate submission (same phone + date within the window) without inserting", async () => {
    const lookupBuilder = createFluentMock({ data: [{ id: "existing" }], error: null });
    fromMock.mockReturnValueOnce(lookupBuilder);

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "whatsapp", "en");

    expect(result.success).toBe(false);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("returns an honest error and never a false success when the insert fails", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({ data: null, error: { message: "insert failed" } });
    fromMock.mockReturnValueOnce(lookupBuilder).mockReturnValueOnce(insertBuilder);

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "whatsapp", "en");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("reports success:false (not a silent success) when the save works but the email fails", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({ data: { id: "booking-3" }, error: null });
    fromMock.mockReturnValueOnce(lookupBuilder).mockReturnValueOnce(insertBuilder);
    sendBookingNotificationEmailMock.mockResolvedValue({
      success: false,
      error: "Email delivery is not configured.",
    });

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "email", "en");

    expect(result.success).toBe(false);
    expect(result.error).toContain("saved");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/\[locale\]/book-installation/actions.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `app/[locale]/book-installation/actions.ts`:

```ts
"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendBookingNotificationEmail } from "@/lib/resend";
import { buildBookingEmailBody } from "@/lib/booking-messages";
import type { BookingFormInput } from "@/lib/booking-validation";
import type { Locale } from "@/i18n/routing";

export interface SubmitBookingResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

const DUPLICATE_WINDOW_MINUTES = 5;

export async function submitBookingRequest(
  input: BookingFormInput,
  channel: "whatsapp" | "email",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale: Locale,
): Promise<SubmitBookingResult> {
  const supabase = createServerSupabaseClient();

  const windowStart = new Date(
    Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: recent, error: lookupError } = await supabase
    .from("booking_requests")
    .select("id")
    .eq("phone", input.phone)
    .eq("preferred_date", input.preferredDate)
    .gte("created_at", windowStart)
    .limit(1);

  if (lookupError) {
    return {
      success: false,
      error: "We couldn't process your request. Please try again.",
    };
  }
  if (recent && recent.length > 0) {
    return {
      success: false,
      error: "This request was already submitted. Our team will be in touch.",
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("booking_requests")
    .insert({
      full_name: input.fullName,
      company_name: input.companyName || null,
      phone: input.phone,
      email: input.email,
      customer_type: input.customerType,
      num_vehicles: Number(input.numVehicles),
      vehicle_type: input.vehicleType,
      preferred_area: input.preferredArea,
      preferred_date: input.preferredDate,
      message: input.message || null,
      submission_channel: channel,
      status: "New Request",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      success: false,
      error: "We couldn't save your request. Please try again.",
    };
  }

  const bookingId = (inserted as { id: string }).id;

  if (channel === "email") {
    const emailResult = await sendBookingNotificationEmail({
      customerName: input.fullName,
      body: buildBookingEmailBody(input, new Date().toISOString().slice(0, 10)),
    });
    if (!emailResult.success) {
      return {
        success: false,
        error:
          "Your request was saved, but we couldn't send the email notification. Our team will still see it — you can also reach us on WhatsApp.",
      };
    }
  }

  return { success: true, data: { id: bookingId } };
}
```

`locale` is accepted (and will be used by Task 8's caller to decide which WhatsApp message language to open) but unused inside this action itself — the WhatsApp message is built and opened client-side in `BookingForm` after this action returns success, not server-side, since opening a URL is a browser action.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/\[locale\]/book-installation/actions.test.ts`
Expected: PASS (all 5 tests).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/book-installation/actions.ts app/\[locale\]/book-installation/actions.test.ts
git commit -m "feat: add submitBookingRequest server action"
```

---

### Task 8: BookingForm component

**Files:**
- Create: `components/ui/BookingForm.tsx`
- Create: `components/ui/BookingForm.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` (add the `booking` namespace)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 7.
- Produces: `BookingForm({ whatsappNumber, locale })`, consumed by Task 9.

- [ ] **Step 1: Add the `booking` translation namespace**

In `messages/en.json`, add a new top-level `booking` key (alongside the existing `nav`, `home`, `hardware`, `contact`, `footer`):

```json
  "booking": {
    "pageTitle": "Book an Installation",
    "pageIntro": "Tell us about your company, fleet, and preferred installation date. Our team will confirm your appointment.",
    "confirmationNotice": "Submitting a preferred date does not automatically confirm the appointment.",
    "fullNameLabel": "Full Name",
    "companyNameLabel": "Company Name",
    "phoneLabel": "Phone Number",
    "emailLabel": "Email Address",
    "customerTypeLabel": "Customer Type",
    "numVehiclesLabel": "Number of Vehicles",
    "vehicleTypeLabel": "Vehicle Type",
    "preferredAreaLabel": "Preferred Installation Area",
    "preferredDateLabel": "Preferred Date",
    "messageLabel": "Additional Message",
    "selectPlaceholder": "Select an option",
    "privacyNoticePrefix": "By submitting this form, you agree to our",
    "continueWhatsApp": "Continue on WhatsApp",
    "sendByEmail": "Send Request by Email",
    "whatsappSuccess": "Your request has been saved. We've opened WhatsApp with your details pre-filled — please tap send to reach our team.",
    "emailSuccess": "Your request has been received. Your preferred date is not yet confirmed. TrackWay will contact you through WhatsApp to confirm your appointment.",
    "genericError": "We couldn't process your request. Please try again."
  }
```

In `messages/ar.json`, add:

```json
  "booking": {
    "pageTitle": "احجز موعد تركيب",
    "pageIntro": "أخبرونا عن شركتكم وأسطولكم والتاريخ المفضل للتركيب، وسيقوم فريقنا بتأكيد الموعد.",
    "confirmationNotice": "تقديم التاريخ المفضل لا يعني تأكيد الموعد تلقائيًا.",
    "fullNameLabel": "الاسم الكامل",
    "companyNameLabel": "اسم الشركة",
    "phoneLabel": "رقم الهاتف",
    "emailLabel": "البريد الإلكتروني",
    "customerTypeLabel": "نوع العميل",
    "numVehiclesLabel": "عدد المركبات",
    "vehicleTypeLabel": "نوع المركبات",
    "preferredAreaLabel": "منطقة التركيب المفضلة",
    "preferredDateLabel": "التاريخ المفضل",
    "messageLabel": "رسالة إضافية",
    "selectPlaceholder": "اختر خيارًا",
    "privacyNoticePrefix": "بإرسال هذا النموذج، فإنكم توافقون على",
    "continueWhatsApp": "المتابعة عبر واتساب",
    "sendByEmail": "إرسال الطلب بالبريد الإلكتروني",
    "whatsappSuccess": "تم حفظ طلبكم. لقد فتحنا واتساب مع تفاصيلكم جاهزة — يرجى الضغط على إرسال للتواصل مع فريقنا.",
    "emailSuccess": "تم استلام طلبك. التاريخ المفضل غير مؤكّد بعد. سيتواصل معك فريق TrackWay عبر واتساب لتأكيد الموعد.",
    "genericError": "تعذّر معالجة طلبكم. يرجى المحاولة مرة أخرى."
  }
```

Note: `CUSTOMER_TYPE_OPTIONS`/`VEHICLE_TYPE_OPTIONS` values themselves (e.g. "Truck and Transportation Fleet") are rendered as-is in both locales rather than translated — they're also the canonical values stored in Supabase and inserted verbatim into the WhatsApp/email templates. Inventing Arabic option labels without customer-approved terminology risks exactly the "awkward literal translations" the customer doc warns against. **Flagged as a follow-up**, not silently done.

- [ ] **Step 2: Write the failing tests**

Create `components/ui/BookingForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { BookingForm } from "./BookingForm";

const submitBookingRequestMock = vi.fn();

vi.mock("@/app/[locale]/book-installation/actions", () => ({
  submitBookingRequest: (...args: unknown[]) => submitBookingRequestMock(...args),
}));

const messages = {
  booking: {
    fullNameLabel: "Full Name",
    companyNameLabel: "Company Name",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    customerTypeLabel: "Customer Type",
    numVehiclesLabel: "Number of Vehicles",
    vehicleTypeLabel: "Vehicle Type",
    preferredAreaLabel: "Preferred Installation Area",
    preferredDateLabel: "Preferred Date",
    messageLabel: "Additional Message",
    selectPlaceholder: "Select an option",
    privacyNoticePrefix: "By submitting this form, you agree to our",
    continueWhatsApp: "Continue on WhatsApp",
    sendByEmail: "Send Request by Email",
    whatsappSuccess: "Your request has been saved. We've opened WhatsApp with your details pre-filled — please tap send to reach our team.",
    emailSuccess: "Your request has been received. Your preferred date is not yet confirmed. TrackWay will contact you through WhatsApp to confirm your appointment.",
    genericError: "We couldn't process your request. Please try again.",
  },
  footer: { privacyPolicy: "Privacy Policy" },
};

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BookingForm whatsappNumber="+961 70 857 877" locale="en" />
    </NextIntlClientProvider>,
  );
}

describe("BookingForm", () => {
  beforeEach(() => {
    submitBookingRequestMock.mockReset();
    vi.stubGlobal("open", vi.fn());
  });

  it("shows a validation error and does not call the server action when submitted empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Continue on WhatsApp" }));
    expect(await screen.findByText("Full name is required.")).toBeInTheDocument();
    expect(submitBookingRequestMock).not.toHaveBeenCalled();
  });

  it("defaults Number of Vehicles to 1 when Private Vehicle Owner is selected", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(
      screen.getByLabelText("Customer Type"),
      "Private Vehicle Owner",
    );
    expect(screen.getByLabelText("Number of Vehicles")).toHaveValue(1);
  });

  it("opens WhatsApp only after a successful save", async () => {
    submitBookingRequestMock.mockResolvedValue({ success: true, data: { id: "1" } });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Full Name"), "Nadia Khoury");
    await user.type(screen.getByLabelText("Phone Number"), "+961 3 123 456");
    await user.type(screen.getByLabelText("Email Address"), "nadia@khourylogistics.com");
    await user.selectOptions(screen.getByLabelText("Customer Type"), "Private Vehicle Owner");
    await user.selectOptions(screen.getByLabelText("Vehicle Type"), "Cars");
    await user.type(screen.getByLabelText("Preferred Installation Area"), "Beirut");
    await user.type(screen.getByLabelText("Preferred Date"), "2099-01-01");
    await user.click(screen.getByRole("button", { name: "Continue on WhatsApp" }));

    await waitFor(() => expect(window.open).toHaveBeenCalled());
    expect(
      await screen.findByText(
        "Your request has been saved. We've opened WhatsApp with your details pre-filled — please tap send to reach our team.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the server's honest error and does not open WhatsApp when the save fails", async () => {
    submitBookingRequestMock.mockResolvedValue({
      success: false,
      error: "We couldn't save your request. Please try again.",
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Full Name"), "Nadia Khoury");
    await user.type(screen.getByLabelText("Phone Number"), "+961 3 123 456");
    await user.type(screen.getByLabelText("Email Address"), "nadia@khourylogistics.com");
    await user.selectOptions(screen.getByLabelText("Customer Type"), "Private Vehicle Owner");
    await user.selectOptions(screen.getByLabelText("Vehicle Type"), "Cars");
    await user.type(screen.getByLabelText("Preferred Installation Area"), "Beirut");
    await user.type(screen.getByLabelText("Preferred Date"), "2099-01-01");
    await user.click(screen.getByRole("button", { name: "Continue on WhatsApp" }));

    expect(
      await screen.findByText("We couldn't save your request. Please try again."),
    ).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run components/ui/BookingForm.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the implementation**

Create `components/ui/BookingForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  validateBookingForm,
  defaultNumVehiclesFor,
  CUSTOMER_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type BookingFormInput,
  type BookingFormErrors,
  type CustomerType,
  type VehicleType,
} from "@/lib/booking-validation";
import { buildBookingWhatsAppLink } from "@/lib/booking-messages";
import { submitBookingRequest } from "@/app/[locale]/book-installation/actions";

interface BookingFormProps {
  whatsappNumber: string;
  locale: Locale;
}

const EMPTY_FORM: BookingFormInput = {
  fullName: "",
  companyName: "",
  phone: "",
  email: "",
  customerType: "",
  numVehicles: "",
  vehicleType: "",
  preferredArea: "",
  preferredDate: "",
  message: "",
};

type Status = "idle" | "submitting" | "success" | "error";

export function BookingForm({
  whatsappNumber,
  locale,
}: BookingFormProps): React.ReactElement {
  const t = useTranslations("booking");
  const tFooter = useTranslations("footer");
  const [form, setForm] = useState<BookingFormInput>(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  function updateField<K extends keyof BookingFormInput>(
    field: K,
    value: BookingFormInput[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "customerType") {
        next.numVehicles = defaultNumVehiclesFor(
          value as CustomerType | "",
        );
      }
      return next;
    });
  }

  async function handleSubmit(channel: "whatsapp" | "email") {
    if (honeypot) return;

    const validationErrors = validateBookingForm(form, new Date());
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setStatusMessage("");

    const result = await submitBookingRequest(form, channel, locale);

    if (!result.success) {
      setStatus("error");
      setStatusMessage(result.error ?? t("genericError"));
      return;
    }

    if (channel === "whatsapp") {
      const link = buildBookingWhatsAppLink(whatsappNumber, form, locale);
      window.open(link, "_blank", "noopener,noreferrer");
    }

    setStatus("success");
    setStatusMessage(channel === "email" ? t("emailSuccess") : t("whatsappSuccess"));
    setForm(EMPTY_FORM);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()} noValidate>
      <input
        type="text"
        name="companyWebsite"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className="flex flex-col gap-1">
        {t("fullNameLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          aria-invalid={Boolean(errors.fullName)}
        />
        {errors.fullName && <span className="text-sm text-red-400">{errors.fullName}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("companyNameLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.companyName}
          onChange={(e) => updateField("companyName", e.target.value)}
          aria-invalid={Boolean(errors.companyName)}
        />
        {errors.companyName && <span className="text-sm text-red-400">{errors.companyName}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("phoneLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <span className="text-sm text-red-400">{errors.phone}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("emailLabel")}
        <input
          type="email"
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="text-sm text-red-400">{errors.email}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("customerTypeLabel")}
        <select
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.customerType}
          onChange={(e) => updateField("customerType", e.target.value as CustomerType | "")}
          aria-invalid={Boolean(errors.customerType)}
        >
          <option value="">{t("selectPlaceholder")}</option>
          {CUSTOMER_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.customerType && <span className="text-sm text-red-400">{errors.customerType}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("numVehiclesLabel")}
        <input
          type="number"
          min={1}
          step={1}
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.numVehicles}
          onChange={(e) => updateField("numVehicles", e.target.value)}
          aria-invalid={Boolean(errors.numVehicles)}
        />
        {errors.numVehicles && <span className="text-sm text-red-400">{errors.numVehicles}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("vehicleTypeLabel")}
        <select
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.vehicleType}
          onChange={(e) => updateField("vehicleType", e.target.value as VehicleType | "")}
          aria-invalid={Boolean(errors.vehicleType)}
        >
          <option value="">{t("selectPlaceholder")}</option>
          {VEHICLE_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.vehicleType && <span className="text-sm text-red-400">{errors.vehicleType}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("preferredAreaLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.preferredArea}
          onChange={(e) => updateField("preferredArea", e.target.value)}
          aria-invalid={Boolean(errors.preferredArea)}
        />
        {errors.preferredArea && <span className="text-sm text-red-400">{errors.preferredArea}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("preferredDateLabel")}
        <input
          type="date"
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.preferredDate}
          onChange={(e) => updateField("preferredDate", e.target.value)}
          aria-invalid={Boolean(errors.preferredDate)}
        />
        {errors.preferredDate && <span className="text-sm text-red-400">{errors.preferredDate}</span>}
      </label>

      <label className="flex flex-col gap-1">
        {t("messageLabel")}
        <textarea
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
        />
      </label>

      <p className="text-sm text-muted">
        {t("privacyNoticePrefix")}{" "}
        <Link href={`/${locale}/privacy`} className="underline">
          {tFooter("privacyPolicy")}
        </Link>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={() => handleSubmit("whatsapp")}
          className="rounded-full bg-accent px-6 py-3 font-bold text-background disabled:opacity-50"
        >
          {t("continueWhatsApp")}
        </button>
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={() => handleSubmit("email")}
          className="rounded-full border border-accent px-6 py-3 font-bold text-accent disabled:opacity-50"
        >
          {t("sendByEmail")}
        </button>
      </div>

      {status === "success" && (
        <p role="status" className="text-accent">
          {statusMessage}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-red-400">
          {statusMessage}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/ui/BookingForm.test.tsx`
Expected: PASS (4 tests).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/ui/BookingForm.tsx components/ui/BookingForm.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add BookingForm component"
```

---

### Task 9: `/book-installation` page

**Files:**
- Create: `app/[locale]/book-installation/page.tsx`
- Create: `app/[locale]/book-installation/page.test.tsx`

**Interfaces:**
- Consumes: `BookingForm` (Task 8), `getSiteSettings` (existing `@/sanity/queries`).

- [ ] **Step 1: Write the failing test**

Create `app/[locale]/book-installation/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BookInstallationPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      pageTitle: "Book an Installation",
      pageIntro: "Tell us about your company, fleet, and preferred installation date.",
      confirmationNotice: "Submitting a preferred date does not automatically confirm the appointment.",
    };
    return translations[key] ?? key;
  }),
}));

vi.mock("@/sanity/queries", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    whatsappNumber: "+961 70 857 877",
  }),
}));

vi.mock("@/components/ui/BookingForm", () => ({
  BookingForm: ({ whatsappNumber }: { whatsappNumber: string }) => (
    <div data-testid="booking-form">{whatsappNumber}</div>
  ),
}));

describe("BookInstallationPage", () => {
  it("renders the page title, intro, confirmation notice, and the booking form with the right phone number", async () => {
    const jsx = await BookInstallationPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(jsx);
    expect(screen.getByRole("heading", { name: "Book an Installation" })).toBeInTheDocument();
    expect(
      screen.getByText("Submitting a preferred date does not automatically confirm the appointment."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("booking-form")).toHaveTextContent("+961 70 857 877");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/\[locale\]/book-installation/page.test.tsx`
Expected: FAIL — `app/[locale]/book-installation/page.tsx` doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `app/[locale]/book-installation/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/sanity/queries";
import type { Locale } from "@/i18n/routing";
import { BookingForm } from "@/components/ui/BookingForm";

export default async function BookInstallationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const [siteSettings, t] = await Promise.all([
    getSiteSettings(),
    getTranslations("booking"),
  ]);

  return (
    <section className="px-6 py-24">
      <h1 className="text-3xl font-bold text-foreground">{t("pageTitle")}</h1>
      <p className="mt-2 max-w-xl text-muted">{t("pageIntro")}</p>
      <p className="mt-2 max-w-xl text-sm text-muted">{t("confirmationNotice")}</p>
      <div className="mt-8 max-w-xl">
        <BookingForm whatsappNumber={siteSettings.whatsappNumber} locale={typedLocale} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/\[locale\]/book-installation/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/book-installation/page.tsx app/\[locale\]/book-installation/page.test.tsx
git commit -m "feat: add /book-installation page"
```

---

### Task 10: "Book an Installation" CTA in the Header

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/Header.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` (add `nav.bookInstallation`)

This task assumes Plan 1 has already landed — the file below is the full result of Plan 1's "EN | العربية" selector *plus* this task's CTA, shown in full to avoid ambiguity.

**Full mobile hamburger menu redesign is out of scope here** — Plan 3 owns the broader mobile-nav/animation overhaul. This task only adds the CTA link to the existing nav row.

- [ ] **Step 1: Add the translation key**

In `messages/en.json`, add to the existing `nav` object: `"bookInstallation": "Book an Installation"`.
In `messages/ar.json`, add to the existing `nav` object: `"bookInstallation": "احجز موعد تركيب"`.

- [ ] **Step 2: Write the failing test**

Add to `components/layout/Header.test.tsx`, inside `describe("Header", ...)`, updating the shared `messages` object first to include the new key:

```tsx
const messages = {
  nav: {
    home: "Home",
    hardware: "Hardware",
    about: "About",
    contact: "Contact",
    contactCta: "Contact Us",
    bookInstallation: "Book an Installation",
  },
};
```

Then add a new test:

```tsx
  it("renders a prominent Book an Installation CTA linking to /book-installation", () => {
    renderHeader("en", "/");
    expect(
      screen.getByRole("link", { name: "Book an Installation" }),
    ).toHaveAttribute("href", "/en/book-installation");
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: FAIL — no such link exists yet.

- [ ] **Step 4: Write the implementation**

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
        <Link href={`/${locale}/contact`}>{t("contactCta")}</Link>
        <Link
          href={`/${locale}/book-installation`}
          className="rounded-full bg-accent px-4 py-2 font-bold text-background"
        >
          {t("bookInstallation")}
        </Link>
      </nav>
    </header>
  );
}
```

The accent-filled pill styling (`rounded-full bg-accent ...`) moves from the Contact CTA to the Book an Installation CTA, since the customer doc specifically wants the booking CTA to be the visually prominent one — the Contact link becomes a plain nav link.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: PASS (all 5 tests — Plan 1's 4 plus this task's new one).

- [ ] **Step 6: Commit**

```bash
git add components/layout/Header.tsx components/layout/Header.test.tsx messages/en.json messages/ar.json
git commit -m "feat: add prominent Book an Installation CTA to Header"
```

---

### Task 11: Contact Server Action

**Files:**
- Create: `app/[locale]/contact/actions.ts`
- Create: `app/[locale]/contact/actions.test.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient` (Task 5), `sendContactInquiryEmail` (Task 6).
- Produces: `submitContactInquiry(input): Promise<{ success: boolean; error?: string }>`, consumed by Task 12.

- [ ] **Step 1: Write the failing tests**

Create `app/[locale]/contact/actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
const sendContactInquiryEmailMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/resend", () => ({
  sendContactInquiryEmail: (...args: unknown[]) => sendContactInquiryEmailMock(...args),
}));

const INPUT = {
  fullName: "Nadia Khoury",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  message: "I'd like a quote for 5 trucks.",
};

describe("submitContactInquiry", () => {
  beforeEach(() => {
    insertMock.mockReset();
    sendContactInquiryEmailMock.mockReset();
  });

  it("saves the inquiry and sends a notification email on success", async () => {
    insertMock.mockResolvedValue({ error: null });
    sendContactInquiryEmailMock.mockResolvedValue({ success: true });

    const { submitContactInquiry } = await import("./actions");
    const result = await submitContactInquiry(INPUT);

    expect(fromMock).toHaveBeenCalledWith("contact_inquiries");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: "Nadia Khoury", message: INPUT.message }),
    );
    expect(sendContactInquiryEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: "Nadia Khoury" }),
    );
    expect(result).toEqual({ success: true });
  });

  it("returns an honest error when the insert fails, without sending an email", async () => {
    insertMock.mockResolvedValue({ error: { message: "insert failed" } });

    const { submitContactInquiry } = await import("./actions");
    const result = await submitContactInquiry(INPUT);

    expect(result.success).toBe(false);
    expect(sendContactInquiryEmailMock).not.toHaveBeenCalled();
  });

  it("reports success:false when the save works but the email fails", async () => {
    insertMock.mockResolvedValue({ error: null });
    sendContactInquiryEmailMock.mockResolvedValue({
      success: false,
      error: "Email delivery is not configured.",
    });

    const { submitContactInquiry } = await import("./actions");
    const result = await submitContactInquiry(INPUT);

    expect(result.success).toBe(false);
    expect(result.error).toContain("saved");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/\[locale\]/contact/actions.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `app/[locale]/contact/actions.ts`:

```ts
"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendContactInquiryEmail } from "@/lib/resend";

export interface ContactSubmission {
  fullName: string;
  phone: string;
  email: string;
  message: string;
}

export interface SubmitContactResult {
  success: boolean;
  error?: string;
}

export async function submitContactInquiry(
  input: ContactSubmission,
): Promise<SubmitContactResult> {
  const supabase = createServerSupabaseClient();

  const { error: insertError } = await supabase.from("contact_inquiries").insert({
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    message: input.message,
  });

  if (insertError) {
    return {
      success: false,
      error: "We couldn't save your message. Please try again.",
    };
  }

  const emailResult = await sendContactInquiryEmail({
    customerName: input.fullName,
    body: `Full Name: ${input.fullName}\nPhone: ${input.phone}\nEmail: ${input.email}\nMessage: ${input.message}`,
  });

  if (!emailResult.success) {
    return {
      success: false,
      error:
        "Your message was saved, but we couldn't send the email notification. Our team will still see it.",
    };
  }

  return { success: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/\[locale\]/contact/actions.test.ts`
Expected: PASS (all 3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/contact/actions.ts app/\[locale\]/contact/actions.test.ts
git commit -m "feat: add submitContactInquiry server action"
```

---

### Task 12: Rewire ContactForm to the backend

**Files:**
- Modify: `components/ui/ContactForm.tsx` (full rewrite)
- Modify: `components/ui/ContactForm.test.tsx` (full rewrite)
- Modify: `app/[locale]/contact/page.tsx`
- Modify: `app/[locale]/contact/page.test.tsx`
- Modify: `messages/en.json`, `messages/ar.json` (replace the `contact` namespace)

**Interfaces:**
- Consumes: `submitContactInquiry` (Task 11).
- Produces: `ContactForm()` — note the prop signature changes from `{ whatsappNumber, email }` to no props (it no longer builds `wa.me`/`mailto:` links itself).

- [ ] **Step 1: Replace the `contact` translation namespace**

In `messages/en.json`, replace the existing `contact` object:

```json
  "contact": {
    "nameLabel": "Full Name",
    "phoneLabel": "Phone Number",
    "emailLabel": "Email Address",
    "messageLabel": "Message",
    "submitCta": "Send Message",
    "successMessage": "Your message has been received. Our team will get back to you soon.",
    "genericError": "Something went wrong. Please try again."
  }
```

In `messages/ar.json`, replace the existing `contact` object:

```json
  "contact": {
    "nameLabel": "الاسم الكامل",
    "phoneLabel": "رقم الهاتف",
    "emailLabel": "البريد الإلكتروني",
    "messageLabel": "الرسالة",
    "submitCta": "إرسال الرسالة",
    "successMessage": "تم استلام رسالتك. سيتواصل معك فريقنا قريبًا.",
    "genericError": "حدث خطأ ما. يرجى المحاولة مرة أخرى."
  }
```

- [ ] **Step 2: Write the failing ContactForm tests**

Replace `components/ui/ContactForm.test.tsx` entirely:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ContactForm } from "./ContactForm";

const submitContactInquiryMock = vi.fn();

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitContactInquiry: (...args: unknown[]) => submitContactInquiryMock(...args),
}));

const messages = {
  contact: {
    nameLabel: "Full Name",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    messageLabel: "Message",
    submitCta: "Send Message",
    successMessage: "Your message has been received. Our team will get back to you soon.",
    genericError: "Something went wrong. Please try again.",
  },
};

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContactForm />
    </NextIntlClientProvider>,
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    submitContactInquiryMock.mockReset();
  });

  it("shows validation errors and does not submit when required fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Send Message" }));
    expect(await screen.findByText("Full name is required.")).toBeInTheDocument();
    expect(submitContactInquiryMock).not.toHaveBeenCalled();
  });

  it("submits all four fields and shows the honest success message", async () => {
    submitContactInquiryMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Full Name"), "Nadia Khoury");
    await user.type(screen.getByLabelText("Phone Number"), "+961 3 123 456");
    await user.type(screen.getByLabelText("Email Address"), "nadia@khourylogistics.com");
    await user.type(screen.getByLabelText("Message"), "I'd like a quote for 5 trucks.");
    await user.click(screen.getByRole("button", { name: "Send Message" }));

    expect(submitContactInquiryMock).toHaveBeenCalledWith({
      fullName: "Nadia Khoury",
      phone: "+961 3 123 456",
      email: "nadia@khourylogistics.com",
      message: "I'd like a quote for 5 trucks.",
    });
    expect(
      await screen.findByText("Your message has been received. Our team will get back to you soon."),
    ).toBeInTheDocument();
  });

  it("shows the server's honest error message on failure", async () => {
    submitContactInquiryMock.mockResolvedValue({ success: false, error: "Save failed." });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Full Name"), "Nadia Khoury");
    await user.type(screen.getByLabelText("Phone Number"), "+961 3 123 456");
    await user.type(screen.getByLabelText("Email Address"), "nadia@khourylogistics.com");
    await user.type(screen.getByLabelText("Message"), "Quote please.");
    await user.click(screen.getByRole("button", { name: "Send Message" }));

    expect(await screen.findByText("Save failed.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run components/ui/ContactForm.test.tsx`
Expected: FAIL — current `ContactForm` requires `whatsappNumber`/`email` props and has no submit button named "Send Message".

- [ ] **Step 4: Write the ContactForm implementation**

Replace `components/ui/ContactForm.tsx` entirely:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { submitContactInquiry } from "@/app/[locale]/contact/actions";

interface ContactFormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(input: {
  fullName: string;
  phone: string;
  email: string;
  message: string;
}): ContactFormErrors {
  const errors: ContactFormErrors = {};
  if (!input.fullName.trim()) errors.fullName = "Full name is required.";
  if (!input.phone.trim()) errors.phone = "Phone number is required.";
  if (!input.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!input.message.trim()) errors.message = "Message is required.";
  return errors;
}

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm(): React.ReactElement {
  const t = useTranslations("contact");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validateContactForm({ fullName, phone, email, message });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    const result = await submitContactInquiry({ fullName, phone, email, message });

    if (!result.success) {
      setStatus("error");
      setStatusMessage(result.error ?? t("genericError"));
      return;
    }

    setStatus("success");
    setStatusMessage(t("successMessage"));
    setFullName("");
    setPhone("");
    setEmail("");
    setMessage("");
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <label className="flex flex-col gap-1">
        {t("nameLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={Boolean(errors.fullName)}
        />
        {errors.fullName && <span className="text-sm text-red-400">{errors.fullName}</span>}
      </label>
      <label className="flex flex-col gap-1">
        {t("phoneLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <span className="text-sm text-red-400">{errors.phone}</span>}
      </label>
      <label className="flex flex-col gap-1">
        {t("emailLabel")}
        <input
          type="email"
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="text-sm text-red-400">{errors.email}</span>}
      </label>
      <label className="flex flex-col gap-1">
        {t("messageLabel")}
        <textarea
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <span className="text-sm text-red-400">{errors.message}</span>}
      </label>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full bg-accent px-6 py-3 font-bold text-background disabled:opacity-50"
      >
        {t("submitCta")}
      </button>
      {status === "success" && (
        <p role="status" className="text-accent">
          {statusMessage}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-red-400">
          {statusMessage}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 5: Update the Contact page and its test**

In `app/[locale]/contact/page.tsx`, change the `ContactForm` usage from `<ContactForm whatsappNumber={siteSettings.whatsappNumber} email={siteSettings.email} />` to `<ContactForm />`.

Replace `app/[locale]/contact/page.test.tsx` entirely:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ContactPage from "./page";

vi.mock("@/sanity/queries", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    phoneNumbers: ["+961 3 123 456"],
    whatsappNumber: "+961 3 123 456",
    email: "info@trackway.com",
    socialLinks: [{ platform: "instagram", url: "https://instagram.com/trackway" }],
    address: { en: "Beirut, Lebanon", ar: "بيروت، لبنان" },
  }),
}));

const messages = {
  contact: {
    nameLabel: "Full Name",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    messageLabel: "Message",
    submitCta: "Send Message",
    successMessage: "Your message has been received. Our team will get back to you soon.",
    genericError: "Something went wrong. Please try again.",
  },
};

describe("ContactPage", () => {
  it("renders the phone number, email, and the contact form with all four fields", async () => {
    const jsx = await ContactPage({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        {jsx}
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("link", { name: "+961 3 123 456" }),
    ).toHaveAttribute("href", "tel:+961 3 123 456");
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run components/ui/ContactForm.test.tsx app/\[locale\]/contact/page.test.tsx`
Expected: PASS (all tests in both files).

Run: `npm run test && npm run typecheck`
Expected: full suite and typecheck both pass.

- [ ] **Step 7: Commit**

```bash
git add components/ui/ContactForm.tsx components/ui/ContactForm.test.tsx app/\[locale\]/contact/page.tsx app/\[locale\]/contact/page.test.tsx messages/en.json messages/ar.json
git commit -m "feat: rewire ContactForm to submit via server action with Phone/Email fields"
```

---

### Task 13: E2E validation coverage and smoke test routes

**Files:**
- Create: `e2e/booking-form-validation.spec.ts`
- Modify: `e2e/pages-smoke.spec.ts`

This covers client-side validation behavior end-to-end in a real browser. It deliberately does **not** exercise a real Supabase write (no test ever passes valid data all the way to submission) — a true happy-path e2e against a live database is **not implemented in this plan** and should not be claimed as covered; it's a reasonable follow-up once a disposable staging Supabase project exists, so test runs don't write permanent rows into the production table.

- [ ] **Step 1: Add booking form validation e2e tests**

Create `e2e/booking-form-validation.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("booking form shows a validation error when submitted empty", async ({ page }) => {
  await page.goto("/en/book-installation");
  await page.getByRole("button", { name: "Continue on WhatsApp" }).click();
  await expect(page.getByText("Full name is required.")).toBeVisible();
});

test("company name is required for business types but not for Private Vehicle Owner", async ({ page }) => {
  await page.goto("/en/book-installation");
  await page.getByLabel("Customer Type").selectOption("Truck and Transportation Fleet");
  await page.getByRole("button", { name: "Continue on WhatsApp" }).click();
  await expect(
    page.getByText("Company name is required for this customer type."),
  ).toBeVisible();

  await page.getByLabel("Customer Type").selectOption("Private Vehicle Owner");
  await page.getByRole("button", { name: "Continue on WhatsApp" }).click();
  await expect(
    page.getByText("Company name is required for this customer type."),
  ).not.toBeVisible();
});

test("a past preferred date is rejected", async ({ page }) => {
  await page.goto("/en/book-installation");
  await page.getByLabel("Preferred Date").fill("2020-01-01");
  await page.getByRole("button", { name: "Continue on WhatsApp" }).click();
  await expect(page.getByText("Preferred date cannot be in the past.")).toBeVisible();
});
```

- [ ] **Step 2: Add the new routes to the smoke test**

In `e2e/pages-smoke.spec.ts`, update the `routes` array:

```ts
const routes = ["", "/hardware", "/about", "/contact", "/book-installation", "/privacy"];
```

- [ ] **Step 3: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all pass, including the 3 new booking-validation tests and the smoke test now covering 2 more routes per locale.

(Requires `NEXT_PUBLIC_SUPABASE_URL` etc. to be present in the build environment purely so `next build` succeeds — `createServerSupabaseClient`/Resend's client are constructed lazily inside function bodies, not at module load, so the app builds and these validation-only tests pass even with placeholder env values, since they never reach the Supabase/Resend call.)

- [ ] **Step 4: Commit**

```bash
git add e2e/booking-form-validation.spec.ts e2e/pages-smoke.spec.ts
git commit -m "test: add booking form validation e2e coverage"
```

---

### Task 14: Document new environment variables

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update the file**

Replace `.env.example` entirely:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
SANITY_REVALIDATE_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
BOOKING_NOTIFICATION_EMAIL=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: document Supabase and Resend environment variables"
```

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-07-20-trackway-customer-alignment-phase1-design.md` §4, §5, §7's CTA, §8, §10):
- §4 Architecture (Supabase + Resend, server-only keys, new env vars) → Tasks 1, 2, 5, 6, 14. ✅
- §5 Data model (`booking_requests`, `contact_inquiries`, RLS) → Task 2. ✅
- §7 "Book an Installation CTA in Header" → Task 10. ✅
- §8 `/book-installation` — all fields/validation/exclusions, both submission paths, save-before-notify ordering, spam/duplicate prevention → Tasks 3, 4, 7, 8, 9. ✅
- §10 Contact page backend wiring → Tasks 11, 12. ✅
- §11 Testing (Vitest unit coverage for validation, message encoding, save-then-send ordering; Playwright e2e) → covered throughout; e2e scope is explicitly narrowed and the narrowing is stated, not hidden.

**Placeholder scan:** no `TBD`/"add appropriate" phrasing; every step has runnable code.

**Type consistency:** `BookingFormInput` is defined once (Task 3) and imported everywhere else that needs it (Tasks 4, 7, 8) rather than redefined. `SubmitBookingResult`/`SubmitContactResult` both follow the `{ success, data?, error? }` shape required by the Global Constraints. `CustomerType`/`VehicleType` are derived from the same `as const` arrays the option lists use, so the UI `<select>` options and the validation/type layer can never drift apart.

**Known gaps carried forward (not silently dropped):**
- Customer/vehicle type dropdown labels are English-only in both locales pending customer-approved Arabic terminology (Task 8).
- True happy-path e2e against a live Supabase project is not implemented (Task 13) — flagged, not claimed as done.
- Full mobile hamburger menu is Plan 3's responsibility, not built here (Task 10).

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-20-trackway-booking-contact-backend.md`.** Per your earlier instruction, Plans 3 and 4 are written next before any execution begins.
