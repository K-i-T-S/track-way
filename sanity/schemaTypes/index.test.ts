import { describe, it, expect } from "vitest";
import { schemaTypes } from "./index";

describe("schemaTypes", () => {
  it("registers exactly the five expected content types", () => {
    const names = schemaTypes.map((s) => s.name).sort();
    expect(names).toEqual(
      [
        "aboutPage",
        "feature",
        "hardwareProduct",
        "homePage",
        "siteSettings",
      ].sort(),
    );
  });

  it("gives feature and hardwareProduct an order field for manual sorting", () => {
    const feature = schemaTypes.find((s) => s.name === "feature")!;
    const hardwareProduct = schemaTypes.find(
      (s) => s.name === "hardwareProduct",
    )!;
    if (feature.type !== "document" || hardwareProduct.type !== "document") {
      throw new Error(
        "Expected feature and hardwareProduct to be document schema types",
      );
    }
    expect(feature.fields.some((f) => f.name === "order")).toBe(true);
    expect(hardwareProduct.fields.some((f) => f.name === "order")).toBe(true);
  });

  it("gives feature a fixed set of icon options matching the 9 Key Capabilities", () => {
    const feature = schemaTypes.find((s) => s.name === "feature")!;
    if (feature.type !== "document") {
      throw new Error("Expected feature to be a document schema type");
    }
    const iconField = feature.fields.find((f) => f.name === "icon") as
      { options?: { list?: Array<string | { value: string }> } } | undefined;
    expect(iconField).toBeDefined();
    const values = (iconField?.options?.list ?? []).map((opt) =>
      typeof opt === "string" ? opt : opt.value,
    );
    expect(values.sort()).toEqual(
      [
        "live-tracking",
        "trip-history",
        "speed-alerts",
        "geofencing",
        "ignition-alerts",
        "movement-alerts",
        "engine-control",
        "fleet-reports",
        "multi-vehicle",
      ].sort(),
    );
  });
});
