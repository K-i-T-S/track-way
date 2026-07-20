import { defineField, defineType } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  fields: [
    defineField({
      name: "story",
      title: "Story",
      type: "object",
      fields: [
        { name: "en", type: "text" },
        { name: "ar", type: "text" },
      ],
    }),
    defineField({ name: "image", title: "Image", type: "image" }),
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "object",
      fields: [
        { name: "en", type: "string" },
        { name: "ar", type: "string" },
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "object",
      fields: [
        { name: "en", type: "text" },
        { name: "ar", type: "text" },
      ],
    }),
  ],
});
