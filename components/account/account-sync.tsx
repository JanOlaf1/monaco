"use client";

import { useEffect } from "react";
import { account } from "@/lib/account/account-store";
import { firebaseEnabled } from "@/lib/firebase/config";
import { useCatalog } from "@/lib/learner/catalog-context";

/**
 * Mounted once in the root layout. Restores a previous session (only when the
 * learner signed in before on this browser, so others never load Firebase)
 * and retries a failed sync when the browser comes back online.
 */
export function AccountSync() {
  const { courses } = useCatalog();

  useEffect(() => {
    account.configure(courses);
    if (firebaseEnabled && account.hasSessionHint()) void account.start();
  }, [courses]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const onOnline = () => account.retryIfOffline();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
