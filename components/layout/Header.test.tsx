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
    bookInstallation: "Book an Installation",
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

  it("shows both language labels, marks the current one, and links to the other", () => {
    renderHeader("en", "/hardware");
    expect(screen.getByText("EN")).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "العربية" })).toHaveAttribute(
      "href",
      "/ar/hardware",
    );
  });

  it("marks Arabic as current on the Arabic site and links back to English", () => {
    renderHeader("ar", "/hardware");
    expect(screen.getByText("العربية")).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute(
      "href",
      "/en/hardware",
    );
  });

  it("renders a prominent Book an Installation CTA linking to /book-installation", () => {
    renderHeader("en", "/");
    expect(
      screen.getByRole("link", { name: "Book an Installation" }),
    ).toHaveAttribute("href", "/en/book-installation");
  });
});
