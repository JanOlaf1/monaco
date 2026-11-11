"use client";

import { CircleCheck, CircleX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ChoiceOption {
  id: string;
  content: ReactNode;
}

/**
 * Large, touch-friendly radio choices. After checking, the chosen option is
 * marked right or wrong, and revealed answers are marked right.
 */
export function ChoiceList({
  name,
  legend,
  options,
  value,
  onChange,
  disabled,
  correctIds,
  wrongId,
}: {
  name: string;
  legend: string;
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled: boolean;
  /** Options to mark as correct (after a correct answer or "Show answer"). */
  correctIds: string[];
  /** The option to mark as wrong (after a wrong answer). */
  wrongId: string | null;
}) {
  return (
    <fieldset className="mt-4" disabled={disabled}>
      <legend className="text-xs text-fg-muted">{legend}</legend>
      <div className="mt-2 space-y-2">
        {options.map((option) => {
          const right = correctIds.includes(option.id);
          const wrong = wrongId === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 bg-surface p-3 text-sm transition-colors",
                "has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                right && "border-success bg-success-soft has-checked:border-success",
                wrong && "border-danger bg-danger-soft has-checked:border-danger",
                !right && !wrong && "border-line",
                disabled && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                className="mt-0.5 size-4 shrink-0 accent-accent"
              />
              <span className="min-w-0 flex-1">{option.content}</span>
              {right ? <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" /> : null}
              {wrong ? <CircleX className="size-4 shrink-0 text-danger" aria-hidden="true" /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CodeView({ code, label }: { code: string; label?: string }) {
  return (
    <pre
      aria-label={label}
      className="mt-3 overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[13px] leading-relaxed"
    >
      <code>{code}</code>
    </pre>
  );
}
