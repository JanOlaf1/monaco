import type { RunnerStatus } from "./types";

/** Small observable for a runner's loading status (used by the UI). */
export class StatusEmitter {
  private status: RunnerStatus;
  private readonly listeners = new Set<() => void>();

  constructor(initial: RunnerStatus) {
    this.status = initial;
  }

  get = (): RunnerStatus => this.status;

  set(status: RunnerStatus) {
    if (status === this.status) return;
    this.status = status;
    for (const listener of this.listeners) listener();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
