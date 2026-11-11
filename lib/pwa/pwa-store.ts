/**
 * Browser-side PWA state: service worker registration and updates, the
 * install prompt, installed/standalone mode and connectivity. Installing is
 * always optional; nothing here gates learning.
 */

/** The non-standard event Chromium browsers fire when the app can be installed. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaSnapshot {
  online: boolean;
  /** A new version is installed and waiting; reloading switches to it. */
  updateReady: boolean;
  /** The browser offered an install prompt we can show. */
  canPrompt: boolean;
  /** Running as an installed app (standalone display mode). */
  standalone: boolean;
  ios: boolean;
  /** The service worker controls this page (offline support is active). */
  offlineReady: boolean;
  /** Increments each time the connection drops (lets a dismissed notice reappear next time). */
  offlineEpisode: number;
  /** When the connection last came back during this visit (ms since epoch). */
  reconnectedAt: number | null;
}

const initial: PwaSnapshot = {
  online: true,
  updateReady: false,
  canPrompt: false,
  standalone: false,
  ios: false,
  offlineReady: false,
  offlineEpisode: 0,
  reconnectedAt: null,
};

let snapshot = initial;
const listeners = new Set<() => void>();
let started = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;
let reloadOnChange = false;

function set(patch: Partial<PwaSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

export function isIosDevice(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  // iPadOS reports itself as a Mac with touch support.
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function trackWaiting(registration: ServiceWorkerRegistration) {
  const markWaiting = (worker: ServiceWorker | null) => {
    // Only an update: the very first install has no controller yet.
    if (worker && navigator.serviceWorker.controller) {
      waitingWorker = worker;
      set({ updateReady: true });
    }
  };
  markWaiting(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    installing?.addEventListener("statechange", () => {
      if (installing.state === "installed") markWaiting(installing);
    });
  });
}

async function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    trackWaiting(registration);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      set({ offlineReady: true });
      if (reloadOnChange) window.location.reload();
    });
    await navigator.serviceWorker.ready;
    set({ offlineReady: Boolean(navigator.serviceWorker.controller) || snapshot.offlineReady });
  } catch (error) {
    console.warn("[pwa] Service worker registration failed:", error);
  }
}

export const pwa = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initial,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Attach browser listeners once (called from a client component in the root layout). */
  start() {
    if (started || typeof window === "undefined") return;
    started = true;
    const online = navigator.onLine;
    set({
      online,
      offlineEpisode: online ? 0 : 1,
      standalone: isStandalone(),
      ios: isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints),
      offlineReady: Boolean(navigator.serviceWorker?.controller),
    });
    window.addEventListener("online", () => {
      if (!snapshot.online) set({ online: true, reconnectedAt: Date.now() });
    });
    window.addEventListener("offline", () => {
      if (snapshot.online) set({ online: false, offlineEpisode: snapshot.offlineEpisode + 1 });
    });
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      set({ canPrompt: true });
    });
    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      set({ canPrompt: false, standalone: true });
    });
    window.matchMedia("(display-mode: standalone)").addEventListener("change", () => set({ standalone: isStandalone() }));
    void registerServiceWorker();
  },

  /** Show the browser's own install dialog (only after a user gesture). */
  async promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    const event = deferredPrompt;
    if (!event) return "unavailable";
    deferredPrompt = null;
    set({ canPrompt: false });
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  },

  /** Switch to the waiting version and reload once it controls the page. */
  applyUpdate() {
    if (!waitingWorker) return;
    reloadOnChange = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  },
};
