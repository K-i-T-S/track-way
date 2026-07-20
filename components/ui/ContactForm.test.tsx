import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ContactForm } from "./ContactForm";

const messages = {
  contact: {
    sendWhatsApp: "Send via WhatsApp",
    sendEmail: "Send via Email",
    nameLabel: "Name",
    messageLabel: "Message",
  },
};

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContactForm whatsappNumber="+961 3 123 456" email="info@trackway.com" />
    </NextIntlClientProvider>,
  );
}

describe("ContactForm", () => {
  it("builds a WhatsApp link that includes the typed name and message", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Name"), "Nadia");
    await user.type(screen.getByLabelText("Message"), "I need a fleet quote");
    const link = screen.getByRole("link", { name: "Send via WhatsApp" });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/9613123456?text="),
    );
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain("Nadia");
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain(
      "I need a fleet quote",
    );
  });

  it("builds a mailto link with the typed name and message", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Name"), "Nadia");
    await user.type(screen.getByLabelText("Message"), "I need a fleet quote");
    const link = screen.getByRole("link", { name: "Send via Email" });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:info@trackway.com?subject="),
    );
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain("Nadia");
  });

  it("prevents the default browser submit (GET navigation) when Enter is pressed in a field", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();
    await user.type(screen.getByLabelText("Name"), "Nadia");

    const form = container.querySelector("form")!;
    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(screen.getByLabelText("Name")).toHaveValue("Nadia");
  });
});
