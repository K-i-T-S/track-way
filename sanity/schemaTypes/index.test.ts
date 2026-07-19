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
    expect((feature as any).fields.some((f: any) => f.name === "order")).toBe(
      true,
    );
    expect(
      (hardwareProduct as any).fields.some((f: any) => f.name === "order"),
    ).toBe(true);
  });
});
