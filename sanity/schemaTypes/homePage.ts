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
    defineField(localizedString("heroHeadline", "Hero Headline")),
    defineField(localizedString("heroSubheadline", "Hero Subheadline", "text")),
    defineField({
      name: "marqueeKeywords",
      title: "Marquee Keywords",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField(localizedString("aboutTeaser", "About Teaser", "text")),
    defineField(localizedString("contactCtaText", "Contact CTA Text", "text")),
    defineField(localizedString("seoTitle", "SEO Title")),
    defineField(localizedString("seoDescription", "SEO Description", "text")),
  ],
});
