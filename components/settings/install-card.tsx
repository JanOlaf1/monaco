"use client";

import { CircleCheck, Download, Share, SquarePlus } from "lucide-react";
import { useState } from "react";
import { usePwa } from "@/components/pwa/pwa-provider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { pwa } from "@/lib/pwa/pwa-store";

/**
 * Optional installation. Uses the browser's own install prompt where it is
 * offered (Chromium), and shows short instructions elsewhere (iOS Safari has
 * no prompt). Never shown as a popup and never required.
 */
export function InstallCard() {
  const { dict } = useI18n();
  const { standalone, canPrompt, ios } = usePwa();
  const [message, setMessage] = useState<string | null>(null);

  if (standalone) {
    return (
      <p className="flex items-center gap-2 text-sm text-success" data-testid="install-installed">
        <CircleCheck className="size-4" aria-hidden="true" />
        {dict.settings.installed}
      </p>
    );
  }

  const install = async () => {
    const outcome = await pwa.promptInstall();
    if (outcome === "accepted") setMessage(dict.settings.installAccepted);
    else if (outcome === "dismissed") setMessage(dict.settings.installDismissed);
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-fg-muted">{dict.settings.installBody}</p>
      {canPrompt ? (
        <Button variant="primary" onClick={() => void install()} className="h-11 sm:h-9">
          <Download aria-hidden="true" />
          {dict.settings.installButton}
        </Button>
      ) : null}
      {ios ? (
        <div data-testid="install-ios">
          <h3 className="font-semibold">{dict.settings.iosTitle}</h3>
          <ol className="mt-2 space-y-2">
            {dict.settings.iosSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="flex items-center gap-1.5">
                  {step}
                  {index === 0 ? <Share className="size-4 text-accent" aria-hidden="true" /> : null}
                  {index === 1 ? <SquarePlus className="size-4 text-accent" aria-hidden="true" /> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : !canPrompt ? (
        <div data-testid="install-other">
          <h3 className="font-semibold">{dict.settings.otherTitle}</h3>
          <p className="mt-1 text-fg-muted">{dict.settings.otherBody}</p>
        </div>
      ) : null}
      {message ? (
        <p role="status" className="text-fg-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
