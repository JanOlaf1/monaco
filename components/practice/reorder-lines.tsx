"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

/**
 * Reorder code lines with explicit up/down buttons: works with touch,
 * keyboard and screen readers (no drag-and-drop required). Focus stays on
 * the moved line's button, and each move is announced.
 */
export function ReorderLines({
  lines,
  order,
  onChange,
  disabled,
  tone,
}: {
  lines: string[];
  /** Current arrangement as indexes into `lines`. */
  order: number[];
  onChange: (order: number[]) => void;
  disabled: boolean;
  tone: "neutral" | "right" | "wrong";
}) {
  const { dict } = useI18n();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [announcement, setAnnouncement] = useState("");

  const move = (position: number, delta: -1 | 1) => {
    const target = position + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[position], next[target]] = [next[target], next[position]];
    onChange(next);
    setAnnouncement(format(dict.practice.moved, { position: target + 1, total: order.length }));
    // Keep focus on the same control of the moved line; at an edge, use the other direction.
    const line = order[position];
    const atEdge = (delta === -1 && target === 0) || (delta === 1 && target === order.length - 1);
    const key = `${line}:${atEdge ? -delta : delta}`;
    requestAnimationFrame(() => buttons.current.get(key)?.focus());
  };

  return (
    <div>
      <ol
        className={cn(
          "mt-3 space-y-1.5 rounded-xl border-2 p-2",
          tone === "right" ? "border-success bg-success-soft" : tone === "wrong" ? "border-danger bg-danger-soft" : "border-line bg-muted",
        )}
      >
        {order.map((lineIndex, position) => {
          const line = lines[lineIndex];
          const label = line.trim();
          return (
            <li key={lineIndex} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface p-1 pl-2">
              <span className="w-5 shrink-0 text-right font-mono text-[11px] text-fg-subtle" aria-hidden="true">
                {position + 1}
              </span>
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre py-1.5 font-mono text-[13px]">{line}</code>
              <span className="flex shrink-0 gap-1">
                {([-1, 1] as const).map((delta) => {
                  const Icon = delta === -1 ? ArrowUp : ArrowDown;
                  const blocked = delta === -1 ? position === 0 : position === order.length - 1;
                  return (
                    <button
                      key={delta}
                      type="button"
                      ref={(element) => {
                        const key = `${lineIndex}:${delta}`;
                        if (element) buttons.current.set(key, element);
                        else buttons.current.delete(key);
                      }}
                      onClick={() => move(position, delta)}
                      disabled={disabled || blocked}
                      aria-label={format(delta === -1 ? dict.practice.moveUp : dict.practice.moveDown, { line: label })}
                      className="inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface text-fg-muted transition-colors hover:bg-hover hover:text-fg disabled:opacity-30 sm:size-9"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </button>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
