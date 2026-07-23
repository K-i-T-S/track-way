import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureCard } from "./FeatureCard";

describe("FeatureCard", () => {
  it("renders the number, title, and description", () => {
    render(
      <FeatureCard
        number="01"
        title="Live Tracking"
        description="See vehicles in real time."
      />,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Live Tracking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("See vehicles in real time.")).toBeInTheDocument();
  });

  it("renders the capability icon when provided", () => {
    render(
      <FeatureCard
        number="01"
        title="Live Tracking"
        description="See vehicles in real time."
        icon="live-tracking"
      />,
    );
    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("omits the icon block when no icon is provided", () => {
    render(
      <FeatureCard
        number="02"
        title="Trip History"
        description="Review past routes."
      />,
    );
    expect(document.querySelector("svg.h-8")).toBeNull();
  });
});
