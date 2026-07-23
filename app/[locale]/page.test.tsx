import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HomePage from "./page";

// next-intl/server's getTranslations relies on Next.js' RSC request context
// (AsyncLocalStorage), which doesn't exist under Vitest's jsdom environment.
// Mock it the same way the hardware page test mocks it.
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      hardwareTeaser:
        "Explore our GPS tracking hardware built for fleets and individuals.",
      viewHardwareCta: "View Hardware",
      getInTouchCta: "Get in Touch",
    };
    return translations[key] ?? key;
  }),
}));

vi.mock("@/sanity/queries", () => ({
  getHomePage: vi.fn().mockResolvedValue({
    heroHeadline: { en: "Track everything that moves", ar: "تتبع كل ما يتحرك" },
    heroSubheadline: {
      en: "GPS for fleets and individuals.",
      ar: "نظام تتبع للأساطيل والأفراد.",
    },
    marqueeKeywords: ["LIVE TRACKING", "FLEET MANAGEMENT"],
    aboutTeaser: { en: "We are TrackWay.", ar: "نحن TrackWay." },
    contactCtaText: { en: "Get in touch", ar: "تواصل معنا" },
  }),
  getFeatures: vi.fn().mockResolvedValue([
    {
      _id: "1",
      order: 1,
      title: { en: "Live Tracking", ar: "تتبع مباشر" },
      description: {
        en: "Real-time location.",
        ar: "الموقع في الوقت الفعلي.",
      },
      icon: "live-tracking",
    },
  ]),
}));

describe("HomePage", () => {
  it("renders the localized hero headline and at least one feature card", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {jsx}
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Track everything that moves" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Live Tracking" }),
    ).toBeInTheDocument();
  });

  it("renders a hardware teaser link to /hardware and the contact CTA text", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {jsx}
      </NextIntlClientProvider>,
    );
    const hardwareLink = screen.getByRole("link", { name: "View Hardware" });
    expect(hardwareLink).toHaveAttribute("href", "/en/hardware");

    expect(screen.getByText("Get in touch")).toBeInTheDocument();
    const contactLink = screen.getByRole("link", { name: "Get in Touch" });
    expect(contactLink).toHaveAttribute("href", "/en/contact");
  });

  it("renders the capability icon for each feature that has one", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={{}}>
        {jsx}
      </NextIntlClientProvider>,
    );
    const featureHeading = screen.getByRole("heading", {
      name: "Live Tracking",
    });
    const card = featureHeading.closest("div.group");
    expect(card?.querySelector("svg")).not.toBeNull();
  });
});
