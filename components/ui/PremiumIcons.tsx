/**
 * Gradient-enhanced SVG fallbacks for the handful of decorative icons that
 * don't have a matching generated image yet (image-generation credits ran
 * out before every icon in the design package could be rendered — see
 * trackway-design-rehaul/IMAGE-GENERATION-GUIDE.md). Adapted from that
 * package's PremiumIcons.tsx, restyled onto the `accent` token instead of a
 * hardcoded hex so it stays in sync with the brand palette.
 */

interface IconProps {
  className?: string;
}

export function MapPinIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
        fill="url(#pinGrad)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="10" r="1.5" fill="#fff" opacity="0.6" />
    </svg>
  );
}

export function ShieldAlertIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        fill="url(#shieldGrad)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 8v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TruckIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
        fill="url(#truckGrad)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M15 18H9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
        fill="url(#truckGrad)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="17" cy="18" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="7" cy="18" r="2" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function DocumentIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="url(#docGrad)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <polyline
        points="14 2 14 8 20 8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="13"
        x2="8"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="17"
        x2="8"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="9"
        x2="8"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MessageIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="msgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        fill="url(#msgGrad)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="10" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function CheckIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="url(#checkGrad)"
        fillOpacity="0.3"
      />
      <polyline
        points="22 4 12 14.01 9 11.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
