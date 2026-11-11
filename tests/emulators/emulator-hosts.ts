/**
 * Emulator addresses. `firebase emulators:exec` exports these variables to the
 * test process from firebase.json, so the ports are configured in one place.
 */
function hostAndPort(value: string | undefined, fallback: string) {
  const [host, port] = (value || fallback).split(":");
  return { host, port: Number(port) };
}

export const firestoreEmulator = hostAndPort(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8085");
export const authEmulator = hostAndPort(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9095");
export const authEmulatorUrl = `http://${authEmulator.host}:${authEmulator.port}`;
