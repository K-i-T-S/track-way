# TrackWay Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (EN/AR) Next.js marketing website for TrackWay (GPS hardware/software for fleets and individuals in Lebanon), backed by Sanity CMS, with no lead database — contact resolves directly to WhatsApp/email/phone.

**Architecture:** Next.js App Router with `next-intl` locale-prefixed routing (`/en`, `/ar`), Sanity as headless CMS with field-level `{en, ar}` localization on content documents, static generation with on-demand ISR revalidation triggered by a Sanity webhook, deployed on Vercel. No database, no auth, no payments.

**Tech Stack:** Next.js 14+ (App Router), TypeScript (strict), Tailwind CSS, next-intl, Sanity (`@sanity/client`, embedded Studio), Vitest + React Testing Library (unit/component tests), Playwright (e2e), clsx + tailwind-merge.

## Global Constraints

- TypeScript strict mode — no `any`, no implicit returns (from user's standing code standards)
- Mobile-first: verify every page at 375px viewport before 1440px
- Every component that has directional layout logic (fixed positioning, scroll/animation direction) must be explicitly tested at `dir="rtl"` — do not rely on `dir="rtl"` alone to "just work"
- Lighthouse LCP < 2.5s, CLS < 0.1 — check before any page is considered done (manual check in Task 14, not automated in this plan)
- No public pricing anywhere on the site — hardware/service CTAs are "Request a Quote", never a price
- No lead database, no CRM integration — contact forms resolve to `mailto:`/`wa.me:` links only
- Single unified site — no separate B2B/B2C pages, toggles, or query-param audience routing
- Single hardware showcase page — no individual per-device product pages
- Field-level i18n in Sanity: translatable fields are `{en: string, ar: string}` objects on one document, not parallel document trees

---

## File Structure

```
package.json
tsconfig.json
next.config.ts
tailwind.config.ts
postcss.config.js
vitest.config.ts
vitest.setup.ts
playwright.config.ts
middleware.ts
i18n/
  routing.ts
  request.ts
messages/
  en.json
  ar.json
lib/
  utils.ts                  # cn() classname helper
  contact-links.ts          # buildWhatsAppLink / buildMailtoLink
  i18n-utils.ts              # getLocalized()
sanity/
  env.ts
  client.ts
  schemaTypes/
    index.ts
    siteSettings.ts
    homePage.ts
    feature.ts
    hardwareProduct.ts
    aboutPage.ts
  types.ts
  queries.ts
sanity.config.ts
app/
  [locale]/
    layout.tsx
    page.tsx
    hardware/page.tsx
    about/page.tsx
    contact/page.tsx
  studio/[[...tool]]/page.tsx
  api/revalidate/route.ts
  globals.css
components/
  layout/Header.tsx
  layout/Footer.tsx
  ui/DotGridBackground.tsx
  ui/MarqueeTicker.tsx
  ui/FeatureCard.tsx
  ui/HardwareCard.tsx
  ui/WhatsAppButton.tsx
  ui/ContactForm.tsx
e2e/
  locale-routing.spec.ts
  rtl-layout.spec.ts
  pages-smoke.spec.ts
```

Test files are colocated with the code they test (e.g. `lib/utils.test.ts` next to `lib/utils.ts`, `components/ui/MarqueeTicker.test.tsx` next to `MarqueeTicker.tsx`), following standard Next.js convention. `e2e/` holds Playwright specs that need a running server (locale redirects, RTL DOM attributes, cross-page smoke).

---

### Task 1: Project Scaffolding, Design Tokens & Test Harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`, `app/layout.tsx` (temporary root — replaced in Task 8), `app/page.tsx` (temporary placeholder — replaced by locale routing in Task 2), `.gitignore`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`
- Create: `lib/utils.ts`
- Test: `lib/utils.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/utils.ts`, used by every component task from here on.
- Produces: Tailwind theme tokens `colors.background` (`#0A0A0A`), `colors.accent` (`#00E5D4`), `colors.muted` (`#A0A0A0`) — referenced by class names in every UI component task.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "trackway-website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next-intl": "^3.19.0",
    "@sanity/client": "^6.21.0",
    "@sanity/image-url": "^1.0.2",
    "next-sanity": "^9.4.0",
    "sanity": "^3.57.0",
    "@sanity/vision": "^3.57.0",
    "styled-components": "^6.1.13",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.9",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.0.0",
    "vitest": "^2.0.5",
    "@vitejs/plugin-react": "^4.3.1",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.8",
    "jsdom": "^24.1.1",
    "@playwright/test": "^1.46.0"
  }
}
```

Run: `npm install`
Expected: install completes with no errors (Sanity Studio pulls in `styled-components` as a peer — included explicitly above so it isn't left implicit).

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
}

export default withNextIntl(nextConfig)
```

(`./i18n/request.ts` doesn't exist yet — it's created in Task 2. `next dev`/`build` will fail until then, which is expected; Step 8 below only verifies the Tailwind/test harness pieces, not a full build.)

- [ ] **Step 4: Create `tailwind.config.ts` with design tokens**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        accent: '#00E5D4',
        muted: '#A0A0A0',
        foreground: '#FFFFFF',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Create `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-background text-foreground;
}
```

- [ ] **Step 7: Create `.gitignore`**

```
node_modules
.next
out
.env*.local
.vercel
playwright-report
test-results
```

- [ ] **Step 8: Write the failing test for `cn()`**

Create `lib/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class name strings', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('resolves conflicting tailwind classes, keeping the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('drops falsy values', () => {
    expect(cn('px-2', false && 'hidden', undefined, 'py-4')).toBe('px-2 py-4')
  })
})
```

- [ ] **Step 9: Create `vitest.config.ts` and `vitest.setup.ts` so the test can run**

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npx vitest run lib/utils.test.ts`
Expected: FAIL — `Cannot find module './utils'` (file doesn't exist yet)

- [ ] **Step 11: Implement `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `npx vitest run lib/utils.test.ts`
Expected: PASS — 3 passed

- [ ] **Step 13: Create `playwright.config.ts` (used starting Task 2)**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

- [ ] **Step 14: Create placeholder `app/layout.tsx` and `app/page.tsx` so `next.config.ts` has something to serve (temporary, replaced in Task 2/8)**

Create `app/layout.tsx`:

```tsx
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

Create `app/page.tsx`:

```tsx
export default function Placeholder() {
  return <div>Scaffolding in progress</div>
}
```

- [ ] **Step 15: Commit**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.js vitest.config.ts vitest.setup.ts playwright.config.ts lib/utils.ts lib/utils.test.ts app/globals.css app/layout.tsx app/page.tsx .gitignore
git commit -m "chore: scaffold Next.js project with Tailwind design tokens and test harness"
```

---

### Task 2: next-intl Routing, Middleware & Messages

**Files:**
- Create: `i18n/routing.ts`, `i18n/request.ts`, `middleware.ts`, `messages/en.json`, `messages/ar.json`
- Modify: delete `app/layout.tsx` and `app/page.tsx` from Task 1 (moving under `app/[locale]/`)
- Create: `app/[locale]/layout.tsx` (minimal — full version with Header/Footer lands in Task 8), `app/[locale]/page.tsx` (minimal placeholder — full version lands in Task 9)
- Test: `e2e/locale-routing.spec.ts`

**Interfaces:**
- Consumes: `cn()` from Task 1 (not used yet, but confirms path alias works)
- Produces: `routing` object and `Locale` type from `i18n/routing.ts` — every later task that needs the current locale imports `Locale` from here.

- [ ] **Step 1: Create `i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
})

export type Locale = (typeof routing.locales)[number]
```

- [ ] **Step 2: Create `i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 3: Create `middleware.ts`**

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|studio|.*\\..*).*)'],
}
```

