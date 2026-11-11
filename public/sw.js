/*
 * Koodaamo service worker — conservative offline support.
 *
 * - Pages: network first; a cached copy is used only when the network fails,
 *   so an online learner always gets the newest version (no stranding on an
 *   old build). Pages contain no learner data: progress lives in the
 *   browser's localStorage and is never read or cached here.
 * - /_next/static: cache first (file names contain a content hash).
 * - Monaco (/vendor/monaco-editor), the Python worker script (/workers) and
 *   icons: network first with a cached fallback, because their URLs do not
 *   change between versions.
 * - Never cached: other origins (Firebase Authentication, Firestore, Google
 *   APIs), non-GET requests, Next.js data (RSC) requests, /api, and the
 *   Python runtime (/vendor/pyodide) — Python needs a connection.
 *
 * A new version waits until the learner chooses "Update" (or closes every
 * Koodaamo tab); old caches are removed when it activates. Bump VERSION when
 * the caching rules change.
 */
const VERSION = "koodaamo-sw-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const OFFLINE_PAGES = ["/en/offline", "/fi/offline"];
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
];
/** Keep at most this many visited pages for offline use. */
const MAX_PAGES = 120;

/** The stylesheets and scripts an offline page needs, so it renders fully offline. */
async function precacheAssetsOf(response) {
  const html = await response.clone().text();
  const urls = new Set();
  for (const match of html.matchAll(/(?:href|src)="(\/_next\/static\/[^"?#]+)"/g)) urls.add(match[1]);
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        const asset = await fetch(url);
        if (isCacheableResponse(asset)) await cache.put(url, asset);
      } catch {
        // Missing assets only make the offline page plainer; never fail the install for them.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(PRECACHE);
      const pages = await caches.open(PAGES_CACHE);
      for (const path of OFFLINE_PAGES) {
        const response = await fetch(path, { cache: "reload" });
        if (!isCacheableResponse(response)) throw new Error(`Could not precache ${path}`);
        await precacheAssetsOf(response);
        await pages.put(path, response);
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGES_CACHE, RUNTIME_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith("koodaamo-sw-") && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isCacheableResponse(response) {
  return Boolean(response) && response.ok && response.type === "basic" && !response.redirected;
}

async function trimPages(cache) {
  const keys = await cache.keys();
  const extra = keys.filter((request) => !OFFLINE_PAGES.includes(new URL(request.url).pathname));
  for (const request of extra.slice(0, Math.max(0, extra.length - MAX_PAGES))) await cache.delete(request);
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      // Pages are stored without their query string (?step=… does not change the HTML).
      const url = new URL(request.url);
      await cache.put(url.origin + url.pathname, response.clone());
      void trimPages(cache);
    }
    return response;
  } catch {
    const url = new URL(request.url);
    const cached = await cache.match(url.origin + url.pathname);
    if (cached) return cached;
    const first = url.pathname.split("/")[1];
    if (first !== "en" && first !== "fi") {
      // No locale in the URL (e.g. the installed app's start URL "/"): use the
      // most recently cached version of the page in either language.
      const rest = url.pathname === "/" ? "" : url.pathname;
      const candidates = (await Promise.all(["fi", "en"].map((locale) => cache.match(`/${locale}${rest}`)))).filter(Boolean);
      const newest = candidates.sort((a, b) => Date.parse(b.headers.get("date") || "0") - Date.parse(a.headers.get("date") || "0"))[0];
      if (newest) return newest;
    }
    const locale = first === "fi" ? "fi" : "en";
    const offline = await cache.match(`/${locale}/offline`);
    return (
      offline ??
      new Response("You are offline. · Olet offline-tilassa.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Other origins (Firebase, Google APIs, fonts) are never touched or cached.
  if (url.origin !== self.location.origin) return;
  // Next.js data requests, APIs, dev tooling and the Python runtime go straight to the network.
  if (
    request.headers.get("RSC") === "1" ||
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/__next") ||
    url.pathname.startsWith("/vendor/pyodide/") ||
    url.pathname === "/sw.js"
  ) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (
    url.pathname.startsWith("/vendor/monaco-editor/") ||
    url.pathname.startsWith("/workers/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(networkFirst(request, url.pathname.startsWith("/icons/") ? STATIC_CACHE : RUNTIME_CACHE));
  }
});
