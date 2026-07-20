import { describe, it, expect } from "vitest";
import { getLocalized } from "./i18n-utils";

describe("getLocalized", () => {
  it('returns the English value for locale "en"', () => {
    expect(getLocalized({ en: "Hello", ar: "مرحبا" }, "en")).toBe("Hello");
  });

  it('returns the Arabic value for locale "ar"', () => {
    expect(getLocalized({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا");
  });

  it("falls back to English when the Arabic value is empty", () => {
    expect(getLocalized({ en: "Hello", ar: "" }, "ar")).toBe("Hello");
  });
});
