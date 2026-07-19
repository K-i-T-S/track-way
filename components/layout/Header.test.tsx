import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "./Header";

const messages = {
  nav: {
    home: "Home",
    hardware: "Hardware",
    about: "About",
    contact: "Contact",
    contactCta: "Contact Us",
  },
};

function renderHeader(locale: "en" | "ar", pathname: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header
        locale={locale}
        pathname={pathname}
        logoUrl="https://cdn.sanity.io/logo.png"
      />
    </NextIntlClientProvider>,
  );
}

describe("Header", () => {
  it("renders all nav links with localized labels", () => {
    renderHeader("en", "/en");
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
    renderHeader("en", "/en/hardware");
    expect(
      screen.getByRole("link", { name: /العربية|arabic/i }),
    ).toHaveAttribute("href", "/ar/hardware");
  });
});
