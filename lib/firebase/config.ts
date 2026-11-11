import { getDefaultAppConfig } from "@firebase/util";
import type { FirebaseOptions } from "firebase/app";

/**
 * Firebase web configuration. Nothing is hardcoded:
 *
 * - Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG during the build and
 *   the Firebase SDK's postinstall step turns it into default options
 *   ("autoinit"), read here with `getDefaultAppConfig()`.
 * - For local development, put the web app's values in `.env.local`
 *   (NEXT_PUBLIC_FIREBASE_*; see docs/FIREBASE_SETUP.md).
 *
 * The web config identifies the project and is not a secret; access is
 * controlled by Firebase Authentication and the Firestore security rules.
 * Without a configuration the app runs fully local and hides accounts.
 */
function resolveOptions(): FirebaseOptions | null {
  const explicit: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (explicit.apiKey && explicit.projectId && explicit.appId) return explicit;
  try {
    const defaults = getDefaultAppConfig();
    if (defaults?.apiKey && defaults.projectId && defaults.appId) return defaults;
  } catch {
    // No defaults available in this environment.
  }
  return null;
}

export const firebaseOptions: FirebaseOptions | null = resolveOptions();
export const firebaseEnabled = firebaseOptions !== null;

/** Connect to the local Emulator Suite instead of production (tests and local development only). */
export const useFirebaseEmulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1";
