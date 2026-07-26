"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildWhatsAppLink, buildMailtoLink } from "@/lib/contact-links";
import { Button } from "@/components/ui/Button";

interface ContactFormProps {
  whatsappNumber: string;
  email: string;
}

export function ContactForm({
  whatsappNumber,
  email,
}: ContactFormProps): React.ReactElement {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const composedMessage = `Name: ${name}\n${message}`;
  const whatsappLink = buildWhatsAppLink(whatsappNumber, composedMessage);
  const mailtoLink = buildMailtoLink(
    email,
    `Inquiry from ${name || "website visitor"}`,
    composedMessage,
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <label className="flex flex-col gap-1">
        {t("nameLabel")}
        <input
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        {t("messageLabel")}
        <textarea
          className="border border-white/10 bg-transparent p-2 text-foreground"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-4">
        <Button
          href={whatsappLink}
          external
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
        >
          {t("sendWhatsApp")}
        </Button>
        <Button
          href={mailtoLink}
          external
          variant="secondary"
          iconLeading={<Mail className="h-4 w-4" aria-hidden="true" />}
        >
          {t("sendEmail")}
        </Button>
      </div>
    </form>
  );
}
