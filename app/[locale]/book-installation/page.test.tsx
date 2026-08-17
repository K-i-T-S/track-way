import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import BookInstallationPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      pageTitle: "Book an Installation",
      pageIntro:
        "Tell us about your company, fleet, and preferred installation date. Our team will confirm your appointment.",
    };
    return translations[key] ?? key;
  }),
}));

vi.mock("@/sanity/queries", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    whatsappNumber: "+961 3 123 456",
  }),
}));

const messages = {
  booking: {
    pageTitle: "Book an Installation",
    pageIntro:
      "Tell us about your company, fleet, and preferred installation date. Our team will confirm your appointment.",
    fullNameLabel: "Full Name",
    companyNameLabel: "Company Name",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    customerTypeLabel: "Customer Type",
    numVehiclesLabel: "Number of Vehicles",
    vehicleTypeLabel: "Vehicle Type",
    preferredAreaLabel: "Preferred Installation Area",
    preferredDateLabel: "Preferred Date",
    messageLabel: "Additional Message",
    selectPlaceholder: "Select an option",
    privacyNoticePrefix: "By submitting this form, you agree to our",
    continueWhatsApp: "Continue on WhatsApp",
    sendByEmail: "Send Request by Email",
    whatsappSuccess: "Whatsapp success",
    emailSuccess: "Email success",
    genericError: "Generic error",
    confirmationNotice:
      "Submitting a preferred date does not automatically confirm the appointment.",
    whatsappPreviewTitle: "Confirmation via WhatsApp",
    whatsappPreviewIntro:
      "Once you continue, our team will contact you on WhatsApp to confirm your details and schedule the installation.",
    whatsappPreviewLabel: "Your WhatsApp message preview",
    whatsappPreviewPlaceholder: "Fill in the form to preview your message.",
  },
  footer: { privacyPolicy: "Privacy Policy" },
};

describe("BookInstallationPage", () => {
  it("renders the real booking form with all its fields and the WhatsApp preview panel", async () => {
    const jsx = await BookInstallationPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        {jsx}
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Book an Installation" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Preferred Date")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue on WhatsApp" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Confirmation via WhatsApp" }),
    ).toBeInTheDocument();
  });
});
