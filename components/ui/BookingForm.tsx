"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  validateBookingForm,
  defaultNumVehiclesFor,
  CUSTOMER_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type BookingFormInput,
  type BookingFormErrors,
  type CustomerType,
  type VehicleType,
} from "@/lib/booking-validation";
import {
  buildBookingWhatsAppLink,
  buildBookingWhatsAppMessage,
} from "@/lib/booking-messages";
import { MessageCircle } from "lucide-react";
import { submitBookingRequest } from "@/app/[locale]/book-installation/actions";

interface BookingFormProps {
  whatsappNumber: string;
  locale: Locale;
}

const EMPTY_FORM: BookingFormInput = {
  fullName: "",
  companyName: "",
  phone: "",
  email: "",
  customerType: "",
  numVehicles: "",
  vehicleType: "",
  preferredArea: "",
  preferredDate: "",
  message: "",
};

type Status = "idle" | "submitting" | "success" | "error";

export function BookingForm({
  whatsappNumber,
  locale,
}: BookingFormProps): React.ReactElement {
  const t = useTranslations("booking");
  const tFooter = useTranslations("footer");
  const [form, setForm] = useState<BookingFormInput>(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  function updateField<K extends keyof BookingFormInput>(
    field: K,
    value: BookingFormInput[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "customerType") {
        next.numVehicles = defaultNumVehiclesFor(value as CustomerType | "");
      }
      return next;
    });
  }

  async function handleSubmit(channel: "whatsapp" | "email") {
    if (honeypot) return;

    const validationErrors = validateBookingForm(form, new Date());
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setStatusMessage("");

    const result = await submitBookingRequest(form, channel, locale);

    // The WhatsApp channel's message carries every booking detail itself,
    // so it must never be blocked by Supabase persistence failing (e.g.
    // not configured yet, see lib/supabase/server.ts) -- persistence there
    // is best-effort logging, not a gate. The email channel has no such
    // fallback (its whole purpose is the saved record + notification), so
    // it still reports a genuine failure instead of claiming success.
    if (channel === "whatsapp") {
      const link = buildBookingWhatsAppLink(whatsappNumber, form, locale);
      window.open(link, "_blank", "noopener,noreferrer");
      setStatus("success");
      setStatusMessage(t("whatsappSuccess"));
      setForm(EMPTY_FORM);
      return;
    }

    if (!result.success) {
      setStatus("error");
      setStatusMessage(result.error ?? t("genericError"));
      return;
    }

    setStatus("success");
    setStatusMessage(t("emailSuccess"));
    setForm(EMPTY_FORM);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        <input
          type="text"
          name="companyWebsite"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("fullNameLabel")}
          <input
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
          />
          {errors.fullName && (
            <span className="text-sm text-red-400">{errors.fullName}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("companyNameLabel")}
          <input
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            aria-invalid={Boolean(errors.companyName)}
          />
          {errors.companyName && (
            <span className="text-sm text-red-400">{errors.companyName}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("phoneLabel")}
          <input
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && (
            <span className="text-sm text-red-400">{errors.phone}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("emailLabel")}
          <input
            type="email"
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <span className="text-sm text-red-400">{errors.email}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("customerTypeLabel")}
          <select
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.customerType}
            onChange={(e) =>
              updateField("customerType", e.target.value as CustomerType | "")
            }
            aria-invalid={Boolean(errors.customerType)}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {CUSTOMER_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.customerType && (
            <span className="text-sm text-red-400">{errors.customerType}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("numVehiclesLabel")}
          <input
            type="number"
            min={1}
            step={1}
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.numVehicles}
            onChange={(e) => updateField("numVehicles", e.target.value)}
            aria-invalid={Boolean(errors.numVehicles)}
          />
          {errors.numVehicles && (
            <span className="text-sm text-red-400">{errors.numVehicles}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("vehicleTypeLabel")}
          <select
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.vehicleType}
            onChange={(e) =>
              updateField("vehicleType", e.target.value as VehicleType | "")
            }
            aria-invalid={Boolean(errors.vehicleType)}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {VEHICLE_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.vehicleType && (
            <span className="text-sm text-red-400">{errors.vehicleType}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("preferredAreaLabel")}
          <input
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.preferredArea}
            onChange={(e) => updateField("preferredArea", e.target.value)}
            aria-invalid={Boolean(errors.preferredArea)}
          />
          {errors.preferredArea && (
            <span className="text-sm text-red-400">{errors.preferredArea}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("preferredDateLabel")}
          <input
            type="date"
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.preferredDate}
            onChange={(e) => updateField("preferredDate", e.target.value)}
            aria-invalid={Boolean(errors.preferredDate)}
          />
          {errors.preferredDate && (
            <span className="text-sm text-red-400">{errors.preferredDate}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t("messageLabel")}
          <textarea
            className="rounded-lg border border-border/15 bg-surface/[0.03] p-2.5 text-foreground outline-none transition-colors focus:border-accent/50"
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
          />
        </label>

        <p className="text-sm text-muted">
          {t("privacyNoticePrefix")}{" "}
          <Link href={`/${locale}/privacy`} className="underline">
            {tFooter("privacyPolicy")}
          </Link>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={status === "submitting"}
            onClick={() => handleSubmit("whatsapp")}
            className="rounded-full bg-accent px-6 py-3 font-bold text-trackway-black disabled:opacity-50"
          >
            {t("continueWhatsApp")}
          </button>
          <button
            type="button"
            disabled={status === "submitting"}
            onClick={() => handleSubmit("email")}
            className="rounded-full border border-accent px-6 py-3 font-bold text-accent disabled:opacity-50"
          >
            {t("sendByEmail")}
          </button>
        </div>

        {status === "success" && (
          <p role="status" className="text-accent">
            {statusMessage}
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="text-red-400">
            {statusMessage}
          </p>
        )}
      </form>

      <aside className="rounded-2xl border border-border/10 bg-surface/[0.04] p-6 backdrop-blur-sm lg:sticky lg:top-28">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            {t("whatsappPreviewTitle")}
          </h2>
        </div>
        <p className="mt-3 text-sm text-muted">{t("whatsappPreviewIntro")}</p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("whatsappPreviewLabel")}
        </p>
        <div className="mt-2 whitespace-pre-line rounded-xl rounded-tl-none bg-accent/10 p-4 text-sm text-foreground">
          {form.fullName
            ? buildBookingWhatsAppMessage(form, locale)
            : t("whatsappPreviewPlaceholder")}
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-accentWarm/25 bg-accentWarm/10 p-3 text-sm text-foreground">
          <span aria-hidden="true">ⓘ</span>
          <span>{t("confirmationNotice")}</span>
        </div>
      </aside>
    </div>
  );
}