(`studio` is excluded so the embedded Sanity Studio route added in Task 3 isn't locale-prefixed.)

- [ ] **Step 4: Create `messages/en.json`**

```json
{
  "nav": {
    "home": "Home",
    "hardware": "Hardware",
    "about": "About",
    "contact": "Contact",
    "contactCta": "Contact Us"
  },
  "hardware": {
    "requestQuote": "Request a Quote"
  },
  "contact": {
    "sendWhatsApp": "Send via WhatsApp",
    "sendEmail": "Send via Email",
    "nameLabel": "Name",
    "messageLabel": "Message"
  },
  "footer": {
    "quickLinks": "Quick Links"
  }
}
```

- [ ] **Step 5: Create `messages/ar.json`**

```json
{
  "nav": {
    "home": "الرئيسية",
    "hardware": "الأجهزة",
    "about": "من نحن",
    "contact": "اتصل بنا",
    "contactCta": "اتصل بنا"
  },
  "hardware": {
    "requestQuote": "اطلب عرض سعر"
  },
  "contact": {
    "sendWhatsApp": "أرسل عبر واتساب",
    "sendEmail": "أرسل بالبريد الإلكتروني",
    "nameLabel": "الاسم",
    "messageLabel": "الرسالة"
  },
  "footer": {
    "quickLinks": "روابط سريعة"
  }
}
```

- [ ] **Step 6: Delete Task 1's temporary root files and create the locale-scoped versions**

```bash
rm app/layout.tsx app/page.tsx
```

Create `app/[locale]/layout.tsx`:

```tsx
import '../globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) notFound()

  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```

Create `app/[locale]/page.tsx`:

```tsx
export default function HomePlaceholder() {
  return <div>Home page placeholder</div>
}
```

- [ ] **Step 7: Write the failing e2e test**

Create `e2e/locale-routing.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('redirects the root path to the default locale', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/en$/)
})

test('sets dir=ltr and lang=en on the English homepage', async ({ page }) => {
  await page.goto('/en')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', 'en')
  await expect(html).toHaveAttribute('dir', 'ltr')
})

test('sets dir=rtl and lang=ar on the Arabic homepage', async ({ page }) => {
  await page.goto('/ar')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', 'ar')
  await expect(html).toHaveAttribute('dir', 'rtl')
})
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npx playwright test e2e/locale-routing.spec.ts`
Expected: FAIL — build error or 404, since `next.config.ts` references `i18n/request.ts` which now exists but the app isn't fully wired (verify it fails for the *right* reason: read the Playwright error output and confirm it's a routing/build issue, not a Playwright setup issue, before proceeding)

- [ ] **Step 9: Fix until the build succeeds and the test passes**

Run: `npm run build`
Expected: build succeeds with no missing-module errors

Run: `npx playwright test e2e/locale-routing.spec.ts`
Expected: PASS — 3 passed

- [ ] **Step 10: Commit**

```bash
git add i18n middleware.ts messages app/[locale] e2e/locale-routing.spec.ts
git commit -m "feat: add next-intl locale routing, middleware, and messages"
```

---

### Task 3: Sanity Schema, Client, Types & Queries

**Files:**
- Create: `sanity/env.ts`, `sanity/client.ts`, `sanity/schemaTypes/index.ts`, `sanity/schemaTypes/siteSettings.ts`, `sanity/schemaTypes/homePage.ts`, `sanity/schemaTypes/feature.ts`, `sanity/schemaTypes/hardwareProduct.ts`, `sanity/schemaTypes/aboutPage.ts`, `sanity/types.ts`, `sanity/queries.ts`, `sanity.config.ts`
- Create: `app/studio/[[...tool]]/page.tsx`
- Test: `sanity/schemaTypes/index.test.ts`, `sanity/queries.test.ts`

**Interfaces:**
- Produces: `LocalizedString`, `SiteSettings`, `HomePage`, `Feature`, `HardwareSpec`, `HardwareProduct`, `AboutPage` types from `sanity/types.ts` — used by every component and page task from here on.
- Produces: `getSiteSettings()`, `getHomePage()`, `getFeatures()`, `getHardwareProducts()`, `getAboutPage()` from `sanity/queries.ts` — used by page tasks (9–12).
- Consumes: nothing new (env vars only).

- [ ] **Step 1: Create `sanity/env.ts`**

```ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const apiVersion = '2025-01-01'
```

- [ ] **Step 2: Create `sanity/types.ts`**

```ts
export type LocalizedString = {
  en: string
  ar: string
}

export interface SiteSettings {
  logoUrl: string
  phoneNumbers: string[]
  whatsappNumber: string
  email: string
  socialLinks: { platform: string; url: string }[]
  address: LocalizedString
  footerText: LocalizedString
}

export interface HomePage {
  heroHeadline: LocalizedString
  heroSubheadline: LocalizedString
  marqueeKeywords: string[]
  aboutTeaser: LocalizedString
  contactCtaText: LocalizedString
  seoTitle: LocalizedString
  seoDescription: LocalizedString
}

export interface Feature {
  _id: string
  order: number
  title: LocalizedString
  description: LocalizedString
}

export interface HardwareSpec {
  label: LocalizedString
  value: LocalizedString
}

export interface HardwareProduct {
  _id: string
  order: number
  name: LocalizedString
  description: LocalizedString
  images: string[]
  specs: HardwareSpec[]
}

export interface AboutPage {
  story: LocalizedString
  imageUrl: string
  seoTitle: LocalizedString
  seoDescription: LocalizedString
}
```

- [ ] **Step 3: Create the Sanity schema type definitions**

Create `sanity/schemaTypes/siteSettings.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
    defineField({
      name: 'phoneNumbers',
      title: 'Phone Numbers',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'whatsappNumber', title: 'WhatsApp Number', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'platform', type: 'string' },
            { name: 'url', type: 'url' },
          ],
        },
      ],
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        { name: 'en', type: 'string' },
        { name: 'ar', type: 'string' },
      ],
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'object',
      fields: [
        { name: 'en', type: 'text' },
        { name: 'ar', type: 'text' },
      ],
    }),
  ],
})
```

Create `sanity/schemaTypes/homePage.ts`:

```ts
import { defineField, defineType } from 'sanity'

const localizedString = (name: string, title: string, type: 'string' | 'text' = 'string') => ({
  name,
  title,
  type: 'object' as const,
  fields: [
    { name: 'en', type },
    { name: 'ar', type },
  ],
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField(localizedString('heroHeadline', 'Hero Headline')),
    defineField(localizedString('heroSubheadline', 'Hero Subheadline', 'text')),
    defineField({
      name: 'marqueeKeywords',
      title: 'Marquee Keywords',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField(localizedString('aboutTeaser', 'About Teaser', 'text')),
    defineField(localizedString('contactCtaText', 'Contact CTA Text', 'text')),
    defineField(localizedString('seoTitle', 'SEO Title')),
    defineField(localizedString('seoDescription', 'SEO Description', 'text')),
  ],
})
```

Create `sanity/schemaTypes/feature.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const feature = defineType({
  name: 'feature',
  title: 'Feature',
  type: 'document',
  fields: [
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        { name: 'en', type: 'string' },
        { name: 'ar', type: 'string' },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        { name: 'en', type: 'text' },
        { name: 'ar', type: 'text' },
      ],
    }),
  ],
  orderings: [
    { title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
})
```

Create `sanity/schemaTypes/hardwareProduct.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const hardwareProduct = defineType({
  name: 'hardwareProduct',
  title: 'Hardware Product',
  type: 'document',
  fields: [
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'object',
      fields: [
        { name: 'en', type: 'string' },
        { name: 'ar', type: 'string' },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        { name: 'en', type: 'text' },
        { name: 'ar', type: 'text' },
      ],
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image' }],
    }),
    defineField({
      name: 'specs',
      title: 'Specs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'label',
              type: 'object',
              fields: [
                { name: 'en', type: 'string' },
                { name: 'ar', type: 'string' },
              ],
            },
            {
              name: 'value',
              type: 'object',
              fields: [
                { name: 'en', type: 'string' },
                { name: 'ar', type: 'string' },
              ],
            },
          ],
        },
      ],
    }),
  ],
  orderings: [
    { title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
})
```

Create `sanity/schemaTypes/aboutPage.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({
      name: 'story',
      title: 'Story',
      type: 'object',
      fields: [
        { name: 'en', type: 'text' },
        { name: 'ar', type: 'text' },
      ],
    }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'object',
      fields: [
        { name: 'en', type: 'string' },
        { name: 'ar', type: 'string' },
      ],
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'object',
      fields: [
        { name: 'en', type: 'text' },
        { name: 'ar', type: 'text' },
      ],
    }),
  ],
})
```

Create `sanity/schemaTypes/index.ts`:

```ts
import { siteSettings } from './siteSettings'
import { homePage } from './homePage'
import { feature } from './feature'
import { hardwareProduct } from './hardwareProduct'
import { aboutPage } from './aboutPage'

export const schemaTypes = [siteSettings, homePage, feature, hardwareProduct, aboutPage]
```

