"use client";

import { CircleCheck, CircleX, Eraser, Eye, Info, LoaderCircle, Terminal, TriangleExclamationPoint } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { languageNames } from "@/components/ui/language-mark";
import { cn } from "@/lib/cn";
import type { ProgrammingLanguage } from "@/lib/content/types";
import { explainError } from "@/lib/execution/explain";
import type { ExecutionError, OutputEntry, RunnerStatus, RunResult } from "@/lib/execution/types";
import { useI18n } from "@/lib/i18n/client";
import { format, plural } from "@/lib/i18n/format";
import type { BusyState } from "./editor-panel";

export interface LastRun {
  kind: "run" | "check";
  result: RunResult;
  passed?: number;
  total?: number;
}

const streamClass: Record<OutputEntry["stream"], string> = {
  stdout: "text-fg",
  log: "text-fg",
  info: "text-fg-muted",
  debug: "text-fg-subtle",
  warn: "text-warning",
  error: "text-danger",
  stderr: "text-danger",
};

export function OutputPanel({
  language,
  entries,
  lastRun,
  busy,
  runnerStatus,
  runnerAvailable,
  onClear,
}: {
  language: ProgrammingLanguage;
  entries: OutputEntry[];
  lastRun: LastRun | null;
  busy: BusyState;
  runnerStatus: RunnerStatus;
  runnerAvailable: boolean;
  onClear: () => void;
}) {
  const { locale, dict } = useI18n();
  const o = dict.workspace.output;
  const [tab, setTab] = useState<"console" | "preview">("console");
  const result = busy ? null : lastRun?.result;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-line px-2">
        <div role="tablist" aria-label={dict.workspace.panels.output} className="flex items-center gap-1">
          {(
            [
              { id: "console", label: o.console, icon: Terminal },
              { id: "preview", label: o.preview, icon: Eye },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                tab === id ? "bg-muted text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        {tab === "console" ? (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={onClear}
            disabled={busy !== null || (entries.length === 0 && !lastRun)}
            aria-label={o.clear}
            title={o.clear}
          >
            <Eraser aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      {tab === "console" ? (
        <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite" aria-busy={busy !== null}>
          <div className="space-y-3 p-3 font-mono text-[13px] leading-[1.6]">
            {language === "python" && runnerStatus === "loading" ? (
              <Notice icon={<LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}>
                {dict.workspace.runtime.loadingPython}
              </Notice>
            ) : null}
            {language === "python" && runnerStatus === "error" && !busy ? (
              <Notice tone="danger" icon={<TriangleExclamationPoint className="size-4" aria-hidden="true" />}>
                {dict.workspace.runtime.pythonFailed}
              </Notice>
            ) : null}
            {!runnerAvailable ? (
              <Notice icon={<Info className="size-4" aria-hidden="true" />}>
                {format(dict.workspace.runtime.unavailable, { language: languageNames[language] })}
              </Notice>
            ) : null}

            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                {entries.map((entry, index) => (
                  <pre
                    key={index}
                    className={cn("min-h-[1.6em] whitespace-pre-wrap wrap-break-word", streamClass[entry.stream])}
                  >
                    {entry.text}
                  </pre>
                ))}
              </div>
            ) : null}

            {!busy && !lastRun && entries.length === 0 && runnerAvailable ? (
              <p className="font-sans text-sm text-fg-subtle">{o.empty}</p>
            ) : null}
            {result && result.status === "ok" && entries.length === 0 ? (
              <p className="font-sans text-sm text-fg-subtle">{o.noOutput}</p>
            ) : null}
            {result?.truncated ? <p className="font-sans text-xs text-warning">{o.truncated}</p> : null}
            {result?.stoppedTimers ? (
              <p className="font-sans text-xs text-fg-subtle">{plural(locale, o.timersStopped, result.stoppedTimers)}</p>
            ) : null}
            {result?.error ? <ErrorCard language={language} error={result.error} /> : null}
            {lastRun && result ? <RunSummary lastRun={lastRun} /> : null}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="max-w-xs text-center text-sm text-fg-muted">
            <Eye className="mx-auto mb-3 size-5 text-fg-subtle" aria-hidden="true" />
            <p>{o.previewUnavailable}</p>
            <p className="mt-2 text-xs text-fg-subtle">{o.previewPlanned}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Notice({
  icon,
  tone = "neutral",
  children,
}: {
  icon: ReactNode;
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border px-3 py-2.5 font-sans text-[13px] leading-snug",
        tone === "danger" ? "border-danger/30 bg-danger-soft text-fg" : "border-line bg-muted text-fg-muted",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p>{children}</p>
    </div>
  );
}

function ErrorCard({ language, error }: { language: ProgrammingLanguage; error: ExecutionError }) {
  const { dict } = useI18n();
  const o = dict.workspace.output;
  const friendly = explainError(language, error, dict);
  const showRaw = error.kind === "syntax" || error.kind === "runtime";
  return (
    <div role="alert" className="overflow-hidden rounded-lg border border-danger/30 bg-danger-soft font-sans">
      {showRaw ? (
        <div className="flex items-start gap-2 px-3 py-2.5">
          <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[13px] font-semibold text-danger wrap-anywhere">
              {error.name}
              {error.message ? `: ${error.message}` : ""}
            </p>
            {error.line ? (
              <p className="mt-0.5 text-xs text-fg-muted">{format(o.errorAt, { line: error.line })}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={cn("px-3 py-2.5 text-[13px] leading-snug", showRaw && "border-t border-danger/20")}>
        {showRaw ? <p className="text-xs font-semibold text-fg-muted">{o.friendly}</p> : null}
        <p className={cn("text-fg", showRaw && "mt-0.5")}>{friendly}</p>
      </div>
      {error.traceback ? (
        <details className="border-t border-danger/20 px-3 py-2">
          <summary className="cursor-pointer text-xs text-fg-muted">{dict.workspace.tests.technicalDetail}</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre font-mono text-[12px] text-fg-muted">{error.traceback}</pre>
        </details>
      ) : null}
    </div>
  );
}

function RunSummary({ lastRun }: { lastRun: LastRun }) {
  const { dict } = useI18n();
  const o = dict.workspace.output;
  const { result } = lastRun;
  if (result.error?.kind === "timeout" || result.error?.kind === "internal") return null;
  const text =
    lastRun.kind === "check"
      ? format(o.checkFinished, { ms: result.durationMs, passed: lastRun.passed ?? 0, total: lastRun.total ?? 0 })
      : result.status === "error"
        ? o.stopped
        : format(o.finished, { ms: result.durationMs });
  const ok = lastRun.kind === "check" ? lastRun.passed === lastRun.total : result.status === "ok";
  return (
    <p className={cn("flex items-center gap-1.5 border-t border-line pt-2 font-sans text-xs", ok ? "text-fg-subtle" : "text-fg-muted")}>
      {ok ? <CircleCheck className="size-3.5 text-success" aria-hidden="true" /> : null}
      {text}
    </p>
  );
}
