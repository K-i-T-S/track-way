import { defineField, defineType } from "sanity";

export const feature = defineType({
  name: "feature",
  title: "Feature",
  type: "document",
  fields: [
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({
      name: "title",
      title: "Title",
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
      name: "icon",
      title: "Icon",
      type: "string",
      description:
        "Used as a fallback badge when no photo is set below, and always used in the compact feature list.",
      options: {
        list: [
          { title: "Live Tracking", value: "live-tracking" },
          { title: "Trip History", value: "trip-history" },
          { title: "Speed Alerts", value: "speed-alerts" },
          { title: "Geofencing", value: "geofencing" },
          { title: "Ignition Alerts", value: "ignition-alerts" },
          { title: "Movement Alerts", value: "movement-alerts" },
          { title: "Engine Control", value: "engine-control" },
          { title: "Fleet Reports", value: "fleet-reports" },
          { title: "Multi-Vehicle Management", value: "multi-vehicle" },
        ],
      },
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      description:
        "Optional real photo. When set, the homepage carousel shows this as a photo banner instead of the icon badge.",
      options: { hotspot: true },
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