- [ ] **Step 4: Write the failing test for the schema index**

Create `sanity/schemaTypes/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { schemaTypes } from './index'

describe('schemaTypes', () => {
  it('registers exactly the five expected content types', () => {
    const names = schemaTypes.map((s) => s.name).sort()
    expect(names).toEqual(
      ['aboutPage', 'feature', 'hardwareProduct', 'homePage', 'siteSettings'].sort(),
    )
  })

  it('gives feature and hardwareProduct an order field for manual sorting', () => {
    const feature = schemaTypes.find((s) => s.name === 'feature')!
    const hardwareProduct = schemaTypes.find((s) => s.name === 'hardwareProduct')!
    expect((feature as any).fields.some((f: any) => f.name === 'order')).toBe(true)
    expect((hardwareProduct as any).fields.some((f: any) => f.name === 'order')).toBe(true)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run sanity/schemaTypes/index.test.ts`
Expected: FAIL — module not found (schema files don't exist until Step 3 is actually saved; if Step 3 was already applied, confirm the test would fail on a fresh checkout by temporarily renaming `index.ts` — otherwise skip straight to Step 6)

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run sanity/schemaTypes/index.test.ts`
Expected: PASS — 2 passed

- [ ] **Step 7: Create `sanity/client.ts`**

```ts
import { createClient } from '@sanity/client'
import { projectId, dataset, apiVersion } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
})
```

- [ ] **Step 8: Write the failing tests for the query functions**

Create `sanity/queries.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { client } from './client'
import {
  getSiteSettings,
  getHomePage,
  getFeatures,
  getHardwareProducts,
  getAboutPage,
} from './queries'

vi.mock('./client', () => ({
  client: { fetch: vi.fn() },
}))

describe('sanity queries', () => {
  it('getSiteSettings fetches the singleton siteSettings document', async () => {
    const mockData = { email: 'info@trackway.com' }
    vi.mocked(client.fetch).mockResolvedValueOnce(mockData)
    const result = await getSiteSettings()
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining('_type == "siteSettings"'))
    expect(result).toEqual(mockData)
  })

  it('getHomePage fetches the singleton homePage document', async () => {
    const mockData = { heroHeadline: { en: 'Track everything', ar: 'تتبع كل شيء' } }
    vi.mocked(client.fetch).mockResolvedValueOnce(mockData)
    const result = await getHomePage()
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining('_type == "homePage"'))
    expect(result).toEqual(mockData)
  })

  it('getFeatures fetches feature documents ordered by "order"', async () => {
    const mockData = [{ _id: '1', order: 1 }]
    vi.mocked(client.fetch).mockResolvedValueOnce(mockData)
    const result = await getFeatures()
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "feature"'),
    )
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining('order(order asc)'))
    expect(result).toEqual(mockData)
  })

  it('getHardwareProducts fetches hardwareProduct documents ordered by "order"', async () => {
    const mockData = [{ _id: '1', order: 1 }]
    vi.mocked(client.fetch).mockResolvedValueOnce(mockData)
    const result = await getHardwareProducts()
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "hardwareProduct"'),
    )
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining('order(order asc)'))
    expect(result).toEqual(mockData)
  })

  it('getAboutPage fetches the singleton aboutPage document', async () => {
    const mockData = { story: { en: 'Our story', ar: 'قصتنا' } }
    vi.mocked(client.fetch).mockResolvedValueOnce(mockData)
    const result = await getAboutPage()
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining('_type == "aboutPage"'))
    expect(result).toEqual(mockData)
  })
})
```

- [ ] **Step 9: Run the test to verify it fails**

Run: `npx vitest run sanity/queries.test.ts`
Expected: FAIL — `Cannot find module './queries'`

- [ ] **Step 10: Implement `sanity/queries.ts`**

```ts
import { client } from './client'
import type { SiteSettings, HomePage, Feature, HardwareProduct, AboutPage } from './types'

export async function getSiteSettings(): Promise<SiteSettings> {
  return client.fetch(`*[_type == "siteSettings"][0]{
    "logoUrl": logo.asset->url,
    phoneNumbers,
    whatsappNumber,
    email,
    socialLinks,
    address,
    footerText
  }`)
}

export async function getHomePage(): Promise<HomePage> {
  return client.fetch(`*[_type == "homePage"][0]{
    heroHeadline,
    heroSubheadline,
    marqueeKeywords,
    aboutTeaser,
    contactCtaText,
    seoTitle,
    seoDescription
  }`)
}

export async function getFeatures(): Promise<Feature[]> {
  return client.fetch(`*[_type == "feature"] | order(order asc){
    _id,
    order,
    title,
    description
  }`)
}

export async function getHardwareProducts(): Promise<HardwareProduct[]> {
  return client.fetch(`*[_type == "hardwareProduct"] | order(order asc){
    _id,
    order,
    name,
    description,
    "images": images[].asset->url,
    specs
  }`)
}

export async function getAboutPage(): Promise<AboutPage> {
  return client.fetch(`*[_type == "aboutPage"][0]{
    story,
    "imageUrl": image.asset->url,
    seoTitle,
    seoDescription
  }`)
}
```

- [ ] **Step 11: Run the test to verify it passes**

Run: `npx vitest run sanity/queries.test.ts`
Expected: PASS — 5 passed

- [ ] **Step 12: Create `sanity.config.ts` and the embedded Studio route**

Create `sanity.config.ts`:

```ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'
import { projectId, dataset, apiVersion } from './sanity/env'

export default defineConfig({
  name: 'trackway-studio',
  title: 'TrackWay CMS',
  projectId,
  dataset,
  apiVersion,
  basePath: '/studio',
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
})
```

Create `app/studio/[[...tool]]/page.tsx`:

```tsx
'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

- [ ] **Step 13: Commit**

```bash
git add sanity sanity.config.ts app/studio
git commit -m "feat: add Sanity schema, client, typed queries, and embedded Studio"
```

---

### Task 4: Shared Content Utilities — `getLocalized` and Contact Link Builders

**Files:**
- Create: `lib/i18n-utils.ts`, `lib/contact-links.ts`
- Test: `lib/i18n-utils.test.ts`, `lib/contact-links.test.ts`

**Interfaces:**
- Consumes: `Locale` from `i18n/routing.ts` (Task 2), `LocalizedString` from `sanity/types.ts` (Task 3)
- Produces: `getLocalized(field, locale): string` — used by every page task (9–12) to resolve Sanity `{en, ar}` fields before passing plain strings to presentational components.
- Produces: `buildWhatsAppLink(phone, message): string` and `buildMailtoLink(email, subject, body): string` — used by `WhatsAppButton` (Task 7), `HardwareCard` (Task 6), and `ContactForm` (Task 12).

- [ ] **Step 1: Write the failing test for `getLocalized`**

Create `lib/i18n-utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getLocalized } from './i18n-utils'

describe('getLocalized', () => {
  it('returns the English value for locale "en"', () => {
    expect(getLocalized({ en: 'Hello', ar: 'مرحبا' }, 'en')).toBe('Hello')
  })

  it('returns the Arabic value for locale "ar"', () => {
    expect(getLocalized({ en: 'Hello', ar: 'مرحبا' }, 'ar')).toBe('مرحبا')
  })

  it('falls back to English when the Arabic value is empty', () => {
    expect(getLocalized({ en: 'Hello', ar: '' }, 'ar')).toBe('Hello')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/i18n-utils.test.ts`
Expected: FAIL — `Cannot find module './i18n-utils'`

- [ ] **Step 3: Implement `lib/i18n-utils.ts`**

```ts
import type { Locale } from '@/i18n/routing'
import type { LocalizedString } from '@/sanity/types'

export function getLocalized(field: LocalizedString, locale: Locale): string {
  return field[locale] || field.en
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/i18n-utils.test.ts`
Expected: PASS — 3 passed

- [ ] **Step 5: Write the failing tests for the contact link builders**

Create `lib/contact-links.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildWhatsAppLink, buildMailtoLink } from './contact-links'

describe('buildWhatsAppLink', () => {
  it('strips non-digit characters from the phone number and URL-encodes the message', () => {
    const link = buildWhatsAppLink('+961 3 123 456', 'Hi, I need a quote')
    expect(link).toBe('https://wa.me/9613123456?text=Hi%2C%20I%20need%20a%20quote')
  })
})

describe('buildMailtoLink', () => {
  it('URL-encodes the subject and body', () => {
    const link = buildMailtoLink('info@trackway.com', 'Quote request', 'Hi, I need a quote')
    expect(link).toBe(
      'mailto:info@trackway.com?subject=Quote%20request&body=Hi%2C%20I%20need%20a%20quote',
    )
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run lib/contact-links.test.ts`
Expected: FAIL — `Cannot find module './contact-links'`

