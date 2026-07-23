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
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
