import { CircleCheck, CloudOff } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** What works without a connection and what needs one (shared by the offline page and settings). */
export function OfflineInfo({ dict }: { dict: Dictionary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section aria-labelledby="offline-works" className="rounded-xl border border-line bg-surface p-4">
        <h3 id="offline-works" className="flex items-center gap-2 text-sm font-semibold">
          <CircleCheck className="size-4 text-success" aria-hidden="true" />
          {dict.offline.worksTitle}
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
          {dict.offline.works.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="offline-needs" className="rounded-xl border border-line bg-surface p-4">
        <h3 id="offline-needs" className="flex items-center gap-2 text-sm font-semibold">
          <CloudOff className="size-4 text-fg-subtle" aria-hidden="true" />
          {dict.offline.needsTitle}
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
          {dict.offline.needs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
