import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      description: "Upload the TrackWay logo (SVG preferred). Fallback: /brand/svg/trackway-logo-primary-no-tagline.svg",
    }),
    defineField({
      name: "phoneNumbers",
      title: "Phone Numbers",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp Number",
      type: "string",
    }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "platform", type: "string" },
            { name: "url", type: "url" },
          ],
        },
      ],
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "object",
      fields: [
        { name: "en", type: "string" },
        { name: "ar", type: "string" },
      ],
    }),
    defineField({
      name: "footerText",
      title: "Footer Text",
      type: "object",
      fields: [
        { name: "en", type: "text" },
        { name: "ar", type: "text" },
      ],
    }),
  ],
});
