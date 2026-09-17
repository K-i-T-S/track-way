import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://track-way.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Sanity Studio and internal API routes have nothing for a crawler to
      // index and shouldn't show up as indexable pages.
      disallow: ["/studio", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
