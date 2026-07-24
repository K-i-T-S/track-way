import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/home/GlobeHeroBackground", () => ({
  GlobeHeroBackground: () => <div data-testid="mock-globe-background" />,
}));

describe("HeroSection", () => {
  it("renders the headline, subheadline, and primary CTA", () => {
    render(
      <HeroSection locale="en" headline="Track everything" subheadline="Fleet visibility for Lebanon" />,
    );
    expect(screen.getByText("Track everything")).toBeInTheDocument();
    expect(screen.getByText("Fleet visibility for Lebanon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /heroCtaPrimary/i })).toHaveAttribute(
      "href",
      "/en/book-installation",
    );
  });
});
