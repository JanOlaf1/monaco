import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const key = "koodaamo:v1:adventure";
const at = "2026-11-10T12:00:00.000Z";
const seed = () => ({
  version: 1,
  events: Object.fromEntries([1, 2, 3, 4].map((index) => {
    const id = `crystal:exercise:exercise-${index}`;
    return [id, { id, kind: "exercise", amount: 5, at, sourceId: `exercise-${index}` }];
  })),
  equipped: {}, showMessages: true, settingsAt: at,
});

describe("adventure local transactions", () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    vi.resetModules();
    storage = new Map([[key, JSON.stringify(seed())]]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (name: string) => storage.get(name) ?? null,
        setItem: (name: string, value: string) => storage.set(name, value),
      },
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    });
    vi.stubGlobal("document", { addEventListener: vi.fn() });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("serializes rapid purchases and never spends more than the stored balance", async () => {
    const lock = vi.fn(async (_name: string, run: () => Promise<unknown>) => run());
    vi.stubGlobal("navigator", { locks: { request: lock } });
    const { updateAdventure, adventureStore } = await import("@/lib/adventure/store");
    const { purchaseCosmetic, crystalBalance, ownedCosmetics } = await import("@/lib/adventure/engine");
    const buy = (id: "goggles" | "scarf") => updateAdventure((state) => {
      const next = purchaseCosmetic(state, id, new Date());
      return { state: next.state, result: next.status };
    });
    expect(await Promise.all([buy("goggles"), buy("scarf"), buy("goggles")])).toEqual([
      "purchased", "insufficient", "owned",
    ]);
    expect(crystalBalance(adventureStore.getSnapshot().value)).toBe(5);
    expect(ownedCosmetics(adventureStore.getSnapshot().value)).toEqual(["goggles"]);
    expect(JSON.parse(storage.get(key)!).events["purchase:goggles"]).toBeDefined();
    expect(lock).toHaveBeenCalledTimes(3);
  });

  it("reads newly persisted accomplishments before purchasing, with a fallback without Web Locks", async () => {
    vi.stubGlobal("navigator", {});
    const { updateAdventure, adventureStore } = await import("@/lib/adventure/store");
    const { purchaseCosmetic, crystalBalance } = await import("@/lib/adventure/engine");
    await adventureStore.whenHydrated();
    const external = seed();
    const id = "crystal:exercise:another-exercise";
    external.events[id] = { id, kind: "exercise", amount: 5, at, sourceId: "another-exercise" };
    storage.set(key, JSON.stringify(external));
    const status = await updateAdventure((state) => {
      const next = purchaseCosmetic(state, "backpack", new Date());
      return { state: next.state, result: next.status };
    });
    expect(status).toBe("purchased");
    expect(crystalBalance(adventureStore.getSnapshot().value)).toBe(0);
  });

  it("preserves the in-memory purchase if browser storage fails", async () => {
    vi.stubGlobal("navigator", {});
    const { adventureStore, updateAdventure, adventureStorageStatus } = await import("@/lib/adventure/store");
    const { purchaseCosmetic, ownedCosmetics } = await import("@/lib/adventure/engine");
    await adventureStore.whenHydrated();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem = () => { throw new Error("Quota exceeded"); };
    await updateAdventure((state) => {
      const next = purchaseCosmetic(state, "scarf", new Date());
      return { state: next.state, result: next.status };
    });
    expect(ownedCosmetics(adventureStore.getSnapshot().value)).toContain("scarf");
    expect(warn).toHaveBeenCalled();
    expect(adventureStorageStatus.getSnapshot().sessionOnly).toBe(true);
  });

  it("refuses to downgrade adventure data from a future schema", async () => {
    const future = JSON.stringify({ version: 2, events: { future: "preserve" } });
    storage.set(key, future);
    const { updateAdventure, hasUnsupportedAdventureVersion } = await import("@/lib/adventure/store");
    expect(hasUnsupportedAdventureVersion()).toBe(true);
    await expect(updateAdventure((state) => ({ state, result: undefined }))).rejects.toThrow("newer version");
    expect(storage.get(key)).toBe(future);
  });
});
