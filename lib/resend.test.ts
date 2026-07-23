import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe("sendBookingNotificationEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns an honest failure when email delivery is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.BOOKING_NOTIFICATION_EMAIL;
    const { sendBookingNotificationEmail } = await import("./resend");
    const result = await sendBookingNotificationEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(result).toEqual({
      success: false,
      error: "Email delivery is not configured.",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends with the correct subject, recipient, and body when configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "bookings@trackway.test";
    process.env.BOOKING_NOTIFICATION_EMAIL = "gpsnavix@gmail.com";
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
    const { sendBookingNotificationEmail } = await import("./resend");
    const result = await sendBookingNotificationEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(sendMock).toHaveBeenCalledWith({
      from: "bookings@trackway.test",
      to: "gpsnavix@gmail.com",
      subject: "New TrackWay Installation Request — Nadia Khoury",
      text: "details",
    });
    expect(result).toEqual({ success: true });
  });

  it("returns an honest failure when Resend itself returns an error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "bookings@trackway.test";
    process.env.BOOKING_NOTIFICATION_EMAIL = "gpsnavix@gmail.com";
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "invalid domain" },
    });
    const { sendBookingNotificationEmail } = await import("./resend");
    const result = await sendBookingNotificationEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(result).toEqual({ success: false, error: "invalid domain" });
  });
});

describe("sendContactInquiryEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns an honest failure when email delivery is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.BOOKING_NOTIFICATION_EMAIL;
    const { sendContactInquiryEmail } = await import("./resend");
    const result = await sendContactInquiryEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(result).toEqual({
      success: false,
      error: "Email delivery is not configured.",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends with the correct subject, recipient, and body when configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "bookings@trackway.test";
    process.env.BOOKING_NOTIFICATION_EMAIL = "gpsnavix@gmail.com";
    sendMock.mockResolvedValue({ data: { id: "email-2" }, error: null });
    const { sendContactInquiryEmail } = await import("./resend");
    const result = await sendContactInquiryEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(sendMock).toHaveBeenCalledWith({
      from: "bookings@trackway.test",
      to: "gpsnavix@gmail.com",
      subject: "New TrackWay Contact Inquiry — Nadia Khoury",
      text: "details",
    });
    expect(result).toEqual({ success: true });
  });

  it("returns an honest failure when Resend itself returns an error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "bookings@trackway.test";
    process.env.BOOKING_NOTIFICATION_EMAIL = "gpsnavix@gmail.com";
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "invalid domain" },
    });
    const { sendContactInquiryEmail } = await import("./resend");
    const result = await sendContactInquiryEmail({
      customerName: "Nadia Khoury",
      body: "details",
    });
    expect(result).toEqual({ success: false, error: "invalid domain" });
  });
});
