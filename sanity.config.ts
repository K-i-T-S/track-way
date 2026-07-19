import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { projectId, dataset, apiVersion } from "./sanity/env";

export default defineConfig({
  name: "trackway-studio",
  title: "TrackWay CMS",
  projectId,
  dataset,
  apiVersion,
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
