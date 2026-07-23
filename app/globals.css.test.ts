import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("globals.css", () => {
  it("disables animations and transitions when the user prefers reduced motion", () => {
    const css = readFileSync(join(__dirname, "globals.css"), "utf-8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation-duration: 0.01ms");
    expect(css).toContain("transition-duration: 0.01ms");
  });
});
