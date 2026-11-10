import type { Rewards } from "./engine";

/**
 * Tiny event bus for reward notifications (level-ups, achievements, chapter
 * completions). The workspace publishes after a passed check; the toast
 * region in the root layout subscribes. Purely presentational: the rewards
 * themselves are already persisted by the time they are published.
 */
type Listener = (rewards: Rewards) => void;

const listeners = new Set<Listener>();

export function publishRewards(rewards: Rewards) {
  for (const listener of listeners) listener(rewards);
}

export function subscribeRewards(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
