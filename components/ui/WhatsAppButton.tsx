"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/contact-links";

interface WhatsAppButtonProps {
  phoneNumber: string;
}

export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const link = buildWhatsAppLink(
    phoneNumber,
    "Hi, I'd like to know more about TrackWay's GPS solutions.",
  );

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className={cn(
        "fixed bottom-6 z-50 rounded-full bg-accent p-4 text-background shadow-lg",
        isRtl ? "left-6" : "right-6",
      )}
    >
      WhatsApp
    </a>
  );
}
