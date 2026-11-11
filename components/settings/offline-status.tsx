"use client";

import { CircleCheck, Info } from "lucide-react";
import { usePwa } from "@/components/pwa/pwa-provider";
import { useI18n } from "@/lib/i18n/client";

/** Whether the service worker controls this page (it only registers in production builds). */
export function OfflineStatus() {
  const { dict } = useI18n();
  const { offlineReady } = usePwa();
  return offlineReady ? (
    <p className="flex items-center gap-2 text-sm text-success" data-testid="offline-ready">
      <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
      {dict.settings.offlineReady}
    </p>
  ) : (
    <p className="flex items-center gap-2 text-sm text-fg-muted" data-testid="offline-not-ready">
      <Info className="size-4 shrink-0" aria-hidden="true" />
      {dict.settings.offlineNotReady}
    </p>
  );
}
