import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const translations: Record<string, string> = {
      title: "Privacy Policy",
      body: "TrackWay's full Privacy Policy is being finalized and will be published here shortly. For questions about how your information is handled, please contact us via WhatsApp or email.",
    };
    return translations[key] ?? key;
  }),
}));

describe("PrivacyPage", () => {
  it("renders a heading and a placeholder notice", async () => {
    const jsx = await PrivacyPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(jsx);
    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/being finalized and will be published here shortly/),
    ).toBeInTheDocument();
  });
});
