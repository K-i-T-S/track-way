import { defineField, defineType } from "sanity";

export const hardwareProduct = defineType({
  name: "hardwareProduct",
  title: "Hardware Product",
  type: "document",
  fields: [
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({
      name: "name",
      title: "Name",
      type: "object",
      fields: [
        { name: "en", type: "string" },
        { name: "ar", type: "string" },
      ],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "object",
      fields: [
        { name: "en", type: "text" },
        { name: "ar", type: "text" },
      ],
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image" }],
    }),
    defineField({
      name: "specs",
      title: "Specs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              type: "object",
              fields: [
                { name: "en", type: "string" },
                { name: "ar", type: "string" },
              ],
            },
            {
              name: "value",
              type: "object",
              fields: [
                { name: "en", type: "string" },
                { name: "ar", type: "string" },
              ],
            },
          ],
        },
      ],
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
