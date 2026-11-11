import { mergeAdventureWithConflicts } from "./engine";
import { emptyAdventure, parseAdventure, type AdventureState } from "./state";
import { createLocalStorageAdapter } from "@/lib/storage/local-storage";
import { createPersistentStore } from "@/lib/storage/persistent-store";
import type { PersistentStore } from "@/lib/storage/persistent-store";

/** Separate from XP and competency; the domain contains no Firebase imports. */
export const ADVENTURE_STORAGE_KEY = "koodaamo:v1:adventure";
const adapter = createLocalStorageAdapter(ADVENTURE_STORAGE_KEY, parseAdventure);

interface AdventureStorageStatus { conflictingPurchases: readonly string[]; sessionOnly: boolean }
const initialStatus: AdventureStorageStatus = { conflictingPurchases: [], sessionOnly: false };
let status = initialStatus;
const statusListeners = new Set<() => void>();
function setStatus(update: Partial<AdventureStorageStatus>) {
  if (Object.entries(update).every(([key, value]) => status[key as keyof AdventureStorageStatus] === value)) return;
  status = { ...status, ...update };
  for (const listener of statusListeners) listener();
}
export const adventureStorageStatus = {
  getSnapshot: () => status,
  getServerSnapshot: () => initialStatus,
  subscribe(listener: () => void) { statusListeners.add(listener); return () => { statusListeners.delete(listener); }; },
};
function mergeLocal(a: AdventureState, b: AdventureState) {
  const merged = mergeAdventureWithConflicts(a, b);
  if (merged.rejectedPurchases.length) {
    setStatus({ conflictingPurchases: [...new Set([...status.conflictingPurchases, ...merged.rejectedPurchases])] });
  }
  return merged.state;
}

/** Preserve a document written by a newer app instead of downgrading it. */
export function hasUnsupportedAdventureVersion(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const raw: unknown = JSON.parse(window.localStorage.getItem(ADVENTURE_STORAGE_KEY) ?? "null");
    return Boolean(raw && typeof raw === "object" && "version" in raw &&
      typeof raw.version === "number" && raw.version > 1);
  } catch { return false; }
}

export const adventureStore: PersistentStore<AdventureState> = createPersistentStore<AdventureState>({
  initial: emptyAdventure,
  adapter: {
    ...adapter,
    async save(value) {
      try {
        // Detect disabled storage as well as quota failures.
        if (typeof window !== "undefined") void window.localStorage;
        await adapter.save(value);
        setStatus({ sessionOnly: false });
      } catch (error) { setStatus({ sessionOnly: true }); throw error; }
    },
    subscribe(listener) {
      return adapter.subscribe?.((external) => {
        // A storage event must not discard items earned in this tab.
        listener(mergeLocal(adventureStore.getSnapshot().value, external ?? emptyAdventure));
      }) ?? (() => {});
    },
  },
});

// Serializes this tab even in browsers without Web Locks.
let pending: Promise<unknown> = Promise.resolve();

/**
 * Read the latest persisted ledger inside a browser-wide lock before spending.
 * The same lock name must be used by any future same-browser sync writer.
 */
export function updateAdventure<T>(change: (state: AdventureState) => { state: AdventureState; result: T }): Promise<T> {
  const run = async () => {
    await adventureStore.whenHydrated();
    const transact = async () => {
      if (hasUnsupportedAdventureVersion()) throw new Error("Adventure data requires a newer version of Koodaamo.");
      const persisted = await adapter.load();
      let result!: T;
      adventureStore.update((state) => {
        const next = change(mergeLocal(state, persisted ?? emptyAdventure));
        result = next.result;
        return next.state;
      });
      await adventureStore.flush();
      return result;
    };
    if (typeof navigator !== "undefined" && navigator.locks) {
      return navigator.locks.request(ADVENTURE_STORAGE_KEY, transact);
    }
    return transact();
  };
  const next = pending.then(run, run);
  pending = next.catch(() => undefined);
  return next;
}
