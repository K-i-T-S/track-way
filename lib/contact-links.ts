export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

// tel: URIs (RFC 3966) don't reliably support space-separated visual
// grouping across dialers, so the href strips everything but the leading
// "+" and digits while the on-page label keeps the human-readable spacing.
export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function buildMailtoLink(
  email: string,
  subject: string,
  body: string,
): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
