import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  // This checkout is a git worktree nested inside the main repo, which has
  // its own package-lock.json — Next.js's automatic workspace-root
  // detection walks up and finds both, so it must be pinned explicitly.
  outputFileTracingRoot: path.join(__dirname),
};

export default withNextIntl(nextConfig);
