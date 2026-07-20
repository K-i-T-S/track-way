import { describe, it, expect } from "vitest";
import { buildWhatsAppLink, buildMailtoLink } from "./contact-links";

describe("buildWhatsAppLink", () => {
  it("strips non-digit characters from the phone number and URL-encodes the message", () => {
    const link = buildWhatsAppLink("+961 3 123 456", "Hi, I need a quote");
    expect(link).toBe(
      "https://wa.me/9613123456?text=Hi%2C%20I%20need%20a%20quote",
    );
  });
});

describe("buildMailtoLink", () => {
  it("URL-encodes the subject and body", () => {
    const link = buildMailtoLink(
      "info@trackway.com",
      "Quote request",
      "Hi, I need a quote",
    );
    expect(link).toBe(
      "mailto:info@trackway.com?subject=Quote%20request&body=Hi%2C%20I%20need%20a%20quote",
    );
  });
});
