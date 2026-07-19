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
});
