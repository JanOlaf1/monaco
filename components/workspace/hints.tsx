"use client";

import { Lightbulb } from "lucide-react";
import { InlineMarkdown } from "@/components/content/markdown";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

/** Progressive hints: revealed one at a time, only when the learner asks. */
export function Hints({
  hints,
  revealed,
  onReveal,
}: {
  hints: string[];
  revealed: number;
  onReveal: () => void;
}) {
  const { dict } = useI18n();
  const h = dict.workspace.hints;
  if (hints.length === 0) return null;
  const shown = hints.slice(0, revealed);

  return (
    <section aria-label={h.title} className="space-y-2">
      {shown.length > 0 ? (
        <ol className="space-y-2">
          {shown.map((hint, index) => (
            <li key={index} className="rise-in flex items-start gap-2.5">
              <Mascot mood="thinking" size={36} className="mt-0.5" />
              <div className="rounded-2xl rounded-tl-sm border border-line bg-warning-soft px-3 py-2 text-[13.5px] leading-snug">
                <span className="sr-only">{format(h.label, { number: index + 1 })}: </span>
                <InlineMarkdown source={hint} />
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {revealed < hints.length ? (
        <Button variant="ghost" size="sm" onClick={onReveal} className="-ml-2">
          <Lightbulb className="text-warning" aria-hidden="true" />
          {revealed === 0 ? h.ask : h.showAnother}
          <span className="text-fg-subtle">
            ({revealed + 1}/{hints.length})
          </span>
        </Button>
      ) : (
        <p className="text-xs text-fg-subtle">{h.allShown}</p>
      )}
    </section>
  );
}
