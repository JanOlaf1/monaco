import type { Parser, PersistenceAdapter } from "./adapter";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Access can throw when storage is disabled (e.g. some private modes).
    return null;
  }
}

export function createLocalStorageAdapter<T>(key: string, parse: Parser<T>): PersistenceAdapter<T> {
  const read = (raw: string | null): T | null => {
    if (raw === null) return null;
    try {
      return parse(JSON.parse(raw));
    } catch {
      return null;
    }
  };

  return {
    async load() {
      try {
        return read(storage()?.getItem(key) ?? null);
      } catch {
        return null;
      }
    },
    async save(value) {
      const store = storage();
      if (!store) return;
      store.setItem(key, JSON.stringify(value));
    },
    subscribe(listener) {
      if (typeof window === "undefined") return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener(read(event.newValue));
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
