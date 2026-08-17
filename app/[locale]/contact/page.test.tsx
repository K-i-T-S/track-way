import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ContactPage from "./page";

vi.mock("@/sanity/queries", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    phoneNumbers: ["+961 3 123 456"],
    whatsappNumber: "+961 3 123 456",
    emails: {
      info: "info@trackway.com",
      sales: "sales@trackway.com",
      support: "support@trackway.com",
    },
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/trackway" },
    ],
    address: { en: "Beirut, Lebanon", ar: "بيروت، لبنان" },
  }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      general: "General",
      sales: "Sales",
      support: "Support",
    };
    return translations[key] ?? key;
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
  it("renders the phone number, all three emails, and the contact form", async () => {
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
    ).toHaveAttribute("href", "tel:+9613123456");
    expect(
      screen.getByRole("link", { name: "info@trackway.com" }),
    ).toHaveAttribute("href", "mailto:info@trackway.com");
    expect(
      screen.getByRole("link", { name: "sales@trackway.com" }),
    ).toHaveAttribute("href", "mailto:sales@trackway.com");
    expect(
      screen.getByRole("link", { name: "support@trackway.com" }),
    ).toHaveAttribute("href", "mailto:support@trackway.com");
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
