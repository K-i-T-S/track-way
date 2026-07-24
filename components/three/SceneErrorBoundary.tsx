"use client";

import { Component, type ReactNode } from "react";

interface SceneErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

// WebGL/three.js scenes can fail for reasons outside our control (driver
// issues, unsupported browsers, third-party bundling quirks) — a failure
// here must never take down the rest of the page.
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error(
      "3D scene failed to render, falling back to static poster:",
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
