import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore/lite";
import { firebaseEnabled, firebaseOptions, useFirebaseEmulators } from "./config";

/**
 * Lazily loaded Firebase services (browser only). Learners who never open the
 * account page and have never signed in do not download the Firebase SDK.
 *
 * Firestore Lite is used on purpose: the app reads competency documents once
 * per session and writes rarely, so it needs no realtime listeners or offline
 * cache. Failed requests are handled by the sync engine instead.
 */
export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  authSdk: typeof import("firebase/auth");
  firestoreSdk: typeof import("firebase/firestore/lite");
}

let services: Promise<FirebaseServices> | null = null;

export function loadFirebase(): Promise<FirebaseServices> | null {
  if (!firebaseEnabled || !firebaseOptions || typeof window === "undefined") return null;
  services ??= (async () => {
    const [appSdk, authSdk, firestoreSdk] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore/lite"),
    ]);
    const app = appSdk.getApps()[0] ?? appSdk.initializeApp(firebaseOptions);
    // The SDK keeps the session in IndexedDB (falling back to local storage):
    // only Firebase tokens are stored there, never passwords.
    const auth = authSdk.getAuth(app);
    const db = firestoreSdk.getFirestore(app);
    if (useFirebaseEmulators) {
      // Ports match firebase.json ("emulators").
      authSdk.connectAuthEmulator(auth, "http://127.0.0.1:9095", { disableWarnings: true });
      firestoreSdk.connectFirestoreEmulator(db, "127.0.0.1", 8085);
    }
    return { app, auth, db, authSdk, firestoreSdk };
  })();
  services.catch(() => {
    services = null;
  });
  return services;
}
