import { describe, it, expect, vi, beforeEach } from "vitest";

function createFluentMock(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.limit = vi.fn(() => Promise.resolve(result));
  builder.insert = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  return builder;
}

const fromMock = vi.fn();
const sendBookingNotificationEmailMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/resend", () => ({
  sendBookingNotificationEmail: (...args: unknown[]) =>
    sendBookingNotificationEmailMock(...args),
}));

const INPUT = {
  fullName: "Nadia Khoury",
  companyName: "Khoury Logistics",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  customerType: "Truck and Transportation Fleet" as const,
  numVehicles: "5",
  vehicleType: "Trucks" as const,
  preferredArea: "Beirut",
  preferredDate: "2026-07-25",
  message: "",
};

describe("submitBookingRequest", () => {
  beforeEach(() => {
    fromMock.mockReset();
    sendBookingNotificationEmailMock.mockReset();
  });

  it("saves the request and opens WhatsApp without sending an email for the whatsapp channel", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({
      data: { id: "booking-1" },
      error: null,
    });
    fromMock
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(insertBuilder);

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "whatsapp", "en");

    expect(result).toEqual({ success: true, data: { id: "booking-1" } });
    expect(sendBookingNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("saves the request and sends an email notification for the email channel", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({
      data: { id: "booking-2" },
      error: null,
    });
    fromMock
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(insertBuilder);
    sendBookingNotificationEmailMock.mockResolvedValue({ success: true });

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "email", "en");

    expect(result).toEqual({ success: true, data: { id: "booking-2" } });
    expect(sendBookingNotificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: "Nadia Khoury" }),
    );
  });

  it("rejects a duplicate submission (same phone + date within the window) without inserting", async () => {
    const lookupBuilder = createFluentMock({
      data: [{ id: "existing" }],
      error: null,
    });
    fromMock.mockReturnValueOnce(lookupBuilder);

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "whatsapp", "en");

    expect(result.success).toBe(false);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("returns an honest error and never a false success when the insert fails", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({
      data: null,
      error: { message: "insert failed" },
    });
    fromMock
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(insertBuilder);

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "whatsapp", "en");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("reports success:false (not a silent success) when the save works but the email fails", async () => {
    const lookupBuilder = createFluentMock({ data: [], error: null });
    const insertBuilder = createFluentMock({
      data: { id: "booking-3" },
      error: null,
    });
    fromMock
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(insertBuilder);
    sendBookingNotificationEmailMock.mockResolvedValue({
      success: false,
      error: "Email delivery is not configured.",
    });

    const { submitBookingRequest } = await import("./actions");
    const result = await submitBookingRequest(INPUT, "email", "en");

    expect(result.success).toBe(false);
    expect(result.error).toContain("saved");
  });

  it("returns { success: false } instead of throwing when an unexpected error occurs (e.g. missing Supabase env vars)", async () => {
    fromMock.mockImplementationOnce(() => {
      throw new Error("supabaseUrl is required.");
    });

    const { submitBookingRequest } = await import("./actions");

    await expect(
      submitBookingRequest(INPUT, "whatsapp", "en"),
    ).resolves.toEqual({
      success: false,
      error: expect.any(String),
    });
  });
});
