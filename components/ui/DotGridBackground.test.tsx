import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DotGridBackground } from "./DotGridBackground";

describe("DotGridBackground", () => {
  it("renders as a decorative, non-interactive element hidden from screen readers", () => {
    render(<DotGridBackground variant="world" />);
    const el = screen.getByTestId("dot-grid-background");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("reflects the variant prop in a data attribute", () => {
    render(<DotGridBackground variant="streets" />);
    expect(screen.getByTestId("dot-grid-background")).toHaveAttribute(
      "data-variant",
      "streets",
    );
  });

  it("merges an incoming className with its base classes", () => {
    render(<DotGridBackground variant="world" className="opacity-50" />);
    expect(screen.getByTestId("dot-grid-background")).toHaveClass("opacity-50");
  });
});
