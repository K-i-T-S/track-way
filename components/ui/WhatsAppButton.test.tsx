import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { WhatsAppButton } from "./WhatsAppButton";

const messages = {
  whatsappButton: {
    ariaLabel: "Contact us on WhatsApp",
    tooltip: "Chat with us",
    message: "Hi, I'd like to know more about TrackWay's GPS solutions.",
  },
};

function renderWithLocale(locale: "en" | "ar") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <WhatsAppButton phoneNumber="+961 3 123 456" />
    </NextIntlClientProvider>,
  );
}

describe("WhatsAppButton", () => {
  it("links to the WhatsApp deep link for the given number", () => {
    renderWithLocale("en");
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/9613123456"),
    );
  });

  it("is fixed to the bottom-right in the ltr (English) locale", () => {
    renderWithLocale("en");
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveClass(
      "right-6",
    );
  });

  it("is fixed to the bottom-left in the rtl (Arabic) locale", () => {
    renderWithLocale("ar");
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveClass(
      "left-6",
    );
  });
});
