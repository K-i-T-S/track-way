import { defineField, defineType } from "sanity";

const localizedString = (
  name: string,
  title: string,
  type: "string" | "text" = "string",
) => ({
  name,
  title,
  type: "object" as const,
  fields: [
    { name: "en", type },
    { name: "ar", type },
  ],
});

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      ...localizedString("heroHeadline", "Hero Headline"),
      description: "Default: GPS tracking and fleet management that keeps you in control.",
    }),
    defineField({
      ...localizedString("heroSubheadline", "Hero Subheadline", "text"),
      description: "Default: TrackWay combines reliable GPS hardware with smart fleet management software...",
    }),
    defineField({
      name: "marqueeKeywords",
      title: "Marquee Keywords",
      type: "array",
      of: [{ type: "string" }],
      description: "Keywords that scroll in the marquee ticker (e.g. GPS Tracking, Fleet Management, etc.)",
    }),
    defineField({
      ...localizedString("aboutTeaser", "About Teaser", "text"),
      description: "Short about text shown on homepage.",
    }),
    defineField({
      ...localizedString("contactCtaText", "Contact CTA Text", "text"),
      description: "Text for the final call-to-action section.",
    }),
    defineField({
      ...localizedString("seoTitle", "SEO Title"),
      description: "Default: TrackWay | GPS Tracking & Fleet Management in Lebanon",
    }),
    defineField({
      ...localizedString("seoDescription", "SEO Description", "text"),
      description: "Default: TrackWay provides GPS tracking hardware and fleet management software...",
    }),
  ],
});
