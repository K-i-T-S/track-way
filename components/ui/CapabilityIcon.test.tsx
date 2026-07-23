import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CapabilityIcon } from "./CapabilityIcon";

describe("CapabilityIcon", () => {
  it("renders a distinct, decorative svg for each of the 9 Key Capabilities", () => {
    const names = [
      "live-tracking",
      "trip-history",
      "speed-alerts",
      "geofencing",
      "ignition-alerts",
      "movement-alerts",
      "engine-control",
      "fleet-reports",
      "multi-vehicle",
    ] as const;

    const markups = names.map((name) => {
      const { container } = render(<CapabilityIcon name={name} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      return container.innerHTML;
    });

    expect(new Set(markups).size).toBe(names.length);
  });

  it("applies a passed className to the svg element", () => {
    const { container } = render(
      <CapabilityIcon name="live-tracking" className="h-8 w-8 text-accent" />,
    );
    expect(container.querySelector("svg")).toHaveClass(
      "h-8",
      "w-8",
      "text-accent",
    );
  });
});
