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
});
