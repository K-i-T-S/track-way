import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HomePage from "./page";

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
});
