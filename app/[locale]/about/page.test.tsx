import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

vi.mock("@/sanity/queries", () => ({
  getAboutPage: vi.fn().mockResolvedValue({
    story: {
      en: "TrackWay started to make tracking simple.",
      ar: "بدأت TrackWay لجعل التتبع بسيطًا.",
    },
    imageUrl: "https://cdn.sanity.io/about.jpg",
  }),
}));

describe("AboutPage", () => {
  it("renders the localized story text", async () => {
    const jsx = await AboutPage({ params: Promise.resolve({ locale: "en" }) });
    render(jsx);
    expect(
      screen.getByText("TrackWay started to make tracking simple."),
    ).toBeInTheDocument();
  });
});
