"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface MarqueeTickerProps {
  items: string[];
}

export function MarqueeTicker({ items }: MarqueeTickerProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden bg-accent py-3">
      <div
        data-testid="marquee-track"
        className={cn(
          "flex w-max gap-8 whitespace-nowrap",
          isRtl ? "animate-marquee-rtl" : "animate-marquee-ltr",
        )}
      >
        {doubled.map((item, i) => (
          // Fixed black, not the theme-aware `text-background` token: this
          // sits on `bg-accent`, a fixed bright teal in both themes, so the
          // text needs to stay dark regardless of which theme is active.
          <span
            key={`${item}-${i}`}
            className="font-bold uppercase text-trackway-black"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
