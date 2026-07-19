import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ContactPage from "./page";

vi.mock("@/sanity/queries", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    phoneNumbers: ["+961 3 123 456"],
    whatsappNumber: "+961 3 123 456",
    email: "info@trackway.com",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/trackway" },
    ],
    address: { en: "Beirut, Lebanon", ar: "بيروت، لبنان" },
  }),
}));

// ContactForm is a Client Component that calls useTranslations directly, so
// it needs a NextIntlClientProvider ancestor even though ContactPage itself
// is a Server Component under test.
const messages = {
  contact: {
    sendWhatsApp: "Send via WhatsApp",
    sendEmail: "Send via Email",
    nameLabel: "Name",
    messageLabel: "Message",
  },
};

describe("ContactPage", () => {
  it("renders the phone number, email, and the contact form", async () => {
    const jsx = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        {jsx}
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("link", { name: "+961 3 123 456" }),
    ).toHaveAttribute("href", "tel:+961 3 123 456");
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
