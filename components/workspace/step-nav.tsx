"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LocalizedStep } from "@/lib/content/localize";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

/** Numbered step selector for step-by-step exercises. */
export function StepNav({
  steps,
  currentIndex,
  completedStepIds,
  onSelect,
}: {
  steps: LocalizedStep[];
  currentIndex: number;
  completedStepIds: string[];
  onSelect: (index: number) => void;
}) {
  const { dict } = useI18n();
  return (
    <nav aria-label={dict.workspace.stepsHeading}>
      <ol className="flex items-center gap-1.5">
        {steps.map((step, index) => {
          const done = completedStepIds.includes(step.id);
          const current = index === currentIndex;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-1.5 last:flex-none">
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={current ? "step" : undefined}
                aria-label={`${format(dict.workspace.stepLabel, { number: index + 1 })}: ${step.title}${
                  done ? ` (${dict.workspace.stepCompleted})` : ""
                }`}
                title={step.title}
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                  current && "border-accent bg-accent text-accent-fg",
                  !current && done && "border-success/40 bg-success-soft text-success hover:border-success",
                  !current && !done && "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {done && !current ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </button>
              {index < steps.length - 1 ? (
                <span className={cn("h-px flex-1", done ? "bg-success/40" : "bg-line")} aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
