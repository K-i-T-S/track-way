import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import HardwarePage, { generateMetadata } from "./page";

// next-intl/server's getTranslations relies on Next.js' RSC request context
// (AsyncLocalStorage), which doesn't exist under Vitest's jsdom environment.
// Mock it the same way the Sanity client is mocked below.
const hardwareMessages = {
  requestQuote: "Request a Quote",
  metaTitle: "GPS Hardware — TrackWay",
  metaDescription:
    "Explore TrackWay's GPS tracking hardware for fleets and individuals.",
  heroBadge: "Teltonika-Grade Devices",
  heroTitle: "GPS Tracking Hardware",
  heroSubtitle: "Professional-grade GPS trackers.",
};

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    return hardwareMessages[key as keyof typeof hardwareMessages] ?? key;
  }),
}));

vi.mock("@/sanity/queries", () => ({
  getHardwareProducts: vi.fn().mockResolvedValue([
    {
      _id: "1",
      order: 1,
      name: { en: "TrackerX1", ar: "تراكر إكس 1" },
      description: { en: "Rugged GPS tracker.", ar: "جهاز تتبع قوي." },
      images: ["https://cdn.sanity.io/trackerx1.jpg"],
      specs: [
        {
          label: { en: "Battery", ar: "البطارية" },
          value: { en: "5000mAh", ar: "٥٠٠٠ مللي أمبير" },
        },
      ],
    },
  ]),
  getSiteSettings: vi
    .fn()
    .mockResolvedValue({ whatsappNumber: "+961 3 123 456" }),
}));

function renderHardwarePage(jsx: React.ReactElement) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ hardware: hardwareMessages }}
    >
      {jsx}
    </NextIntlClientProvider>,
  );
}

describe("HardwarePage", () => {
  it("renders one product showcase per Sanity product with no price text", async () => {
    const jsx = await HardwarePage({
      params: Promise.resolve({ locale: "en" }),
    });
    renderHardwarePage(jsx);
    expect(
      screen.getByRole("heading", { name: "TrackerX1" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Battery")).toBeInTheDocument();
    expect(screen.getByText("Request a Quote")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("returns locale-aware metadata instead of a hardcoded English title", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(metadata.title).toBe("GPS Hardware — TrackWay");
    expect(metadata.description).toBe(
      "Explore TrackWay's GPS tracking hardware for fleets and individuals.",
    );
  });
});
