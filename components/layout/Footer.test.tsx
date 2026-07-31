import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Footer } from "./Footer";

const messages = {
  footer: {
    quickLinks: "Quick Links",
    servingLebanon: "Serving customers throughout Lebanon.",
    privacyPolicy: "Privacy Policy",
    createdBy: "Created and maintained by",
  },
};

const siteSettings = {
  phoneNumbers: ["+961 3 123 456"],
  whatsappNumber: "+961 3 123 456",
  email: "info@trackway.com",
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/trackway" },
    { platform: "instagram", url: "https://instagram.com/trackway" },
    { platform: "linkedin", url: "https://linkedin.com/company/trackway" },
  ],
  addressText: "Beirut, Lebanon",
  footerText: "TrackWay: GPS tracking for everyone.",
};

describe("Footer", () => {
  it("renders phone, email, address, and social links", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Footer locale="en" siteSettings={siteSettings} />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("link", { name: "+961 3 123 456" }),
    ).toHaveAttribute("href", "tel:+961 3 123 456");
    expect(
      screen.getByRole("link", { name: "info@trackway.com" }),
    ).toHaveAttribute("href", "mailto:info@trackway.com");
    expect(screen.getByText("Beirut, Lebanon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /facebook/i })).toHaveAttribute(
      "href",
      "https://facebook.com/trackway",
    );
  });

  it("renders the Lebanon service line and a link to the Privacy Policy page", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Footer locale="en" siteSettings={siteSettings} />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByText("Serving customers throughout Lebanon."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/en/privacy");
  });

  it("renders the KiTS credit line with logo, WhatsApp, and email links", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Footer locale="en" siteSettings={siteSettings} />
      </NextIntlClientProvider>,
    );
    const creditLink = screen.getByRole("link", {
      name: /created and maintained by kits/i,
    });
    expect(creditLink).toHaveAttribute("href", "https://wa.me/96181290662");
    expect(creditLink.querySelector("img")).toHaveAttribute("alt", "KiTS");

    expect(
      screen.getByRole("link", { name: "kits.tech.co@gmail.com" }),
    ).toHaveAttribute("href", "mailto:kits.tech.co@gmail.com");
    expect(
      screen.getByRole("link", { name: "+961 81 290 662" }),
    ).toHaveAttribute("href", "https://wa.me/96181290662");
  });
});
