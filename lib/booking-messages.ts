import { buildWhatsAppLink } from "./contact-links";
import type { BookingFormInput } from "./booking-validation";
import type { Locale } from "@/i18n/routing";

export function buildBookingWhatsAppMessage(
  details: BookingFormInput,
  locale: Locale,
): string {
  const company = details.companyName || "-";
  const message = details.message || "-";

  if (locale === "ar") {
    return `مرحباً TrackWay،

أرغب في تقديم طلب لحجز موعد تركيب.

الاسم الكامل: ${details.fullName}
اسم الشركة: ${company}
رقم الهاتف: ${details.phone}
البريد الإلكتروني: ${details.email}
نوع العميل: ${details.customerType}
عدد المركبات: ${details.numVehicles}
نوع المركبات: ${details.vehicleType}
منطقة التركيب المفضلة: ${details.preferredArea}
التاريخ المفضل: ${details.preferredDate}
رسالة إضافية: ${message}

أفهم أن التاريخ المفضل يخضع لتأكيد TrackWay.`;
  }

  return `Hello TrackWay,

I would like to request an installation appointment.

Full Name: ${details.fullName}
Company Name: ${company}
Phone Number: ${details.phone}
Email: ${details.email}
Customer Type: ${details.customerType}
Number of Vehicles: ${details.numVehicles}
Vehicle Type: ${details.vehicleType}
Preferred Installation Area: ${details.preferredArea}
Preferred Date: ${details.preferredDate}
Additional Message: ${message}

I understand that the preferred date is subject to confirmation by TrackWay.`;
}

export function buildBookingWhatsAppLink(
  phone: string,
  details: BookingFormInput,
  locale: Locale,
): string {
  return buildWhatsAppLink(phone, buildBookingWhatsAppMessage(details, locale));
}

export function buildBookingEmailBody(
  details: BookingFormInput,
  submissionDate: string,
): string {
  return `Submission Date: ${submissionDate}
Full Name: ${details.fullName}
Company Name: ${details.companyName || "-"}
Phone: ${details.phone}
Email: ${details.email}
Customer Type: ${details.customerType}
Number of Vehicles: ${details.numVehicles}
Vehicle Type: ${details.vehicleType}
Preferred Installation Area: ${details.preferredArea}
Preferred Installation Date: ${details.preferredDate}
Additional Message: ${details.message || "-"}
Submission Channel: Email`;
}
