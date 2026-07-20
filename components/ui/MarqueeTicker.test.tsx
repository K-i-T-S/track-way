import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MarqueeTicker } from "./MarqueeTicker";

function renderWithLocale(locale: "en" | "ar", items: string[]) {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <MarqueeTicker items={items} />
    </NextIntlClientProvider>,
  );
}

describe("MarqueeTicker", () => {
  it("renders every item text", () => {
    renderWithLocale("en", ["LIVE TRACKING", "FLEET MANAGEMENT"]);
    expect(screen.getAllByText("LIVE TRACKING").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FLEET MANAGEMENT").length).toBeGreaterThan(0);
  });

  it("scrolls left-to-right animation direction in the ltr (English) locale", () => {
    renderWithLocale("en", ["LIVE TRACKING"]);
    expect(screen.getByTestId("marquee-track")).toHaveClass(
      "animate-marquee-ltr",
    );
  });

  it("reverses the animation direction in the rtl (Arabic) locale", () => {
    renderWithLocale("ar", ["تتبع مباشر"]);
    expect(screen.getByTestId("marquee-track")).toHaveClass(
      "animate-marquee-rtl",
    );
  });
});
