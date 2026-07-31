"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/contact-links";

interface WhatsAppButtonProps {
  phoneNumber: string;
}

export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  const t = useTranslations("whatsappButton");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const link = buildWhatsAppLink(phoneNumber, t("message"));

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      className={cn(
        "group fixed bottom-6 z-50 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
        isRtl ? "left-6" : "right-6",
      )}
      style={{
        animation: "wa-entrance 0.8s cubic-bezier(0.34,1.56,0.64,1) 1s both",
      }}
    >
      {/* pulse rings */}
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[#25D366] opacity-10"
        style={{ animation: "ping 2s ease-in-out infinite 0.5s" }}
      />

      {/* tooltip */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100",
          isRtl
            ? "left-full ml-4 -translate-x-3 group-hover:translate-x-0"
            : "right-full mr-4 translate-x-3 group-hover:translate-x-0",
        )}
      >
        <span className="relative whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          {t("tooltip")} 💬
          <span
            className={cn(
              "absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-[6px] border-y-transparent",
              isRtl
                ? "-left-2 border-r-[8px] border-r-white"
                : "-right-2 border-l-[8px] border-l-white",
            )}
          />
        </span>
      </span>

      {/* button surface — scales on hover; kept separate from the fixed <a>
          so the badge and pulse rings don't stretch along with it */}
      <span
        className="relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full shadow-[0_6px_24px_rgba(37,211,102,0.45)] transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-[0_8px_32px_rgba(37,211,102,0.6)] group-active:scale-95"
        style={{ animation: "wa-breathe 3s ease-in-out infinite" }}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#25D366] via-[#20BD5A] to-[#128C7E]" />
        <span className="absolute -inset-full -translate-x-[200%] rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-[200%]" />
        <span className="absolute inset-0 scale-100 rounded-full border-2 border-white/0 opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:border-white/30 group-hover:opacity-100" />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          aria-hidden="true"
          className="relative z-10 h-7 w-7 fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:animate-[wa-wiggle_0.5s_ease-in-out]"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-4-10.5-6.8z" />
        </svg>
      </span>

      {/* notification badge */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -top-1 z-20 flex h-5 w-5",
          isRtl ? "-left-1" : "-right-1",
        )}
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white">
          1
        </span>
      </span>

      <style jsx global>{`
        @keyframes wa-wiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(-12deg);
          }
          30% {
            transform: rotate(10deg);
          }
          45% {
            transform: rotate(-8deg);
          }
          60% {
            transform: rotate(6deg);
          }
          75% {
            transform: rotate(-3deg);
          }
        }
        @keyframes wa-entrance {
          0% {
            opacity: 0;
            transform: translateY(80px) scale(0.3);
          }
          60% {
            opacity: 1;
            transform: translateY(-10px) scale(1.05);
          }
          80% {
            transform: translateY(4px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes wa-breathe {
          0%,
          100% {
            box-shadow: 0 6px 24px rgba(37, 211, 102, 0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(37, 211, 102, 0.65);
          }
        }
      `}</style>
    </a>
  );
}
