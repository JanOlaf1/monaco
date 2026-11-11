import type { User } from "firebase/auth";
import type { CatalogCourse } from "@/lib/content/catalog";
import { loadFirebase, type FirebaseServices } from "@/lib/firebase/client";
import { createFirestoreCompetencyRemote } from "@/lib/firebase/competency-remote";
import { firebaseEnabled } from "@/lib/firebase/config";
import { authErrorKey, classifySyncError, type AuthErrorKey } from "@/lib/firebase/errors";
import type { Locale } from "@/lib/i18n/config";
import { recommendForTrack } from "@/lib/learning/recommend";
import { competencyStore } from "@/lib/learner/stores";
import type { CompetencyConflict } from "@/lib/sync/competency-merge";
import { createCompetencySync, type CompetencySync, type SyncStatus } from "@/lib/sync/competency-sync";

/**
 * Optional account and cloud sync (browser only).
 *
 * - Accounts never gate learning: everything keeps working signed out.
 * - The Firebase SDK is loaded only when the learner opens the account page or
 *   a session hint says they signed in before (the hint is just "1"; no
 *   tokens, emails or passwords are stored by the app — Firebase keeps its
 *   own session tokens).
 * - Only verified email addresses sync (the security rules require it).
 * - Signing out stops syncing; local data in this browser stays untouched.
 */

export interface AccountUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

export interface AccountSnapshot {
  /** Firebase is configured for this build. */
  available: boolean;
  phase: "idle" | "loading" | "signed-out" | "signed-in" | "unavailable";
  user: AccountUser | null;
  sync: SyncStatus;
}

export type ActionResult = { ok: true } | { ok: false; error: AuthErrorKey };

const HINT_KEY = "koodaamo:v1:account-session";

const initial: AccountSnapshot = { available: firebaseEnabled, phase: "idle", user: null, sync: { state: "idle" } };
let snapshot = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<AccountSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

function writeHint(on: boolean) {
  try {
    if (on) window.localStorage.setItem(HINT_KEY, "1");
    else window.localStorage.removeItem(HINT_KEY);
  } catch {
    // Storage may be unavailable (private mode); the session still works this visit.
  }
}

let courses: CatalogCourse[] = [];
let services: FirebaseServices | null = null;
let engine: CompetencySync | null = null;
let starting: Promise<boolean> | null = null;

const toUser = (user: User): AccountUser => ({ uid: user.uid, email: user.email, emailVerified: user.emailVerified });

async function follow(user: User | null) {
  if (!user) {
    writeHint(false);
    engine?.stop();
    set({ phase: "signed-out", user: null });
    return;
  }
  writeHint(true);
  set({ phase: "signed-in", user: toUser(user) });
  if (!user.emailVerified || !engine) {
    engine?.stop();
    return;
  }
  // Merge only with the stored local data, never with the not-yet-loaded initial state.
  await competencyStore.whenHydrated();
  if (services?.auth.currentUser?.uid === user.uid) await engine.start(user.uid);
}

function failure(error: unknown): ActionResult {
  return { ok: false, error: authErrorKey(error) };
}

export const account = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initial,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** The course catalog is needed to recompute suggested starting points after a merge. */
  configure(catalog: CatalogCourse[]) {
    courses = catalog;
  },

  hasSessionHint(): boolean {
    try {
      return window.localStorage.getItem(HINT_KEY) === "1";
    } catch {
      return false;
    }
  },

  /** Load Firebase and follow the auth state. Idempotent; resolves false when unavailable. */
  start(): Promise<boolean> {
    const loading = loadFirebase();
    if (!loading) return Promise.resolve(false);
    starting ??= (async () => {
      set({ phase: "loading" });
      try {
        services = await loading;
      } catch {
        starting = null;
        set({ phase: "unavailable" });
        return false;
      }
      const loaded = services;
      engine = createCompetencySync({
        remote: createFirestoreCompetencyRemote(loaded.db, loaded.firestoreSdk),
        local: {
          get: () => competencyStore.getSnapshot().value,
          update: (updater) => competencyStore.update(updater),
          subscribe: (listener) => competencyStore.subscribe(listener),
        },
        recommend: (trackId, track) =>
          recommendForTrack(
            courses.find((course) => course.language === trackId),
            track,
            new Date().toISOString(),
          ),
        classifyError: classifySyncError,
      });
      engine.subscribe(() => set({ sync: engine!.getStatus() }));
      await new Promise<void>((resolve) => {
        let first = true;
        loaded.authSdk.onAuthStateChanged(loaded.auth, (user) => {
          void follow(user).finally(() => {
            if (first) {
              first = false;
              resolve();
            }
          });
        });
      });
      return true;
    })();
    return starting;
  },

  async register(email: string, password: string, locale: Locale): Promise<ActionResult & { verificationSent?: boolean }> {
    if (!(await this.start()) || !services) return { ok: false, error: "notAllowed" };
    const { auth, authSdk } = services;
    try {
      auth.languageCode = locale;
      const credential = await authSdk.createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        await authSdk.sendEmailVerification(credential.user);
        return { ok: true, verificationSent: true };
      } catch {
        return { ok: true, verificationSent: false };
      }
    } catch (error) {
      return failure(error);
    }
  },

  async signIn(email: string, password: string): Promise<ActionResult> {
    if (!(await this.start()) || !services) return { ok: false, error: "notAllowed" };
    try {
      await services.authSdk.signInWithEmailAndPassword(services.auth, email.trim(), password);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },

  async signOut(): Promise<ActionResult> {
    if (!services) return { ok: true };
    engine?.stop();
    try {
      await services.authSdk.signOut(services.auth);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },

  /** Neutral result: whether or not an account exists, the learner sees the same message. */
  async resetPassword(email: string, locale: Locale): Promise<ActionResult> {
    if (!(await this.start()) || !services) return { ok: false, error: "notAllowed" };
    try {
      services.auth.languageCode = locale;
      await services.authSdk.sendPasswordResetEmail(services.auth, email.trim());
      return { ok: true };
    } catch (error) {
      const key = authErrorKey(error);
      return key === "invalidCredentials" ? { ok: true } : { ok: false, error: key };
    }
  },

  async resendVerification(locale: Locale): Promise<ActionResult> {
    const user = services?.auth.currentUser;
    if (!services || !user) return { ok: false, error: "generic" };
    try {
      services.auth.languageCode = locale;
      await services.authSdk.sendEmailVerification(user);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },

  /** After the learner clicked the link: refresh the user and the ID token (the rules read email_verified from it). */
  async refreshVerification(): Promise<boolean> {
    const user = services?.auth.currentUser;
    if (!user) return false;
    try {
      await user.reload();
      await user.getIdToken(true);
    } catch {
      return false;
    }
    const current = services?.auth.currentUser ?? null;
    await follow(current);
    return Boolean(current?.emailVerified);
  },

  syncNow(): Promise<void> {
    return engine?.syncNow() ?? Promise.resolve();
  },

  /** Retry after a network failure (called when the browser comes back online). */
  retryIfOffline() {
    if (snapshot.sync.state === "offline") void engine?.syncNow();
  },

  resolveConflict(conflict: CompetencyConflict, choice: "local" | "cloud"): Promise<void> {
    return engine?.resolve(conflict, choice) ?? Promise.resolve();
  },
};
