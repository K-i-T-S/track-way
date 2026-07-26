import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Feature } from "@/sanity/types";
import { ServiceCarousel } from "./ServiceCarousel";

const homepageMessages = {
  servicesEyebrow: "What We Offer",
  servicesTitle: "Powering Your Fleet",
  servicesSubtitle: "Services subtitle.",
};

const FEATURES: Feature[] = [
  {
    _id: "1",
    order: 1,
    title: { en: "Live Tracking", ar: "تتبع مباشر" },
    description: { en: "Real-time location.", ar: "الموقع في الوقت الفعلي." },
    icon: "live-tracking",
  },
  {
    _id: "2",
    order: 2,
    title: { en: "Geofencing", ar: "سياج جغرافي" },
    description: { en: "Virtual boundaries.", ar: "حدود افتراضية." },
    icon: "geofencing",
  },
];

function renderCarousel(locale: "en" | "ar", features: Feature[] = FEATURES) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ homepage: homepageMessages }}
    >
      <ServiceCarousel features={features} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("ServiceCarousel", () => {
  it("renders the localized title and description for every feature", () => {
    renderCarousel("en");
    expect(
      screen.getByRole("heading", { name: "Live Tracking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Real-time location.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Geofencing" }),
    ).toBeInTheDocument();
  });

  it("renders the Arabic translation when locale is ar", () => {
    renderCarousel("ar");
    expect(
      screen.getByRole("heading", { name: "تتبع مباشر" }),
    ).toBeInTheDocument();
  });

  it("renders one navigation dot per feature", () => {
    renderCarousel("en");
    expect(
      screen.getAllByRole("button", { name: "Live Tracking" }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Geofencing" })).toHaveLength(
      1,
    );
  });

  it("renders a decorative, non-interactive icon for each card", () => {
    renderCarousel("en");
    const heading = screen.getByRole("heading", { name: "Live Tracking" });
    const card = heading.closest("div.group");
    const icon = card?.querySelector("svg[aria-hidden='true']");
    expect(icon).not.toBeNull();
  });

  it("renders nothing when there are no features", () => {
    const { container } = renderCarousel("en", []);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not crash when the user prefers reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    expect(() => renderCarousel("en")).not.toThrow();
  });
});
