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
