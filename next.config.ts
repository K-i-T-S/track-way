import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Framer Motion and GSAP drive this site's animation and set inline `style`
// attributes directly on DOM elements as their core mechanism (transforms,
// opacity) — style-src has to allow that or every animation breaks.
// Next.js's own RSC hydration also emits inline bootstrap scripts that
// aren't practical to hash statically, so script-src needs the same
// allowance. Tightening either to a nonce-based policy is real future work
// (needs a middleware.ts nonce + threading it through layout), not a
// same-pass change — everything else below is fully locked down.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://cdn.sanity.io",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Stop advertising the framework in responses (was `x-powered-by: Next.js`).
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  // This checkout is a git worktree nested inside the main repo, which has
  // its own package-lock.json — Next.js's automatic workspace-root
  // detection walks up and finds both, so it must be pinned explicitly.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        // Everything except Sanity Studio: its admin bundle needs a looser
        // policy (eval, websockets to api.sanity.io) that would otherwise
        // have to be carved out of the same rule and risks breaking the CMS.
        source: "/((?!studio).*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
