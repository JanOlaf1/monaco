"use client";

import { CloudOff, RefreshCw, Wifi, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { pwa } from "@/lib/pwa/pwa-store";

export function usePwa() {
  return useSyncExternalStore(pwa.subscribe, pwa.getSnapshot, pwa.getServerSnapshot);
}

const BACK_ONLINE_MS = 4000;

function Notice({
  icon,
  children,
  actions,
  onDismiss,
  testId,
}: {
  icon: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  testId: string;
}) {
  const { dict } = useI18n();
  return (
    <div
      role="status"
      data-testid={testId}
      className="rise-in pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm shadow-lg"
    >
      <span className="mt-0.5 shrink-0 text-fg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p>{children}</p>
        {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dict.pwa.dismiss}
          className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-subtle hover:bg-hover hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Mounted once in the root layout: registers the service worker (production
 * builds only) and shows quiet, dismissible notices when the connection drops
 * or returns and when an update is waiting. The update is applied only when
 * the learner chooses it, so nobody is reloaded in the middle of a lesson.
 */
export function PwaNotices() {
  const { dict } = useI18n();
  const { online, updateReady, offlineEpisode, reconnectedAt } = usePwa();
  const [dismissedEpisode, setDismissedEpisode] = useState(0);
  const [expiredReconnect, setExpiredReconnect] = useState<number | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    pwa.start();
  }, []);

  // The "back online" note hides itself after a moment.
  useEffect(() => {
    if (reconnectedAt === null) return;
    const timer = window.setTimeout(() => setExpiredReconnect(reconnectedAt), BACK_ONLINE_MS);
    return () => window.clearTimeout(timer);
  }, [reconnectedAt]);

  const backOnline = online && reconnectedAt !== null && expiredReconnect !== reconnectedAt;
  const notices: ReactNode[] = [];
  if (!online && dismissedEpisode !== offlineEpisode) {
    notices.push(
      <Notice
        key="offline"
        testId="offline-notice"
        icon={<CloudOff className="size-4" aria-hidden="true" />}
        onDismiss={() => setDismissedEpisode(offlineEpisode)}
      >
        {dict.pwa.offlineBanner}
      </Notice>,
    );
  }
  if (backOnline) {
    notices.push(
      <Notice key="online" testId="online-notice" icon={<Wifi className="size-4" aria-hidden="true" />}>
        {dict.pwa.backOnline}
      </Notice>,
    );
  }
  if (updateReady && !updateDismissed) {
    notices.push(
      <Notice
        key="update"
        testId="update-notice"
        icon={<RefreshCw className="size-4" aria-hidden="true" />}
        actions={
          <>
            <Button size="sm" variant="primary" onClick={() => pwa.applyUpdate()}>
              {dict.pwa.updateNow}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setUpdateDismissed(true)}>
              {dict.pwa.updateLater}
            </Button>
          </>
        }
      >
        {dict.pwa.updateReady}
      </Notice>,
    );
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-96"
    >
      {notices}
    </div>
  );
}

/** A small, persistent offline marker in the header; explains what works offline in settings. */
export function OfflineIndicator() {
  const { locale, dict } = useI18n();
  const { online } = usePwa();
  if (online) return null;
  return (
    <Link
      href={`/${locale}/settings#offline`}
      title={dict.pwa.offlineBanner}
      data-testid="offline-indicator"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-warning-soft px-2 text-xs font-medium text-fg"
    >
      <CloudOff className="size-4" aria-hidden="true" />
      <span className="max-sm:sr-only">{dict.pwa.offlineShort}</span>
    </Link>
  );
}
