import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

vi.mock("gsap", () => ({ gsap: { registerPlugin: vi.fn(), to: vi.fn() } }));
vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })) },
}));

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ type: "FeatureCollection", features: [] }),
  } as unknown as Response);
});

describe("GlobeHeroBackground", () => {
  it("renders as a decorative, non-interactive full-bleed layer, animated by default", async () => {
    stubMatchMedia(false);
    vi.resetModules();
    const { GlobeHeroBackground } = await import("./GlobeHeroBackground");
    const trackRef = createRef<HTMLElement>();
    render(<GlobeHeroBackground trackRef={trackRef} />);
    const el = screen.getByTestId("globe-hero-background");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("data-motion-mode", "animated");
  });

  // A "reduced motion" variant of this test is intentionally not included:
  // framer-motion's useReducedMotion() reads window.matchMedia through a
  // module-level singleton (motion-dom's hasReducedMotionListener) that's
  // initialized once per process and doesn't reliably re-read a fresh
  // matchMedia stub even across vi.resetModules() + dynamic re-import in
  // this Vitest/Vite setup. The static-mode path is verified manually in
  // the plan's Task 5 (DevTools "Emulate CSS prefers-reduced-motion").
});
