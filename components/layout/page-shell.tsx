import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Standard content page: centered column plus a quiet footer. */
export function PageShell({ dict, children }: { dict: Dictionary; children: ReactNode }) {
  return (
    <>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:justify-between sm:px-6">
          <span>
            {dict.meta.siteName} · {dict.meta.tagline}
          </span>
          <span>{dict.meta.storageFooter}</span>
        </div>
      </footer>
    </>
  );
}
