import type { ReactNode } from "react";

export type CapabilityIconName =
  | "live-tracking"
  | "trip-history"
  | "speed-alerts"
  | "geofencing"
  | "ignition-alerts"
  | "movement-alerts"
  | "engine-control"
  | "fleet-reports"
  | "multi-vehicle";

interface CapabilityIconProps {
  name: CapabilityIconName;
  className?: string;
}

const ICON_PATHS: Record<CapabilityIconName, ReactNode> = {
  "live-tracking": (
    <>
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  "trip-history": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  "speed-alerts": (
    <>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M12 12 16 8" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  geofencing: (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  "ignition-alerts": (
    <>
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h9" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </>
  ),
  "movement-alerts": (
    <>
      <path d="M3 12h13" />
      <path d="m12 6 6 6-6 6" />
    </>
  ),
  "engine-control": (
    <>
      <path d="M12 3v7" />
      <path d="M7 6a7 7 0 1 0 10 0" />
    </>
  ),
  "fleet-reports": (
    <>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </>
  ),
  "multi-vehicle": (
    <>
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="m4 11 8 4 8-4" />
      <path d="m4 15 8 4 8-4" />
    </>
  ),
};

export function CapabilityIcon({
  name,
  className,
}: CapabilityIconProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
