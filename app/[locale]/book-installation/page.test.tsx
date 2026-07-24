import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BookInstallationPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      title: "Book an Installation",
      body: "Online booking is coming soon. In the meantime, message us on WhatsApp and our team will schedule your installation directly.",
      whatsappCta: "Continue on WhatsApp",
      whatsappMessage: "Hi, I'd like to book a GPS installation.",
    };
    return translations[key] ?? key;
  }),
}));

vi.mock("@/sanity/queries", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    whatsappNumber: "+961 3 123 456",
  }),
}));

describe("BookInstallationPage", () => {
  it("renders a heading, placeholder notice, and a WhatsApp link with the site's number", async () => {
    const jsx = await BookInstallationPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(jsx);
    expect(
      screen.getByRole("heading", { name: "Book an Installation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Online booking is coming soon/),
    ).toBeInTheDocument();
    const whatsappLink = screen.getByRole("link", {
      name: "Continue on WhatsApp",
    });
    expect(whatsappLink.getAttribute("href")).toContain(
      "https://wa.me/9613123456",
    );
  });
});
