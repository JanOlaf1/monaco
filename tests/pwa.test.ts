import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { isIosDevice } from "@/lib/pwa/pwa-store";

const root = join(__dirname, "..");

/** Width and height from a PNG's IHDR chunk. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(join(root, "public", path));
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("web app manifest", () => {
  const app = manifest();

  it("describes an installable standalone app", () => {
    expect(app).toMatchObject({
      name: "Koodaamo",
      short_name: "Koodaamo",
      start_url: "/",
      scope: "/",
      display: "standalone",
      id: "/",
    });
    expect(app.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(app.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("has 192 and 512 px icons, including maskable ones, that match their files", () => {
    const icons = app.icons ?? [];
    for (const purpose of ["any", "maskable"]) {
      for (const size of ["192x192", "512x512"]) {
        expect(icons.some((icon) => icon.sizes === size && (icon.purpose ?? "any") === purpose), `${purpose} ${size}`).toBe(true);
      }
    }
    for (const icon of icons.filter((entry) => entry.type === "image/png")) {
      const [width, height] = (icon.sizes ?? "").split("x").map(Number);
      expect(pngSize(icon.src), icon.src).toEqual({ width, height });
    }
    expect(pngSize("/icons/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
  });

  it("deep-links its shortcuts to real pages", () => {
    const urls = (app.shortcuts ?? []).map((shortcut) => shortcut.url);
    expect(urls).toEqual(["/practice", "/progress"]);
  });
});

describe("iOS detection (for install instructions)", () => {
  it("recognises iPhone, iPad and iPadOS desktop mode", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", "iPhone", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel", 0)).toBe(false);
    expect(isIosDevice("Mozilla/5.0 (Linux; Android 15; Pixel 7)", "Linux armv8l", 5)).toBe(false);
  });
});

/* ------------------------- Service worker rules ------------------------- */

type Handler = (event: unknown) => void;

/** Runs public/sw.js against small fakes of the service worker globals. */
function loadServiceWorker(options: { online: boolean }) {
  const handlers = new Map<string, Handler>();
  const stores = new Map<string, Map<string, Response>>();
  const network: string[] = [];
  const keyOf = (input: string | Request) => {
    const url = new URL(typeof input === "string" ? input : input.url, "https://koodaamo.test");
    return url.href;
  };
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      put: async (input: string | Request, response: Response) => void store.set(keyOf(input), response),
      match: async (input: string | Request) => store.get(keyOf(input))?.clone(),
      keys: async () => [...store.keys()].map((url) => new Request(url)),
      delete: async (input: string | Request) => store.delete(keyOf(input)),
      addAll: async (urls: string[]) => {
        for (const url of urls) store.set(keyOf(url), new Response(url));
      },
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (input: string | Request) => {
      for (const store of stores.values()) {
        const hit = store.get(keyOf(input));
        if (hit) return hit.clone();
      }
      return undefined;
    },
  };
  const fetchFake = async (input: string | Request) => {
    const url = keyOf(input);
    network.push(url);
    if (!options.online) throw new TypeError("Failed to fetch");
    const response = new Response(`<html>${url}</html>`, { status: 200, headers: { "Content-Type": "text/html" } });
    Object.defineProperty(response, "type", { value: "basic" });
    return response;
  };
  const self = {
    location: new URL("https://koodaamo.test/sw.js"),
    addEventListener: (type: string, handler: Handler) => handlers.set(type, handler),
    skipWaiting: () => undefined,
    clients: { claim: async () => undefined },
  };
  const source = readFileSync(join(root, "public", "sw.js"), "utf8");
  new Function("self", "caches", "fetch", source)(self, caches, fetchFake);

  const request = (path: string, init: { mode?: RequestMode; method?: string; headers?: Record<string, string> } = {}) => {
    const req = new Request(new URL(path, "https://koodaamo.test"), { method: init.method ?? "GET", headers: init.headers });
    if (init.mode) Object.defineProperty(req, "mode", { value: init.mode });
    let responded: Promise<Response> | null = null;
    handlers.get("fetch")!({ request: req, respondWith: (value: Promise<Response>) => (responded = value) });
    return responded as Promise<Response> | null;
  };
  return { handlers, stores, network, request, open };
}

describe("service worker", () => {
  it("leaves private, cross-origin and non-GET traffic to the network", () => {
    const sw = loadServiceWorker({ online: true });
    expect(sw.request("https://firestore.googleapis.com/v1/projects/x/databases/(default)/documents")).toBeNull();
    expect(sw.request("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=abc")).toBeNull();
    expect(sw.request("/en/account", { method: "POST" })).toBeNull();
    expect(sw.request("/en/courses", { headers: { RSC: "1" } })).toBeNull();
    expect(sw.request("/en/courses?_rsc=abc")).toBeNull();
    expect(sw.request("/api/anything")).toBeNull();
    // Python runtime: not cached, so the app never claims Python works offline.
    expect(sw.request("/vendor/pyodide/pyodide.asm.wasm")).toBeNull();
    expect(sw.request("/sw.js")).toBeNull();
  });

  it("handles pages, hashed assets and the editor runtime", () => {
    const sw = loadServiceWorker({ online: true });
    expect(sw.request("/en/practice", { mode: "navigate" })).not.toBeNull();
    expect(sw.request("/_next/static/chunks/app.js")).not.toBeNull();
    expect(sw.request("/vendor/monaco-editor/vs/loader.js")).not.toBeNull();
    expect(sw.request("/workers/python.worker.mjs")).not.toBeNull();
  });

  it("serves the newest page online and a cached copy offline", async () => {
    const online = loadServiceWorker({ online: true });
    const fresh = await online.request("/en/practice?x=1", { mode: "navigate" })!;
    expect(await fresh.text()).toContain("/en/practice?x=1");
    expect(online.network).toContain("https://koodaamo.test/en/practice?x=1");

    const offline = loadServiceWorker({ online: false });
    const pages = await offline.open("koodaamo-sw-v1-pages");
    await pages.put("https://koodaamo.test/en/practice", new Response("cached practice"));
    await pages.put("https://koodaamo.test/fi/offline", new Response("offline fi"));
    expect(await (await offline.request("/en/practice", { mode: "navigate" })!).text()).toBe("cached practice");
    // A page never opened before falls back to the offline page in its language.
    expect(await (await offline.request("/fi/courses/python", { mode: "navigate" })!).text()).toBe("offline fi");
    const none = await offline.request("/en/progress", { mode: "navigate" })!;
    expect(none.status).toBe(503);
  });

  it("removes caches from older versions when a new version activates", async () => {
    const sw = loadServiceWorker({ online: true });
    await sw.open("koodaamo-sw-v0-pages");
    await sw.open("someone-elses-cache");
    let done: Promise<unknown> = Promise.resolve();
    sw.handlers.get("activate")!({ waitUntil: (promise: Promise<unknown>) => (done = promise) });
    await done;
    expect([...sw.stores.keys()]).toEqual(["someone-elses-cache"]);
  });
});
