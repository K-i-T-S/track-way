import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "./Header";

const mockUsePathname = vi.fn();

// Mock our thin next-intl/navigation wrapper directly rather than the
// underlying next/navigation module: next-intl's dist files import
// next/navigation internally, and Vitest's SSR dep externalization for
// node_modules packages does not reliably intercept those nested imports
// (verified: a vi.mock('next/navigation', ...) here is never invoked when
// the call originates from inside next-intl's bundle, but mocking our own
// @/i18n/navigation module — which Vite always transforms — works
// reliably). usePathname() from @/i18n/navigation already returns the
// locale-stripped path (e.g. '/hardware'), matching its real contract.
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const messages = {
  nav: {
    home: "Home",
    hardware: "Hardware",
    about: "About",
    contact: "Contact",
    contactCta: "Contact Us",
  },
};

function renderHeader(locale: "en" | "ar", pathnameWithoutLocale: string) {
  mockUsePathname.mockReturnValue(pathnameWithoutLocale);
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header locale={locale} logoUrl="https://cdn.sanity.io/logo.png" />
    </NextIntlClientProvider>,
  );
}

describe("Header", () => {
  it("renders all nav links with localized labels", () => {
    renderHeader("en", "/");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByRole("link", { name: "Hardware" })).toHaveAttribute(
      "href",
      "/en/hardware",
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/en/about",
    );
    expect(screen.getByRole("link", { name: "Contact Us" })).toHaveAttribute(
      "href",
      "/en/contact",
    );
  });

  it("the locale switcher swaps only the locale segment, preserving the rest of the path", () => {
    renderHeader("en", "/hardware");
    expect(
      screen.getByRole("link", { name: /العربية|arabic/i }),
    ).toHaveAttribute("href", "/ar/hardware");
  });
});
