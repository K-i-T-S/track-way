import { describe, it, expect } from "vitest";
import {
  buildBookingWhatsAppMessage,
  buildBookingWhatsAppLink,
  buildBookingEmailBody,
} from "./booking-messages";
import type { BookingFormInput } from "./booking-validation";

const DETAILS: BookingFormInput = {
  fullName: "Nadia Khoury",
  companyName: "Khoury Logistics",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  customerType: "Truck and Transportation Fleet",
  numVehicles: "5",
  vehicleType: "Trucks",
  preferredArea: "Beirut",
  preferredDate: "2026-07-25",
  message: "Please call before arriving.",
};

describe("buildBookingWhatsAppMessage", () => {
  it("builds the English template with all fields and the TrackWay brand, not GPSNAVIX", () => {
    const message = buildBookingWhatsAppMessage(DETAILS, "en");
    expect(message).toContain("Hello TrackWay");
    expect(message).toContain("Full Name: Nadia Khoury");
    expect(message).toContain("Company Name: Khoury Logistics");
    expect(message).toContain("Number of Vehicles: 5");
    expect(message).toContain("confirmation by TrackWay");
    expect(message).not.toContain("GPSNAVIX");
  });

  it("builds the Arabic template with all fields and the TrackWay brand", () => {
    const message = buildBookingWhatsAppMessage(DETAILS, "ar");
    expect(message).toContain("مرحباً TrackWay");
    expect(message).toContain("الاسم الكامل: Nadia Khoury");
    expect(message).toContain("عدد المركبات: 5");
    expect(message).not.toContain("GPSNAVIX");
  });

  it("renders a dash for an empty optional message rather than the literal empty string", () => {
    const message = buildBookingWhatsAppMessage(
      { ...DETAILS, message: "" },
      "en",
    );
    expect(message).toContain("Additional Message: -");
  });
});

describe("buildBookingWhatsAppLink", () => {
  it("URL-encodes the message into a wa.me link for the given phone number", () => {
    const link = buildBookingWhatsAppLink("+961 70 857 877", DETAILS, "en");
    expect(link).toContain("https://wa.me/96170857877?text=");
    expect(decodeURIComponent(link)).toContain("Nadia Khoury");
  });
});

describe("buildBookingEmailBody", () => {
  it("includes the submission date and all booking fields", () => {
    const body = buildBookingEmailBody(DETAILS, "2026-07-20");
    expect(body).toContain("Submission Date: 2026-07-20");
    expect(body).toContain("Vehicle Type: Trucks");
    expect(body).toContain("Submission Channel: Email");
  });
});
