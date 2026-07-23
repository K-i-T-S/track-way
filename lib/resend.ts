import { Resend } from "resend";

interface EmailParams {
  customerName: string;
  body: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

async function sendEmail(params: {
  to: string | undefined;
  from: string | undefined;
  subject: string;
  text: string;
}): Promise<EmailResult> {
  if (!params.from || !params.to) {
    return { success: false, error: "Email delivery is not configured." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send email." };
  }
}

export async function sendBookingNotificationEmail(
  params: EmailParams,
): Promise<EmailResult> {
  return sendEmail({
    to: process.env.BOOKING_NOTIFICATION_EMAIL,
    from: process.env.RESEND_FROM_EMAIL,
    subject: `New TrackWay Installation Request — ${params.customerName}`,
    text: params.body,
  });
}

export async function sendContactInquiryEmail(
  params: EmailParams,
): Promise<EmailResult> {
  return sendEmail({
    to: process.env.BOOKING_NOTIFICATION_EMAIL,
    from: process.env.RESEND_FROM_EMAIL,
    subject: `New TrackWay Contact Inquiry — ${params.customerName}`,
    text: params.body,
  });
}
