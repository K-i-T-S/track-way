import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { BookingForm } from "./BookingForm";

const submitBookingRequestMock = vi.fn();

vi.mock("@/app/[locale]/book-installation/actions", () => ({
  submitBookingRequest: (...args: unknown[]) =>
    submitBookingRequestMock(...args),
}));

const messages = {
  booking: {
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
    whatsappSuccess:
      "Your request has been saved. We've opened WhatsApp with your details pre-filled — please tap send to reach our team.",
    emailSuccess:
      "Your request has been received. Your preferred date is not yet confirmed. TrackWay will contact you through WhatsApp to confirm your appointment.",
    genericError: "We couldn't process your request. Please try again.",
  },
  footer: { privacyPolicy: "Privacy Policy" },
};

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BookingForm whatsappNumber="+961 70 857 877" locale="en" />
    </NextIntlClientProvider>,
  );
}

describe("BookingForm", () => {
  beforeEach(() => {
    submitBookingRequestMock.mockReset();
    vi.stubGlobal("open", vi.fn());
  });

  it("shows a validation error and does not call the server action when submitted empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(
      screen.getByRole("button", { name: "Continue on WhatsApp" }),
    );
    expect(
      await screen.findByText("Full name is required."),
    ).toBeInTheDocument();
    expect(submitBookingRequestMock).not.toHaveBeenCalled();
  });

  it("defaults Number of Vehicles to 1 when Private Vehicle Owner is selected", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(
      screen.getByLabelText("Customer Type"),
      "Private Vehicle Owner",
    );
    expect(screen.getByLabelText("Number of Vehicles")).toHaveValue(1);
  });

  it("opens WhatsApp only after a successful save", async () => {
    submitBookingRequestMock.mockResolvedValue({
      success: true,
      data: { id: "1" },
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Full Name"), "Nadia Khoury");
    await user.type(screen.getByLabelText("Phone Number"), "+961 3 123 456");
    await user.type(
      screen.getByLabelText("Email Address"),
      "nadia@khourylogistics.com",
    );
    await user.selectOptions(
      screen.getByLabelText("Customer Type"),
      "Private Vehicle Owner",
    );
    await user.selectOptions(screen.getByLabelText("Vehicle Type"), "Cars");
    await user.type(
      screen.getByLabelText("Preferred Installation Area"),
      "Beirut",
    );
    await user.type(screen.getByLabelText("Preferred Date"), "2099-01-01");
    await user.click(
      screen.getByRole("button", { name: "Continue on WhatsApp" }),
    );

    await waitFor(() => expect(window.open).toHaveBeenCalled());
    expect(
      await screen.findByText(
        "Your request has been saved. We've opened WhatsApp with your details pre-filled — please tap send to reach our team.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the server's honest error and does not open WhatsApp when the save fails", async () => {
    submitBookingRequestMock.mockResolvedValue({
      success: false,
      error: "We couldn't save your request. Please try again.",
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Full Name"), "Nadia Khoury");
    await user.type(screen.getByLabelText("Phone Number"), "+961 3 123 456");
    await user.type(
      screen.getByLabelText("Email Address"),
      "nadia@khourylogistics.com",
    );
    await user.selectOptions(
      screen.getByLabelText("Customer Type"),
      "Private Vehicle Owner",
    );
    await user.selectOptions(screen.getByLabelText("Vehicle Type"), "Cars");
    await user.type(
      screen.getByLabelText("Preferred Installation Area"),
      "Beirut",
    );
    await user.type(screen.getByLabelText("Preferred Date"), "2099-01-01");
    await user.click(
      screen.getByRole("button", { name: "Continue on WhatsApp" }),
    );

    expect(
      await screen.findByText(
        "We couldn't save your request. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });
});
