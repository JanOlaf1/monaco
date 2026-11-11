import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { OfflineInfo } from "@/components/pwa/offline-info";
import { RetryButton } from "@/components/pwa/retry-button";
import { ButtonLink } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.offline.title, robots: { index: false } };
}

/**
 * Static fallback the service worker shows when a page that was never opened
 * is requested without a connection (it is precached in both languages).
 */
export default async function OfflinePage() {
  const { locale, dict } = await getDictionary();
  return (
    <PageShell dict={dict}>
      <div className="mx-auto max-w-2xl">
        <CloudOff className="size-8 text-fg-subtle" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{dict.offline.title}</h1>
        <p className="mt-2 text-fg-muted">{dict.offline.body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <RetryButton label={dict.offline.retry} />
          <ButtonLink href={`/${locale}`}>{dict.offline.home}</ButtonLink>
        </div>
        <div className="mt-8">
          <OfflineInfo dict={dict} />
        </div>
      </div>
    </PageShell>
  );
}
