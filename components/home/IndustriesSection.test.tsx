import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { IndustriesSection } from "./IndustriesSection";

const homepageMessages = {
  industriesEyebrow: "Who We Serve",
  industriesTitle: "One platform, every kind of fleet",
  industriesFleets: "Transportation Fleets",
  industriesFleetsDesc: "Live location and geofence alerts.",
  industriesRental: "Car-Rental Companies",
  industriesRentalDesc: "Geofence approved zones.",
  industriesDelivery: "Delivery Fleets",
  industriesDeliveryDesc: "Trip history and reports.",
  industriesSchool: "School Transportation",
  industriesSchoolDesc: "Live bus location.",
  industriesPrivate: "Private Vehicles",
  industriesPrivateDesc: "Affordable tracking.",
  industriesConstruction: "Construction & Heavy Equipment",
  industriesConstructionDesc: "Track machinery on job sites.",
};

function renderSection() {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ homepage: homepageMessages }}
    >
      <IndustriesSection />
    </NextIntlClientProvider>,
  );
}

describe("IndustriesSection", () => {
  it("renders every industry title", () => {
    renderSection();
    expect(
      screen.getByRole("heading", { name: "Transportation Fleets" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Construction & Heavy Equipment" }),
    ).toBeInTheDocument();
  });

  it("keeps the benefit description collapsed until the card is hovered", async () => {
    renderSection();
    const description = screen.getByText("Live location and geofence alerts.");
    expect(description).toHaveStyle({ height: "0px", opacity: "0" });

    const card = description.closest('[tabindex="0"]')!;
    fireEvent.mouseEnter(card);
    await waitFor(() =>
      expect(description).toHaveStyle({ height: "auto", opacity: "1" }),
    );

    fireEvent.mouseLeave(card);
    await waitFor(() =>
      expect(description).toHaveStyle({ height: "0px", opacity: "0" }),
    );
  });

  it("reveals the description on keyboard focus and hides it on blur", async () => {
    renderSection();
    const description = screen.getByText("Geofence approved zones.");
    const card = description.closest('[tabindex="0"]')!;

    fireEvent.focus(card);
    await waitFor(() =>
      expect(description).toHaveStyle({ height: "auto", opacity: "1" }),
    );

    fireEvent.blur(card);
    await waitFor(() =>
      expect(description).toHaveStyle({ height: "0px", opacity: "0" }),
    );
  });
});
