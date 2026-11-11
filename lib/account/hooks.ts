"use client";

import { useSyncExternalStore } from "react";
import { account, type AccountSnapshot } from "./account-store";

/** Account and sync state. On the server and during hydration it is the signed-out initial state. */
export function useAccount(): AccountSnapshot {
  return useSyncExternalStore(account.subscribe, account.getSnapshot, account.getServerSnapshot);
}
