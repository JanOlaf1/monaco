import type { PersistenceAdapter } from "./adapter";

export interface StoreSnapshot<T> {
  value: T;
  /** False on the server and until the adapter has loaded on the client. */
  hydrated: boolean;
}

export interface UpdateOptions {
  /** Delay persisting (coalesces frequent updates such as typing). */
  debounceMs?: number;
  /** Update without notifying subscribers (the caller already shows the value). */
  silent?: boolean;
}

export interface PersistentStore<T> {
  getSnapshot(): StoreSnapshot<T>;
  getServerSnapshot(): StoreSnapshot<T>;
  subscribe(listener: () => void): () => void;
  update(updater: (previous: T) => T, options?: UpdateOptions): void;
  /** Write pending debounced changes immediately. */
  flush(): Promise<void>;
  /** Resolves once the stored value has been loaded. */
  whenHydrated(): Promise<StoreSnapshot<T>>;
}

/**
 * An observable value persisted through an adapter, designed for
 * `useSyncExternalStore`:
 *
 * - The server snapshot is always the initial value with `hydrated: false`,
 *   so server HTML and the first client render match (no hydration errors).
 * - Loading starts on the first client subscription; components re-render
 *   with the stored value once it is available.
 * - Updates made before loading finishes are replayed on top of the loaded value.
 */
export function createPersistentStore<T>(options: {
  adapter: PersistenceAdapter<T>;
  initial: T;
}): PersistentStore<T> {
  const { adapter, initial } = options;
  const serverSnapshot: StoreSnapshot<T> = { value: initial, hydrated: false };
  let snapshot: StoreSnapshot<T> = serverSnapshot;
  const listeners = new Set<() => void>();
  const queued: Array<(previous: T) => T> = [];
  let loading: Promise<StoreSnapshot<T>> | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const persist = async () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (!dirty) return;
    dirty = false;
    try {
      await adapter.save(snapshot.value);
    } catch (error) {
      // Typically a storage quota error. Keep the in-memory value.
      console.warn("[storage] Could not save learner data:", error);
    }
  };

  const schedule = (debounceMs: number) => {
    dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    if (debounceMs <= 0) {
      void persist();
      return;
    }
    saveTimer = setTimeout(() => void persist(), debounceMs);
  };

  const hydrate = (): Promise<StoreSnapshot<T>> => {
    if (loading) return loading;
    loading = adapter
      .load()
      .catch(() => null)
      .then((stored) => {
        let value = stored ?? initial;
        for (const updater of queued.splice(0)) value = updater(value);
        snapshot = { value, hydrated: true };
        emit();
        // Stores live for the whole page session, so this listener is never removed.
        adapter.subscribe?.((external) => {
          snapshot = { value: external ?? initial, hydrated: true };
          emit();
        });
        return snapshot;
      });
    return loading;
  };

  if (typeof window !== "undefined") {
    const flushOnHide = () => {
      if (document.visibilityState === "hidden") void persist();
    };
    window.addEventListener("pagehide", () => void persist());
    document.addEventListener("visibilitychange", flushOnHide);
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      void hydrate();
      return () => {
        listeners.delete(listener);
      };
    },
    update(updater, { debounceMs = 0, silent = false } = {}) {
      if (!snapshot.hydrated) {
        queued.push(updater);
        void hydrate().then(() => schedule(debounceMs));
        return;
      }
      const value = updater(snapshot.value);
      if (Object.is(value, snapshot.value)) return;
      snapshot = { value, hydrated: true };
      schedule(debounceMs);
      if (!silent) emit();
    },
    flush: persist,
    whenHydrated: hydrate,
  };
}
