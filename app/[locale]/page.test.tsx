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

const homepageMessages = {
  heroBadge: "Live Vehicle Tracking",
  heroCtaPrimary: "Book an Installation",
  heroCtaSecondary: "See How It Works",
  heroFloatingA: "Vehicle #4 · En Route",
  heroFloatingB: "Geofence Alert Cleared",
  scrollHint: "Scroll",
  coreValueEyebrow: "Why TrackWay",
  coreValueTitle: "Built for how Lebanon actually drives",
  coreValueIntro: "Intro copy.",
  coreValue1Title: "Reliable Tracking Technology",
  coreValue1Desc: "Desc 1",
  coreValue2Title: "Advanced Fleet Software",
  coreValue2Desc: "Desc 2",
  coreValue3Title: "Flexible Installation",
  coreValue3Desc: "Desc 3",
  industriesEyebrow: "Who We Serve",
  industriesTitle: "One platform, every kind of fleet",
  industriesFleets: "Transportation Fleets",
  industriesRental: "Car-Rental Companies",
  industriesDelivery: "Delivery Fleets",
  industriesSchool: "School Transportation",
  industriesPrivate: "Private Vehicles",
  controlRoomEyebrow: "Fleet Control",
  controlRoomTitle: "Your fleet, watched over around the clock",
  controlRoomBody: "Control room body.",
  howItWorksEyebrow: "How It Works",
  howItWorksTitle: "From installation to insight in three steps",
  howItWorksNotice:
    "Submitting a preferred date does not automatically confirm the appointment.",
  howItWorksStep1Title: "Submit Your Details",
  howItWorksStep1Desc: "Step 1 desc",
  howItWorksStep2Title: "Continue via WhatsApp or Email",
  howItWorksStep2Desc: "Step 2 desc",
  howItWorksStep3Title: "Confirm Installation",
  howItWorksStep3Desc: "Step 3 desc",
  finalCtaTitle: "Ready to take control of your vehicles?",
  finalCtaPrimary: "Book an Installation",
  finalCtaSecondary: "Talk to Us",
};

function renderHomePage(jsx: React.ReactElement) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ homepage: homepageMessages }}
    >
      {jsx}
    </NextIntlClientProvider>,
  );
}

describe("HomePage", () => {
  it("renders the localized hero headline and at least one feature card", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    renderHomePage(jsx);
    expect(
      screen.getByRole("heading", { name: "Track everything that moves" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Live Tracking" }),
    ).toBeInTheDocument();
  });

  it("renders a hardware teaser link to /hardware and the final CTA linking to booking and contact", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    renderHomePage(jsx);
    const hardwareLink = screen.getByRole("link", { name: "View Hardware" });
    expect(hardwareLink).toHaveAttribute("href", "/en/hardware");

    expect(screen.getByText("Get in touch")).toBeInTheDocument();
    const bookingLinks = screen.getAllByRole("link", {
      name: /Book an Installation/,
    });
    expect(
      bookingLinks.some(
        (l) => l.getAttribute("href") === "/en/book-installation",
      ),
    ).toBe(true);
    const contactLink = screen.getByRole("link", { name: "Talk to Us" });
    expect(contactLink).toHaveAttribute("href", "/en/contact");
  });

  it("renders the capability icon for each feature that has one", async () => {
    const jsx = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    renderHomePage(jsx);
    const featureHeading = screen.getByRole("heading", {
      name: "Live Tracking",
    });
    const card = featureHeading.closest("div.group");
    expect(card?.querySelector("svg.h-8")).not.toBeNull();
  });
});
