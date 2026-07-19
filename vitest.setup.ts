import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

// Mock next/image for testing
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>): React.ReactElement => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, ...rest } = props;
    return React.createElement("img", { ...rest });
  },
}));

afterEach(() => {
  cleanup();
});
