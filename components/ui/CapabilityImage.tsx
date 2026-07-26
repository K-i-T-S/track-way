import Image from "next/image";
import type { CapabilityIconName } from "@/components/ui/CapabilityIcon";

const IMAGE_PATHS: Record<CapabilityIconName, string> = {
  "live-tracking": "/images/icon-live-tracking.png",
  "trip-history": "/images/icon-trip-history.png",
  "speed-alerts": "/images/icon-speed-alerts.png",
  geofencing: "/images/icon-geofencing.png",
  "ignition-alerts": "/images/icon-ignition-alerts.png",
  "movement-alerts": "/images/icon-movement-alerts.png",
  "engine-control": "/images/icon-engine-control.png",
  "fleet-reports": "/images/icon-fleet-reports.png",
  "multi-vehicle": "/images/icon-multi-vehicle.png",
};

interface CapabilityImageProps {
  name: CapabilityIconName;
  size: number;
  className?: string;
}

/** Drop-in image replacement for CapabilityIcon, using the generated 3D-render
 * icon set instead of a flat stroked SVG. */
export function CapabilityImage({
  name,
  size,
  className,
}: CapabilityImageProps): React.ReactElement {
  return (
    <Image
      src={IMAGE_PATHS[name]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
    />
  );
}