- [ ] **Step 7: Implement `lib/contact-links.ts`**

```ts
export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/\D/g, '')
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`
}

export function buildMailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run lib/contact-links.test.ts`
Expected: PASS — 2 passed

- [ ] **Step 9: Commit**

```bash
git add lib/i18n-utils.ts lib/i18n-utils.test.ts lib/contact-links.ts lib/contact-links.test.ts
git commit -m "feat: add locale field resolver and contact link builders"
```

---

### Task 5: `DotGridBackground` Component

**Files:**
- Create: `components/ui/DotGridBackground.tsx`
- Test: `components/ui/DotGridBackground.test.tsx`

**Interfaces:**
- Consumes: `cn()` from `lib/utils.ts` (Task 1)
- Produces: `<DotGridBackground variant="world" | "streets" className?: string />` — used by Home page (Task 9) and About page (Task 11) as decorative background art.

- [ ] **Step 1: Write the failing test**

Create `components/ui/DotGridBackground.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DotGridBackground } from './DotGridBackground'

describe('DotGridBackground', () => {
  it('renders as a decorative, non-interactive element hidden from screen readers', () => {
    render(<DotGridBackground variant="world" />)
    const el = screen.getByTestId('dot-grid-background')
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })

  it('reflects the variant prop in a data attribute', () => {
    render(<DotGridBackground variant="streets" />)
    expect(screen.getByTestId('dot-grid-background')).toHaveAttribute('data-variant', 'streets')
  })

  it('merges an incoming className with its base classes', () => {
    render(<DotGridBackground variant="world" className="opacity-50" />)
    expect(screen.getByTestId('dot-grid-background')).toHaveClass('opacity-50')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/DotGridBackground.test.tsx`
Expected: FAIL — `Cannot find module './DotGridBackground'`

- [ ] **Step 3: Implement `components/ui/DotGridBackground.tsx`**

```tsx
import { cn } from '@/lib/utils'

interface DotGridBackgroundProps {
  variant: 'world' | 'streets'
  className?: string
}

export function DotGridBackground({ variant, className }: DotGridBackgroundProps) {
  return (
    <div
      data-testid="dot-grid-background"
      data-variant={variant}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#ffffff14_1px,transparent_1px)] bg-[length:16px_16px]',
        className,
      )}
    />
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/DotGridBackground.test.tsx`
Expected: PASS — 3 passed

- [ ] **Step 5: Commit**

```bash
git add components/ui/DotGridBackground.tsx components/ui/DotGridBackground.test.tsx
git commit -m "feat: add DotGridBackground decorative component"
```

---

### Task 6: `MarqueeTicker` Component (RTL-aware)

**Files:**
- Create: `components/ui/MarqueeTicker.tsx`
- Test: `components/ui/MarqueeTicker.test.tsx`

**Interfaces:**
- Consumes: `cn()` from `lib/utils.ts`, `useLocale()` from `next-intl` (available because Task 2's `NextIntlClientProvider` wraps the tree at render time in real pages — the test renders the component directly inside its own provider, per Step 1)
- Produces: `<MarqueeTicker items={string[]} />` — used by Home page (Task 9).

- [ ] **Step 1: Write the failing test**

Create `components/ui/MarqueeTicker.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MarqueeTicker } from './MarqueeTicker'

function renderWithLocale(locale: 'en' | 'ar', items: string[]) {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <MarqueeTicker items={items} />
    </NextIntlClientProvider>,
  )
}

describe('MarqueeTicker', () => {
  it('renders every item text', () => {
    renderWithLocale('en', ['LIVE TRACKING', 'FLEET MANAGEMENT'])
    expect(screen.getAllByText('LIVE TRACKING').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FLEET MANAGEMENT').length).toBeGreaterThan(0)
  })

  it('scrolls left-to-right animation direction in the ltr (English) locale', () => {
    renderWithLocale('en', ['LIVE TRACKING'])
    expect(screen.getByTestId('marquee-track')).toHaveClass('animate-marquee-ltr')
  })

  it('reverses the animation direction in the rtl (Arabic) locale', () => {
    renderWithLocale('ar', ['تتبع مباشر'])
    expect(screen.getByTestId('marquee-track')).toHaveClass('animate-marquee-rtl')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/MarqueeTicker.test.tsx`
Expected: FAIL — `Cannot find module './MarqueeTicker'`

- [ ] **Step 3: Implement `components/ui/MarqueeTicker.tsx`**

```tsx
'use client'

import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface MarqueeTickerProps {
  items: string[]
}

export function MarqueeTicker({ items }: MarqueeTickerProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden bg-accent py-3">
      <div
        data-testid="marquee-track"
        className={cn(
          'flex w-max gap-8 whitespace-nowrap',
          isRtl ? 'animate-marquee-rtl' : 'animate-marquee-ltr',
        )}
      >
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="font-bold uppercase text-background">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add the marquee keyframes to the Tailwind config**

Modify `tailwind.config.ts` — add inside `theme.extend`:

```ts
      keyframes: {
        'marquee-ltr': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'marquee-rtl': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(50%)' } },
      },
      animation: {
        'marquee-ltr': 'marquee-ltr 20s linear infinite',
        'marquee-rtl': 'marquee-rtl 20s linear infinite',
      },
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run components/ui/MarqueeTicker.test.tsx`
Expected: PASS — 3 passed

- [ ] **Step 6: Commit**

```bash
git add components/ui/MarqueeTicker.tsx components/ui/MarqueeTicker.test.tsx tailwind.config.ts
git commit -m "feat: add RTL-aware MarqueeTicker component"
```

---

### Task 7: `FeatureCard` and `HardwareCard` Components

**Files:**
- Create: `components/ui/FeatureCard.tsx`, `components/ui/HardwareCard.tsx`
- Test: `components/ui/FeatureCard.test.tsx`, `components/ui/HardwareCard.test.tsx`

**Interfaces:**
- Consumes: `buildWhatsAppLink` from `lib/contact-links.ts` (Task 4)
- Produces: `<FeatureCard number={string} title={string} description={string} />` and `<HardwareCard name={string} description={string} images={string[]} specs={{label:string; value:string}[]} whatsappNumber={string} requestQuoteLabel={string} />` — both used by Home page (Task 9); `HardwareCard` also used by Hardware page (Task 10).
- Note: components receive already-localized plain strings (resolved via `getLocalized` at the page level), so they stay locale-agnostic and simple to test.

- [ ] **Step 1: Write the failing test for `FeatureCard`**

Create `components/ui/FeatureCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureCard } from './FeatureCard'

describe('FeatureCard', () => {
  it('renders the number, title, and description', () => {
    render(<FeatureCard number="01" title="Live Tracking" description="See vehicles in real time." />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Live Tracking' })).toBeInTheDocument()
    expect(screen.getByText('See vehicles in real time.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/FeatureCard.test.tsx`
Expected: FAIL — `Cannot find module './FeatureCard'`

- [ ] **Step 3: Implement `components/ui/FeatureCard.tsx`**

```tsx
interface FeatureCardProps {
  number: string
  title: string
  description: string
}

export function FeatureCard({ number, title, description }: FeatureCardProps) {
  return (
    <div className="border border-white/10 p-6">
      <span className="text-accent font-bold">{number}</span>
      <h3 className="mt-2 text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-muted">{description}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/FeatureCard.test.tsx`
Expected: PASS — 1 passed

- [ ] **Step 5: Write the failing test for `HardwareCard`**

Create `components/ui/HardwareCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HardwareCard } from './HardwareCard'

const baseProps = {
  name: 'TrackerX1',
  description: 'A rugged hardware GPS tracker.',
  images: ['https://cdn.sanity.io/trackerx1.jpg'],
  specs: [{ label: 'Battery', value: '5000mAh' }],
  whatsappNumber: '+961 3 123 456',
  requestQuoteLabel: 'Request a Quote',
}

describe('HardwareCard', () => {
  it('renders the name, description, image, and specs', () => {
    render(<HardwareCard {...baseProps} />)
    expect(screen.getByRole('heading', { name: 'TrackerX1' })).toBeInTheDocument()
    expect(screen.getByText('A rugged hardware GPS tracker.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'TrackerX1' })).toHaveAttribute(
      'src',
      expect.stringContaining('trackerx1.jpg'),
    )
    expect(screen.getByText('Battery')).toBeInTheDocument()
    expect(screen.getByText('5000mAh')).toBeInTheDocument()
  })

  it('never renders a price — only a WhatsApp "Request a Quote" link', () => {
    render(<HardwareCard {...baseProps} />)
    const cta = screen.getByRole('link', { name: 'Request a Quote' })
    expect(cta).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/9613123456?text='),
    )
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run components/ui/HardwareCard.test.tsx`
Expected: FAIL — `Cannot find module './HardwareCard'`

- [ ] **Step 7: Implement `components/ui/HardwareCard.tsx`**

```tsx
import Image from 'next/image'
import { buildWhatsAppLink } from '@/lib/contact-links'

interface HardwareCardProps {
  name: string
  description: string
  images: string[]
  specs: { label: string; value: string }[]
  whatsappNumber: string
  requestQuoteLabel: string
}

export function HardwareCard({
  name,
  description,
  images,
  specs,
  whatsappNumber,
  requestQuoteLabel,
}: HardwareCardProps) {
  const quoteLink = buildWhatsAppLink(whatsappNumber, `Hi, I'd like a quote for ${name}.`)

  return (
    <div className="border border-white/10 p-6">
      {images[0] && (
        <div className="relative mb-4 h-48 w-full">
          <Image src={images[0]} alt={name} fill className="object-cover" />
        </div>
      )}
      <h3 className="text-xl font-bold text-foreground">{name}</h3>
      <p className="mt-2 text-muted">{description}</p>
      <dl className="mt-4 space-y-1">
        {specs.map((spec) => (
          <div key={spec.label} className="flex justify-between text-sm">
            <dt className="text-muted">{spec.label}</dt>
            <dd className="text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
      <a
        href={quoteLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-accent font-bold"
      >
        {requestQuoteLabel}
      </a>
    </div>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run components/ui/HardwareCard.test.tsx`
Expected: PASS — 2 passed

- [ ] **Step 9: Commit**

```bash
git add components/ui/FeatureCard.tsx components/ui/FeatureCard.test.tsx components/ui/HardwareCard.tsx components/ui/HardwareCard.test.tsx
git commit -m "feat: add FeatureCard and HardwareCard components"
```

---

### Task 8: `WhatsAppButton` Component (RTL-aware positioning)

**Files:**
- Create: `components/ui/WhatsAppButton.tsx`
- Test: `components/ui/WhatsAppButton.test.tsx`

**Interfaces:**
- Consumes: `buildWhatsAppLink` from `lib/contact-links.ts`, `useLocale()` from `next-intl`
- Produces: `<WhatsAppButton phoneNumber={string} />` — used in the root locale layout (Task 9).

- [ ] **Step 1: Write the failing test**

Create `components/ui/WhatsAppButton.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { WhatsAppButton } from './WhatsAppButton'

function renderWithLocale(locale: 'en' | 'ar') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <WhatsAppButton phoneNumber="+961 3 123 456" />
    </NextIntlClientProvider>,
  )
}

describe('WhatsAppButton', () => {
  it('links to the WhatsApp deep link for the given number', () => {
    renderWithLocale('en')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/9613123456'),
    )
  })

  it('is fixed to the bottom-right in the ltr (English) locale', () => {
    renderWithLocale('en')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveClass('right-6')
  })

  it('is fixed to the bottom-left in the rtl (Arabic) locale', () => {
    renderWithLocale('ar')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveClass('left-6')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/WhatsAppButton.test.tsx`
Expected: FAIL — `Cannot find module './WhatsAppButton'`

- [ ] **Step 3: Implement `components/ui/WhatsAppButton.tsx`**

```tsx
'use client'

import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { buildWhatsAppLink } from '@/lib/contact-links'

interface WhatsAppButtonProps {
  phoneNumber: string
}

export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const link = buildWhatsAppLink(phoneNumber, "Hi, I'd like to know more about TrackWay's GPS solutions.")

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className={cn(
        'fixed bottom-6 z-50 rounded-full bg-accent p-4 text-background shadow-lg',
        isRtl ? 'left-6' : 'right-6',
      )}
    >
      WhatsApp
    </a>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/WhatsAppButton.test.tsx`
Expected: PASS — 3 passed

- [ ] **Step 5: Commit**

```bash
git add components/ui/WhatsAppButton.tsx components/ui/WhatsAppButton.test.tsx
git commit -m "feat: add RTL-aware floating WhatsAppButton component"
```

---

### Task 9: `Header`, `Footer` & Full Root Layout Assembly

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/Footer.tsx`
- Modify: `app/[locale]/layout.tsx` (replace the minimal Task 2 version with the full version rendering Header/Footer/WhatsAppButton)
- Test: `components/layout/Header.test.tsx`, `components/layout/Footer.test.tsx`, `e2e/rtl-layout.spec.ts`

**Interfaces:**
- Consumes: `Locale` from `i18n/routing.ts`, `SiteSettings` from `sanity/types.ts`, `WhatsAppButton` from Task 8, `getSiteSettings` from `sanity/queries.ts` (Task 3)
- Produces: fully assembled `app/[locale]/layout.tsx` that every page task (10–12) renders inside.

- [ ] **Step 1: Write the failing test for `Header`**

Create `components/layout/Header.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from './Header'

const messages = {
  nav: { home: 'Home', hardware: 'Hardware', about: 'About', contact: 'Contact', contactCta: 'Contact Us' },
}

function renderHeader(locale: 'en' | 'ar', pathname: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header locale={locale} pathname={pathname} logoUrl="https://cdn.sanity.io/logo.png" />
    </NextIntlClientProvider>,
  )
}

describe('Header', () => {
  it('renders all nav links with localized labels', () => {
    renderHeader('en', '/en')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/en')
    expect(screen.getByRole('link', { name: 'Hardware' })).toHaveAttribute('href', '/en/hardware')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/en/about')
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/en/contact')
  })

  it('the locale switcher swaps only the locale segment, preserving the rest of the path', () => {
    renderHeader('en', '/en/hardware')
    expect(screen.getByRole('link', { name: /العربية|arabic/i })).toHaveAttribute(
      'href',
      '/ar/hardware',
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: FAIL — `Cannot find module './Header'`

- [ ] **Step 3: Implement `components/layout/Header.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/i18n/routing'

interface HeaderProps {
  locale: Locale
  pathname: string
  logoUrl: string
}

export function Header({ locale, pathname, logoUrl }: HeaderProps) {
  const t = useTranslations('nav')
  const otherLocale: Locale = locale === 'en' ? 'ar' : 'en'
  const restOfPath = pathname.replace(new RegExp(`^/${locale}`), '') || ''
  const switcherHref = `/${otherLocale}${restOfPath}`
  const switcherLabel = otherLocale === 'ar' ? 'العربية' : 'English'

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href={`/${locale}`}>
        <Image src={logoUrl} alt="TrackWay" width={120} height={32} />
      </Link>
      <nav className="flex items-center gap-6">
        <Link href={`/${locale}`}>{t('home')}</Link>
        <Link href={`/${locale}/hardware`}>{t('hardware')}</Link>
        <Link href={`/${locale}/about`}>{t('about')}</Link>
        <Link href={switcherHref}>{switcherLabel}</Link>
        <Link
          href={`/${locale}/contact`}
          className="rounded-full bg-accent px-4 py-2 font-bold text-background"
        >
          {t('contactCta')}
        </Link>
      </nav>
    </header>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: PASS — 2 passed

- [ ] **Step 5: Write the failing test for `Footer`**

Create `components/layout/Footer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Footer } from './Footer'

const messages = { footer: { quickLinks: 'Quick Links' } }

const siteSettings = {
  phoneNumbers: ['+961 3 123 456'],
  whatsappNumber: '+961 3 123 456',
  email: 'info@trackway.com',
  socialLinks: [{ platform: 'facebook', url: 'https://facebook.com/trackway' }],
  addressText: 'Beirut, Lebanon',
  footerText: 'TrackWay: GPS tracking for everyone.',
}

describe('Footer', () => {
  it('renders phone, email, address, and social links', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Footer locale="en" siteSettings={siteSettings} />
      </NextIntlClientProvider>,
    )
    expect(screen.getByRole('link', { name: '+961 3 123 456' })).toHaveAttribute(
      'href',
      'tel:+961 3 123 456',
    )
    expect(screen.getByRole('link', { name: 'info@trackway.com' })).toHaveAttribute(
      'href',
      'mailto:info@trackway.com',
    )
    expect(screen.getByText('Beirut, Lebanon')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute(
      'href',
      'https://facebook.com/trackway',
    )
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: FAIL — `Cannot find module './Footer'`

- [ ] **Step 7: Implement `components/layout/Footer.tsx`**

```tsx
import { useTranslations } from 'next-intl'
import type { Locale } from '@/i18n/routing'

interface FooterSiteSettings {
  phoneNumbers: string[]
  whatsappNumber: string
  email: string
  socialLinks: { platform: string; url: string }[]
  addressText: string
  footerText: string
}

interface FooterProps {
  locale: Locale
  siteSettings: FooterSiteSettings
}

export function Footer({ siteSettings }: FooterProps) {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <p className="text-muted">{siteSettings.footerText}</p>
      <p className="mt-2 text-muted">{siteSettings.addressText}</p>
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
      <p className="mt-6 text-sm text-muted">{t('quickLinks')}</p>
    </footer>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: PASS — 1 passed

- [ ] **Step 9: Assemble the full root layout**

Modify `app/[locale]/layout.tsx` — replace its entire content with:

```tsx
import '../globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { headers } from 'next/headers'
import { routing, type Locale } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { getSiteSettings } from '@/sanity/queries'
import { getLocalized } from '@/lib/i18n-utils'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) notFound()
  const typedLocale = locale as Locale

  const messages = await getMessages()
  const dir = typedLocale === 'ar' ? 'rtl' : 'ltr'
  const siteSettings = await getSiteSettings()
  const pathname = (await headers()).get('x-pathname') ?? `/${typedLocale}`

  return (
    <html lang={typedLocale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header locale={typedLocale} pathname={pathname} logoUrl={siteSettings.logoUrl} />
          <main>{children}</main>
          <Footer
            locale={typedLocale}
            siteSettings={{
              phoneNumbers: siteSettings.phoneNumbers,
              whatsappNumber: siteSettings.whatsappNumber,
              email: siteSettings.email,
              socialLinks: siteSettings.socialLinks,
              addressText: getLocalized(siteSettings.address, typedLocale),
              footerText: getLocalized(siteSettings.footerText, typedLocale),
            }}
          />
          <WhatsAppButton phoneNumber={siteSettings.whatsappNumber} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

Modify `middleware.ts` to forward the current pathname as a header (needed by `Header`'s locale switcher above):

```ts
import createMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const response = handleI18nRouting(request)
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ['/((?!api|_next|studio|.*\\..*).*)'],
}
```

- [ ] **Step 10: Write the failing e2e RTL layout test**

Create `e2e/rtl-layout.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('the WhatsApp button sits at bottom-right on the English (ltr) homepage', async ({ page }) => {
  await page.goto('/en')
  const button = page.getByRole('link', { name: /whatsapp/i })
  await expect(button).toHaveClass(/right-6/)
})

test('the WhatsApp button sits at bottom-left on the Arabic (rtl) homepage', async ({ page }) => {
  await page.goto('/ar')
  const button = page.getByRole('link', { name: /whatsapp/i })
  await expect(button).toHaveClass(/left-6/)
})

test('the locale switcher on /en/hardware links to /ar/hardware', async ({ page }) => {
  await page.goto('/en/hardware')
  const switcher = page.getByRole('link', { name: /العربية/i })
  await expect(switcher).toHaveAttribute('href', '/ar/hardware')
})
```

- [ ] **Step 11: Run the test to verify it fails**

Run: `npx playwright test e2e/rtl-layout.spec.ts`
Expected: FAIL — `/en/hardware` doesn't exist yet (created in Task 10); confirm the WhatsApp-button assertions on `/en` and `/ar` at least resolve correctly once Task 9's layout code is in place — if those two pass already, that's expected partial progress, note it and continue to Task 10 before re-running

- [ ] **Step 12: Commit**

```bash
git add components/layout/Header.tsx components/layout/Header.test.tsx components/layout/Footer.tsx components/layout/Footer.test.tsx app/[locale]/layout.tsx middleware.ts e2e/rtl-layout.spec.ts
git commit -m "feat: assemble Header, Footer, and full root layout with RTL-aware WhatsApp button"
```

---

### Task 10: Home Page Assembly

**Files:**
- Modify: `app/[locale]/page.tsx` (replace Task 2's placeholder)
- Test: `app/[locale]/page.test.tsx`

**Interfaces:**
- Consumes: `getHomePage`, `getFeatures` from `sanity/queries.ts`; `getLocalized` from `lib/i18n-utils.ts`; `MarqueeTicker`, `FeatureCard`, `DotGridBackground` components
- Produces: the rendered `/[locale]` route, linked to from `Header` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `app/[locale]/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

vi.mock('@/sanity/queries', () => ({
  getHomePage: vi.fn().mockResolvedValue({
    heroHeadline: { en: 'Track everything that moves', ar: 'تتبع كل ما يتحرك' },
    heroSubheadline: { en: 'GPS for fleets and individuals.', ar: 'نظام تتبع للأساطيل والأفراد.' },
    marqueeKeywords: ['LIVE TRACKING', 'FLEET MANAGEMENT'],
    aboutTeaser: { en: 'We are TrackWay.', ar: 'نحن TrackWay.' },
    contactCtaText: { en: 'Get in touch', ar: 'تواصل معنا' },
  }),
  getFeatures: vi.fn().mockResolvedValue([
    { _id: '1', order: 1, title: { en: 'Live Tracking', ar: 'تتبع مباشر' }, description: { en: 'Real-time location.', ar: 'الموقع في الوقت الفعلي.' } },
  ]),
}))

describe('HomePage', () => {
  it('renders the localized hero headline and at least one feature card', async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: 'en' }) })
    render(jsx)
    expect(screen.getByRole('heading', { name: 'Track everything that moves' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Live Tracking' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/[locale]/page.test.tsx`
Expected: FAIL — placeholder `HomePage` doesn't accept `params` or render this content

- [ ] **Step 3: Implement `app/[locale]/page.tsx`**

```tsx
import { getHomePage, getFeatures } from '@/sanity/queries'
import { getLocalized } from '@/lib/i18n-utils'
import type { Locale } from '@/i18n/routing'
import { MarqueeTicker } from '@/components/ui/MarqueeTicker'
import { FeatureCard } from '@/components/ui/FeatureCard'
import { DotGridBackground } from '@/components/ui/DotGridBackground'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const typedLocale = locale as Locale

  const [homePage, features] = await Promise.all([getHomePage(), getFeatures()])

  return (
    <div className="relative">
      <DotGridBackground variant="world" />
      <section className="relative px-6 py-24">
        <h1 className="text-5xl font-bold text-foreground">
          {getLocalized(homePage.heroHeadline, typedLocale)}
        </h1>
        <p className="mt-4 text-xl text-muted">
          {getLocalized(homePage.heroSubheadline, typedLocale)}
        </p>
      </section>
      <MarqueeTicker items={homePage.marqueeKeywords} />
      <section className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-3">
        {features.map((feature, i) => (
          <FeatureCard
            key={feature._id}
            number={String(i + 1).padStart(2, '0')}
            title={getLocalized(feature.title, typedLocale)}
            description={getLocalized(feature.description, typedLocale)}
          />
        ))}
      </section>
      <section className="px-6 py-16">
        <p className="text-lg text-muted">{getLocalized(homePage.aboutTeaser, typedLocale)}</p>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/[locale]/page.test.tsx`
Expected: PASS — 1 passed

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/page.tsx app/[locale]/page.test.tsx
git commit -m "feat: assemble home page from Sanity content"
```

---

### Task 11: Hardware Page Assembly

**Files:**
- Create: `app/[locale]/hardware/page.tsx`
- Test: `app/[locale]/hardware/page.test.tsx`

**Interfaces:**
- Consumes: `getHardwareProducts`, `getSiteSettings` from `sanity/queries.ts`; `getLocalized`; `HardwareCard` component
- Produces: the rendered `/[locale]/hardware` route, linked to from `Header` (Task 9) and the Home page's hardware teaser (not a separate task — Task 10's design intentionally kept the teaser text-only; add a link if desired during review)

- [ ] **Step 1: Write the failing test**

Create `app/[locale]/hardware/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HardwarePage from './page'

vi.mock('@/sanity/queries', () => ({
  getHardwareProducts: vi.fn().mockResolvedValue([
    {
      _id: '1',
      order: 1,
      name: { en: 'TrackerX1', ar: 'تراكر إكس 1' },
      description: { en: 'Rugged GPS tracker.', ar: 'جهاز تتبع قوي.' },
      images: ['https://cdn.sanity.io/trackerx1.jpg'],
      specs: [{ label: { en: 'Battery', ar: 'البطارية' }, value: { en: '5000mAh', ar: '٥٠٠٠ مللي أمبير' } }],
    },
  ]),
  getSiteSettings: vi.fn().mockResolvedValue({ whatsappNumber: '+961 3 123 456' }),
}))

describe('HardwarePage', () => {
  it('renders one HardwareCard per product with no price text', async () => {
    const jsx = await HardwarePage({ params: Promise.resolve({ locale: 'en' }) })
    render(jsx)
    expect(screen.getByRole('heading', { name: 'TrackerX1' })).toBeInTheDocument()
    expect(screen.getByText('Battery')).toBeInTheDocument()
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/[locale]/hardware/page.test.tsx`
Expected: FAIL — `Cannot find module './page'` (directory doesn't exist yet)

- [ ] **Step 3: Implement `app/[locale]/hardware/page.tsx`**

```tsx
import { getHardwareProducts, getSiteSettings } from '@/sanity/queries'
import { getLocalized } from '@/lib/i18n-utils'
import type { Locale } from '@/i18n/routing'
import { HardwareCard } from '@/components/ui/HardwareCard'
import { getTranslations } from 'next-intl/server'

export default async function HardwarePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const typedLocale = locale as Locale

  const [products, siteSettings, t] = await Promise.all([
    getHardwareProducts(),
    getSiteSettings(),
    getTranslations('hardware'),
  ])

  return (
    <section className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-3">
      {products.map((product) => (
        <HardwareCard
          key={product._id}
          name={getLocalized(product.name, typedLocale)}
          description={getLocalized(product.description, typedLocale)}
          images={product.images}
          specs={product.specs.map((spec) => ({
            label: getLocalized(spec.label, typedLocale),
            value: getLocalized(spec.value, typedLocale),
          }))}
          whatsappNumber={siteSettings.whatsappNumber}
          requestQuoteLabel={t('requestQuote')}
        />
      ))}
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/[locale]/hardware/page.test.tsx`
Expected: PASS — 1 passed

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/hardware
git commit -m "feat: assemble hardware catalog page from Sanity content"
```

---

### Task 12: About Page Assembly

**Files:**
- Create: `app/[locale]/about/page.tsx`
- Test: `app/[locale]/about/page.test.tsx`

**Interfaces:**
- Consumes: `getAboutPage` from `sanity/queries.ts`; `getLocalized`; `DotGridBackground`
- Produces: the rendered `/[locale]/about` route, linked to from `Header` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `app/[locale]/about/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from './page'

vi.mock('@/sanity/queries', () => ({
  getAboutPage: vi.fn().mockResolvedValue({
    story: { en: 'TrackWay started to make tracking simple.', ar: 'بدأت TrackWay لجعل التتبع بسيطًا.' },
    imageUrl: 'https://cdn.sanity.io/about.jpg',
  }),
}))

describe('AboutPage', () => {
  it('renders the localized story text', async () => {
    const jsx = await AboutPage({ params: Promise.resolve({ locale: 'en' }) })
    render(jsx)
    expect(screen.getByText('TrackWay started to make tracking simple.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/[locale]/about/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Implement `app/[locale]/about/page.tsx`**

```tsx
import Image from 'next/image'
import { getAboutPage } from '@/sanity/queries'
import { getLocalized } from '@/lib/i18n-utils'
import type { Locale } from '@/i18n/routing'
import { DotGridBackground } from '@/components/ui/DotGridBackground'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const typedLocale = locale as Locale
  const aboutPage = await getAboutPage()

  return (
    <div className="relative px-6 py-24">
      <DotGridBackground variant="streets" />
      {aboutPage.imageUrl && (
        <div className="relative mb-8 h-64 w-full">
          <Image src={aboutPage.imageUrl} alt="" fill className="object-cover" />
        </div>
      )}
      <p className="relative text-lg text-muted">{getLocalized(aboutPage.story, typedLocale)}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/[locale]/about/page.test.tsx`
Expected: PASS — 1 passed

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/about
git commit -m "feat: assemble about page from Sanity content"
```

---

### Task 13: Contact Page, `ContactForm` Component & On-Demand Revalidation

**Files:**
- Create: `components/ui/ContactForm.tsx`, `app/[locale]/contact/page.tsx`, `app/api/revalidate/route.ts`
- Test: `components/ui/ContactForm.test.tsx`, `app/[locale]/contact/page.test.tsx`, `app/api/revalidate/route.test.ts`

**Interfaces:**
- Consumes: `buildWhatsAppLink`, `buildMailtoLink` from `lib/contact-links.ts`; `getSiteSettings` from `sanity/queries.ts`
- Produces: the rendered `/[locale]/contact` route, linked to from `Header` (Task 9); `POST /api/revalidate` endpoint for the Sanity webhook (referenced in the spec's deployment section)

- [ ] **Step 1: Write the failing test for `ContactForm`**

Create `components/ui/ContactForm.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ContactForm } from './ContactForm'

const messages = {
  contact: {
    sendWhatsApp: 'Send via WhatsApp',
    sendEmail: 'Send via Email',
    nameLabel: 'Name',
    messageLabel: 'Message',
  },
}

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContactForm whatsappNumber="+961 3 123 456" email="info@trackway.com" />
    </NextIntlClientProvider>,
  )
}

describe('ContactForm', () => {
  it('builds a WhatsApp link that includes the typed name and message', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Name'), 'Nadia')
    await user.type(screen.getByLabelText('Message'), 'I need a fleet quote')
    const link = screen.getByRole('link', { name: 'Send via WhatsApp' })
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/9613123456?text='))
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Nadia')
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('I need a fleet quote')
  })

  it('builds a mailto link with the typed name and message', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Name'), 'Nadia')
    await user.type(screen.getByLabelText('Message'), 'I need a fleet quote')
    const link = screen.getByRole('link', { name: 'Send via Email' })
    expect(link).toHaveAttribute('href', expect.stringContaining('mailto:info@trackway.com?subject='))
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Nadia')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/ContactForm.test.tsx`
Expected: FAIL — `Cannot find module './ContactForm'`

- [ ] **Step 3: Implement `components/ui/ContactForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { buildWhatsAppLink, buildMailtoLink } from '@/lib/contact-links'

interface ContactFormProps {
  whatsappNumber: string
  email: string
}

export function ContactForm({ whatsappNumber, email }: ContactFormProps) {
  const t = useTranslations('contact')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const composedMessage = `Name: ${name}\n${message}`
  const whatsappLink = buildWhatsAppLink(whatsappNumber, composedMessage)
  const mailtoLink = buildMailtoLink(email, `Inquiry from ${name || 'website visitor'}`, composedMessage)

  return (
    <form className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        {t('nameLabel')}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        {t('messageLabel')}
        <textarea
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <div className="flex gap-4">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-accent font-bold">
          {t('sendWhatsApp')}
        </a>
        <a href={mailtoLink} className="text-accent font-bold">
          {t('sendEmail')}
        </a>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/ContactForm.test.tsx`
Expected: PASS — 2 passed

- [ ] **Step 5: Write the failing test for the contact page**

Create `app/[locale]/contact/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactPage from './page'

vi.mock('@/sanity/queries', () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    phoneNumbers: ['+961 3 123 456'],
    whatsappNumber: '+961 3 123 456',
    email: 'info@trackway.com',
    socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/trackway' }],
    address: { en: 'Beirut, Lebanon', ar: 'بيروت، لبنان' },
  }),
}))

describe('ContactPage', () => {
  it('renders the phone number, email, and the contact form', async () => {
    const jsx = await ContactPage({ params: Promise.resolve({ locale: 'en' }) })
    render(jsx)
    expect(screen.getByRole('link', { name: '+961 3 123 456' })).toHaveAttribute(
      'href',
      'tel:+961 3 123 456',
    )
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run app/[locale]/contact/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 7: Implement `app/[locale]/contact/page.tsx`**

```tsx
import { getSiteSettings } from '@/sanity/queries'
import { getLocalized } from '@/lib/i18n-utils'
import type { Locale } from '@/i18n/routing'
import { ContactForm } from '@/components/ui/ContactForm'

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const typedLocale = locale as Locale
  const siteSettings = await getSiteSettings()

  return (
    <section className="px-6 py-24">
      <p className="text-muted">{getLocalized(siteSettings.address, typedLocale)}</p>
      <div className="mt-2 flex flex-col gap-1">
        {siteSettings.phoneNumbers.map((phone) => (
          <a key={phone} href={`tel:${phone}`}>
            {phone}
          </a>
        ))}
        <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
      </div>
      <div className="mt-2 flex gap-4">
        {siteSettings.socialLinks.map((link) => (
          <a key={link.platform} href={link.url} aria-label={link.platform}>
            {link.platform}
          </a>
        ))}
      </div>
      <div className="mt-8 max-w-md">
        <ContactForm whatsappNumber={siteSettings.whatsappNumber} email={siteSettings.email} />
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run app/[locale]/contact/page.test.tsx`
Expected: PASS — 1 passed

- [ ] **Step 9: Write the failing test for the revalidation route**

Create `app/api/revalidate/route.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { POST } from './route'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const originalEnv = process.env.SANITY_REVALIDATE_SECRET

describe('POST /api/revalidate', () => {
  beforeEachSecret('test-secret')

  it('rejects requests with a missing or wrong secret', async () => {
    const request = new Request('http://localhost/api/revalidate', {
      method: 'POST',
      headers: { 'x-webhook-secret': 'wrong' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates the root locale paths when the secret matches', async () => {
    const request = new Request('http://localhost/api/revalidate', {
      method: 'POST',
      headers: { 'x-webhook-secret': 'test-secret' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(revalidatePath).toHaveBeenCalledWith('/en')
    expect(revalidatePath).toHaveBeenCalledWith('/ar')
  })

  function beforeEachSecret(secret: string) {
    process.env.SANITY_REVALIDATE_SECRET = secret
  }
})

afterAll(() => {
  process.env.SANITY_REVALIDATE_SECRET = originalEnv
})
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `npx vitest run app/api/revalidate/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 11: Implement `app/api/revalidate/route.ts`**

```ts
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret')

  if (!secret || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false }, { status: 401 })
  }

  revalidatePath('/en')
  revalidatePath('/ar')

  return NextResponse.json({ revalidated: true })
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `npx vitest run app/api/revalidate/route.test.ts`
Expected: PASS — 2 passed

- [ ] **Step 13: Commit**

```bash
git add components/ui/ContactForm.tsx components/ui/ContactForm.test.tsx app/[locale]/contact app/api/revalidate
git commit -m "feat: add contact page, ContactForm, and Sanity webhook revalidation route"
```

---

### Task 14: SEO Metadata, Full E2E Smoke Suite & Deployment Docs

**Files:**
- Modify: `app/[locale]/page.tsx`, `app/[locale]/hardware/page.tsx`, `app/[locale]/about/page.tsx` (add `generateMetadata`)
- Create: `e2e/pages-smoke.spec.ts`, `.env.example`, `README.md`
- Test: `e2e/pages-smoke.spec.ts` (the smoke suite itself is the test for this task)

**Interfaces:**
- Consumes: `getHomePage`, `getAboutPage` from `sanity/queries.ts`; `getLocalized`
- Produces: nothing new consumed by later tasks — this is the final task.

- [ ] **Step 1: Add `generateMetadata` to the home page**

Modify `app/[locale]/page.tsx` — add above the default export:

```tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const typedLocale = locale as Locale
  const homePage = await getHomePage()
  return {
    title: getLocalized(homePage.seoTitle, typedLocale),
    description: getLocalized(homePage.seoDescription, typedLocale),
  }
}
```

- [ ] **Step 2: Add `generateMetadata` to the hardware page**

Modify `app/[locale]/hardware/page.tsx` — add above the default export:

```tsx
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'GPS Hardware — TrackWay',
    description: 'Explore TrackWay’s GPS tracking hardware for fleets and individuals.',
  }
}
```

- [ ] **Step 3: Add `generateMetadata` to the about page**

Modify `app/[locale]/about/page.tsx` — add above the default export:

```tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const typedLocale = locale as Locale
  const aboutPage = await getAboutPage()
  return {
    title: getLocalized(aboutPage.seoTitle, typedLocale),
    description: getLocalized(aboutPage.seoDescription, typedLocale),
  }
}
```

- [ ] **Step 4: Write the failing e2e smoke suite**

Create `e2e/pages-smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const locales = ['en', 'ar']
const routes = ['', '/hardware', '/about', '/contact']

for (const locale of locales) {
  for (const route of routes) {
    test(`/${locale}${route} loads with no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      const response = await page.goto(`/${locale}${route}`)
      expect(response?.status()).toBeLessThan(400)
      expect(errors).toEqual([])
    })
  }
}
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx playwright test e2e/pages-smoke.spec.ts`
Expected: FAIL initially if any route 404s or throws — read the output and fix the specific broken route before proceeding (do not silence console errors; fix their root cause)

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx playwright test e2e/pages-smoke.spec.ts`
Expected: PASS — 8 passed (4 routes × 2 locales)

- [ ] **Step 7: Create `.env.example`**

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
SANITY_REVALIDATE_SECRET=
```

- [ ] **Step 8: Create `README.md` with setup and deployment notes**

```markdown
# TrackWay Website

Bilingual (EN/AR) marketing site for TrackWay's GPS tracking hardware and
software, built with Next.js, next-intl, and Sanity.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Sanity project ID,
   dataset, and API token.
3. `npm run dev` — site at http://localhost:3000, Sanity Studio at
   http://localhost:3000/studio
4. `npm test` — unit/component tests (Vitest)
5. `npm run test:e2e` — end-to-end tests (Playwright, builds and serves
   the app first)

## Deployment (Vercel)

1. Connect this repo to a Vercel project.
2. Set the same env vars from `.env.example` in the Vercel project
   settings.
3. In Sanity's project dashboard, add a webhook pointing to
   `https://<your-domain>/api/revalidate` with header
   `x-webhook-secret: <SANITY_REVALIDATE_SECRET>`, triggered on document
   publish — this keeps pages fresh without waiting for a timed
   revalidation window.

## Before calling any page done

- Test at 375px viewport before 1440px
- Test every page at both `/en` and `/ar` (RTL)
- Run Lighthouse and confirm LCP < 2.5s, CLS < 0.1
- Confirm no price is displayed anywhere on the site
```

- [ ] **Step 9: Commit**

```bash
git add app/[locale]/page.tsx app/[locale]/hardware/page.tsx app/[locale]/about/page.tsx e2e/pages-smoke.spec.ts .env.example README.md
git commit -m "feat: add SEO metadata, full e2e smoke suite, and deployment docs"
```

---

## Self-Review Notes

- **Spec coverage:** Sections 3 (routing/ISR) → Task 2; Section 4 (visual system) → Tasks 1, 5, 6; Section 5 (content model, no public pricing) → Task 3, enforced in Task 7's test; Section 6 (pages) → Tasks 10–13; Section 7 (components) → Tasks 5–9, 13; Section 8 (i18n mechanics) → Tasks 2, 4; Section 9 (deployment) → Task 13 (revalidate route), Task 14 (env/docs); Section 10 (acceptance bar) → called out in Global Constraints and Task 14's README checklist; Section 11 (out of scope) → no task builds any of it.
- **Type consistency verified:** `Locale` (Task 2) is imported identically in Tasks 4, 5–13. `LocalizedString`/`SiteSettings`/`HomePage`/`Feature`/`HardwareProduct`/`AboutPage` (Task 3) match the fields consumed in every page task. `getLocalized(field, locale)` signature (Task 4) is used consistently everywhere it's called. `buildWhatsAppLink(phone, message)` and `buildMailtoLink(email, subject, body)` (Task 4) match their call sites in Tasks 7, 8, 13.
- **No placeholders:** every step has real code; no "TBD"/"add validation"/"similar to Task N" shortcuts.
