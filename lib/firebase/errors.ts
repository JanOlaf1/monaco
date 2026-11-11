import type { SyncFailure } from "@/lib/sync/competency-sync";

/** Keys of `dict.account.errors`; every Firebase Auth error maps to one of these. */
export type AuthErrorKey =
  | "invalidEmail"
  | "missingPassword"
  | "weakPassword"
  | "emailInUse"
  | "invalidCredentials"
  | "userDisabled"
  | "tooManyRequests"
  | "network"
  | "notAllowed"
  | "recentLogin"
  | "expiredLink"
  | "generic";

const AUTH_CODES: Record<string, AuthErrorKey> = {
  "auth/invalid-email": "invalidEmail",
  "auth/missing-email": "invalidEmail",
  "auth/missing-password": "missingPassword",
  "auth/weak-password": "weakPassword",
  "auth/password-does-not-meet-requirements": "weakPassword",
  "auth/email-already-in-use": "emailInUse",
  // With email enumeration protection, wrong passwords and unknown users look the same.
  "auth/invalid-credential": "invalidCredentials",
  "auth/invalid-login-credentials": "invalidCredentials",
  "auth/wrong-password": "invalidCredentials",
  "auth/user-not-found": "invalidCredentials",
  "auth/user-disabled": "userDisabled",
  "auth/too-many-requests": "tooManyRequests",
  "auth/network-request-failed": "network",
  "auth/operation-not-allowed": "notAllowed",
  "auth/admin-restricted-operation": "notAllowed",
  "auth/requires-recent-login": "recentLogin",
  "auth/expired-action-code": "expiredLink",
  "auth/invalid-action-code": "expiredLink",
};

function codeOf(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : undefined;
}

export function authErrorKey(error: unknown): AuthErrorKey {
  return AUTH_CODES[codeOf(error) ?? ""] ?? "generic";
}

/** Classify a Firestore failure for the sync status. */
export function classifySyncError(error: unknown): SyncFailure {
  const code = codeOf(error);
  if (code === "permission-denied" || code === "unauthenticated") return "denied";
  if (code === "unavailable" || code === "deadline-exceeded" || code === "aborted") return "offline";
  // Firestore Lite wraps a failed fetch (no HTTP response at all) as code "unknown"
  // with this message; a request that reached the server always has a status.
  const message = error instanceof Error ? error.message : "";
  if (code === "unknown" && message.startsWith("Request failed with error")) return "offline";
  if (error instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false)) return "offline";
  return "error";
}
