"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendBookingNotificationEmail } from "@/lib/resend";
import { buildBookingEmailBody } from "@/lib/booking-messages";
import type { BookingFormInput } from "@/lib/booking-validation";
import type { Locale } from "@/i18n/routing";

export interface SubmitBookingResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

const DUPLICATE_WINDOW_MINUTES = 5;

export async function submitBookingRequest(
  input: BookingFormInput,
  channel: "whatsapp" | "email",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale: Locale,
): Promise<SubmitBookingResult> {
  try {
    const supabase = createServerSupabaseClient();

    const windowStart = new Date(
      Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const { data: recent, error: lookupError } = await supabase
      .from("booking_requests")
      .select("id")
      .eq("phone", input.phone)
      .eq("preferred_date", input.preferredDate)
      .gte("created_at", windowStart)
      .limit(1);

    if (lookupError) {
      return {
        success: false,
        error: "We couldn't process your request. Please try again.",
      };
    }
    if (recent && recent.length > 0) {
      return {
        success: false,
        error: "This request was already submitted. Our team will be in touch.",
      };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("booking_requests")
      .insert({
        full_name: input.fullName,
        company_name: input.companyName || null,
        phone: input.phone,
        email: input.email,
        customer_type: input.customerType,
        num_vehicles: Number(input.numVehicles),
        vehicle_type: input.vehicleType,
        preferred_area: input.preferredArea,
        preferred_date: input.preferredDate,
        message: input.message || null,
        submission_channel: channel,
        status: "New Request",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return {
        success: false,
        error: "We couldn't save your request. Please try again.",
      };
    }

    const bookingId = (inserted as { id: string }).id;

    if (channel === "email") {
      const emailResult = await sendBookingNotificationEmail({
        customerName: input.fullName,
        body: buildBookingEmailBody(
          input,
          new Date().toISOString().slice(0, 10),
        ),
      });
      if (!emailResult.success) {
        return {
          success: false,
          error:
            "Your request was saved, but we couldn't send the email notification. Our team will still see it — you can also reach us on WhatsApp.",
        };
      }
    }

    return { success: true, data: { id: bookingId } };
  } catch {
    return {
      success: false,
      error: "We couldn't process your request. Please try again.",
    };
  }
}
