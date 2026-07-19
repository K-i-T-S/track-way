"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buildWhatsAppLink, buildMailtoLink } from "@/lib/contact-links";

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
    <form className="flex flex-col gap-4">
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
      <div className="flex gap-4">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent font-bold"
        >
          {t("sendWhatsApp")}
        </a>
        <a href={mailtoLink} className="text-accent font-bold">
          {t("sendEmail")}
        </a>
      </div>
    </form>
  );
}
