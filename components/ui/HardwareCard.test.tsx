import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HardwareCard } from "./HardwareCard";

const baseProps = {
  name: "TrackerX1",
  description: "A rugged hardware GPS tracker.",
  images: ["https://cdn.sanity.io/trackerx1.jpg"],
  specs: [{ label: "Battery", value: "5000mAh" }],
  whatsappNumber: "+961 3 123 456",
  requestQuoteLabel: "Request a Quote",
};

describe("HardwareCard", () => {
  it("renders the name, description, image, and specs", () => {
    render(<HardwareCard {...baseProps} />);
    expect(
      screen.getByRole("heading", { name: "TrackerX1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A rugged hardware GPS tracker."),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "TrackerX1" })).toHaveAttribute(
      "src",
      expect.stringContaining("trackerx1.jpg"),
    );
    expect(screen.getByText("Battery")).toBeInTheDocument();
    expect(screen.getByText("5000mAh")).toBeInTheDocument();
  });

  it('never renders a price — only a WhatsApp "Request a Quote" link', () => {
    render(<HardwareCard {...baseProps} />);
    const cta = screen.getByRole("link", { name: "Request a Quote" });
    expect(cta).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/9613123456?text="),
    );
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});
