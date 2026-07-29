"use client";

import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * TrackWay button system.
 *
 * Every CTA on the site renders through this component so the "premium dark
 * tech" language used by the section backgrounds (glow bloom, hairline
 * gradient rules, border-trace rings, sheen sweeps) is present on the buttons
 * too, instead of a flat pill.
 *
 * Palette is locked to the brand tokens: teal #00E5D4, warm #FB923C, black,
 * white and ice #F4FFFE. Tones are expressed as alpha ramps of those two hues
 * so no new colour is ever introduced.
 */

export type ButtonVariant = "primary" | "secondary" | "whatsapp" | "link";
export type ButtonTone = "teal" | "warm";
export type ButtonSize = "sm" | "md";

const TONE_HEX: Record<ButtonTone, string> = {
  teal: "#00E5D4",
  warm: "#FB923C",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3.5 text-sm",
};

/** Shared by every pill variant (primary / secondary / whatsapp). */
const PILL_BASE =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 rounded-full font-bold leading-none " +
  "transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out " +
  "[box-shadow:var(--btn-shadow)] hover:[box-shadow:var(--btn-shadow-hover)] " +
  "motion-safe:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] " +
  // Focus ring uses `outline`, not Tailwind's box-shadow-based `ring`, so it
  // cannot be overwritten by the variant's own box-shadow glow.
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "[background-image:var(--btn-fill)] text-background",
  whatsapp: "[background-image:var(--btn-fill)] text-background",
  secondary:
    "border border-white/15 bg-white/5 text-foreground backdrop-blur hover:border-white/25 hover:bg-white/10",
  link:
    "group/btn relative inline-flex select-none items-center gap-2 rounded-sm font-bold text-accent " +
    "transition-colors duration-300 hover:text-trackway-ice " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
};

function isFilled(variant: ButtonVariant): boolean {
  return variant === "primary" || variant === "whatsapp";
}

/**
 * All variant-dependent colour work is funnelled through CSS custom
 * properties, which keeps the class list static (Tailwind-safe) while still
 * allowing a per-instance tone — e.g. the hardware showcase alternates its
 * quote CTA between teal and warm to match each product's accent.
 */
function toneVars(variant: ButtonVariant, tone: ButtonTone): CSSProperties {
  const hex = TONE_HEX[tone];
  const filled = isFilled(variant);

  return {
    "--btn-fill": `linear-gradient(135deg, ${hex} 0%, ${hex}dd 100%)`,
    // The border-trace ring reads as light on a filled pill, as tone on glass.
    "--btn-ring": filled ? "rgba(255,255,255,0.95)" : hex,
    "--btn-sheen": filled ? "rgba(255,255,255,0.5)" : `${hex}59`,
    "--btn-shadow": filled
      ? `0 4px 18px -6px ${hex}80, 0 0 0 1px ${hex}33`
      : "0 2px 14px -8px rgba(0,0,0,0.85)",
    "--btn-shadow-hover": filled
      ? `0 14px 38px -8px ${hex}cc, 0 0 0 1px ${hex}99`
      : `0 12px 32px -12px ${hex}99`,
  } as CSSProperties;
}

function WhatsAppGlyph(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export interface ButtonProps {
  /** Destination. Locale-prefixed internal paths go through next/link. */
  href: string;
  /**
   * Render a plain `<a>` instead of a next/link `<Link>`. Use for off-site
   * URLs (wa.me), `mailto:`/`tel:` and in-page `#hash` targets.
   */
  external?: boolean;
  /** Anchor passthrough — only applied when `external` is set. */
  target?: string;
  /** Anchor passthrough — only applied when `external` is set. */
  rel?: string;
  variant?: ButtonVariant;
  /** Hue. Defaults to warm for `whatsapp`, teal everywhere else. */
  tone?: ButtonTone;
  size?: ButtonSize;
  /**
   * Icon shown before the label. Gets a gentle hover bloom (no RTL flip —
   * leading icons are symbols such as the WhatsApp glyph, not arrows).
   */
  iconLeading?: ReactNode;
  /**
   * Icon shown after the label. Gets the site's RTL-aware arrow nudge, so
   * pass directional icons here.
   */
  iconTrailing?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
  children: ReactNode;
}

export function Button({
  href,
  external = false,
  target,
  rel,
  variant = "primary",
  tone,
  size = "md",
  iconLeading,
  iconTrailing,
  className,
  onClick,
  "aria-label": ariaLabel,
  children,
}: ButtonProps): React.ReactElement {
  const resolvedTone: ButtonTone =
    tone ?? (variant === "whatsapp" ? "warm" : "teal");
  const isLink = variant === "link";
  const filled = isFilled(variant);

  // WhatsApp CTAs carry the glyph by default so every "talk to a human"
  // action is recognisable at a glance; callers can still override it.
  const leading =
    iconLeading ?? (variant === "whatsapp" ? <WhatsAppGlyph /> : null);

  const classes = cn(
    isLink ? VARIANT_CLASSES.link : PILL_BASE,
    !isLink && SIZE_CLASSES[size],
    !isLink && VARIANT_CLASSES[variant],
    className,
  );

  const content = (
    <>
      {!isLink && (
        <>
          {/* clipped surface effects */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          >
            {/* glassy dome highlight, filled variants only */}
            {filled && (
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.16] to-transparent" />
            )}
            {/* hairline top rule — the same signature used on the site's cards */}
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                filled ? "via-white/70" : "via-white/40",
              )}
            />
            {/* ambient sheen sweep -- runs continuously at low intensity;
                a faster/brighter one-shot fires on hover as the distinct
                hover boost (both transform+opacity only, compositor-cheap) */}
            <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] bg-[linear-gradient(90deg,transparent,var(--btn-sheen),transparent)] motion-safe:animate-btn-sheen-loop motion-safe:group-hover/btn:animate-btn-sheen" />
          </span>

          {/* animated border-trace ring, revealed on hover only -- this
              animates stroke-dashoffset, a real scroll-jank contributor
              (confirmed via CPU-throttled load testing) when many buttons
              run it at once, so it's paused except on hover rather than
              ambient/always-on. */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100"
          >
            <rect
              x="0.75"
              y="0.75"
              width="calc(100% - 1.5px)"
              height="calc(100% - 1.5px)"
              rx="999"
              ry="999"
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="40 280"
              strokeLinecap="round"
              className="animate-btn-trace [animation-play-state:paused] [stroke:var(--btn-ring)] group-hover/btn:[animation-play-state:running]"
            />
          </svg>
        </>
      )}

      <span className="relative z-[1] inline-flex items-center gap-2">
        {leading && (
          <span className="inline-flex transition-transform duration-300 motion-safe:group-hover/btn:scale-110">
            {leading}
          </span>
        )}
        {children}
        {iconTrailing && (
          <span className="inline-flex transition-transform duration-300 rtl:rotate-180 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1">
            {iconTrailing}
          </span>
        )}
      </span>

      {isLink && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-500 ease-out group-hover/btn:scale-x-100 rtl:origin-right rtl:bg-gradient-to-l"
        />
      )}
    </>
  );

  const style = isLink ? undefined : toneVars(variant, resolvedTone);

  if (external) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        style={style}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={classes}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {content}
    </Link>
  );
}
