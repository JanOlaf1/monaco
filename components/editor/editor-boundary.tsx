"use client";

import { Component, type ReactNode } from "react";

/** Catches editor load failures (e.g. offline) and offers a retry. */
export class EditorErrorBoundary extends Component<
  { fallback: (retry: () => void) => ReactNode; children: ReactNode },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[editor] Monaco Editor failed to load:", error);
  }

  retry = () => this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }));

  render() {
    if (this.state.failed) return this.props.fallback(this.retry);
    return <div key={this.state.attempt} className="contents">{this.props.children}</div>;
  }
}
