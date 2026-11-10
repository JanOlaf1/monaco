"use client";

import { Circle, CircleCheck, CircleMinus, CircleX, EyeOff } from "lucide-react";
import { InlineMarkdown } from "@/components/content/markdown";
import { cn } from "@/lib/cn";
import type { LocalizedTest } from "@/lib/content/localize";
import type { TestResult } from "@/lib/execution/types";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

function StatusIcon({ result }: { result?: TestResult }) {
  if (!result) return <Circle className="size-4 text-fg-subtle" aria-hidden="true" />;
  switch (result.status) {
    case "pass":
      return <CircleCheck className="size-4 text-success" aria-hidden="true" />;
    case "fail":
    case "error":
      return <CircleX className="size-4 text-danger" aria-hidden="true" />;
    case "skipped":
      return <CircleMinus className="size-4 text-fg-subtle" aria-hidden="true" />;
  }
}

/** One row per requirement, with an explanation and expected/received values on failure. */
export function TestList({
  tests,
  allTests,
  results,
}: {
  tests: LocalizedTest[];
  /** The step's full test list, so hidden-check numbers stay stable when `tests` is a subset. */
  allTests?: LocalizedTest[];
  results?: TestResult[];
}) {
  const { dict } = useI18n();
  const t = dict.workspace.tests;
  const hiddenNumbers = new Map(
    (allTests ?? tests).filter((test) => test.hidden).map((test, index) => [test.id, index + 1] as const),
  );

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {tests.map((test) => {
        const result = results?.find((candidate) => candidate.id === test.id);
        const failed = result?.status === "fail" || result?.status === "error";
        const statusText = !result
          ? t.notRun
          : result.status === "pass"
            ? t.passed
            : result.status === "skipped"
              ? t.notRun
              : t.failed;
        return (
          <li
            key={test.id}
            className={cn("flex gap-2.5 px-3 py-2.5 text-[13.5px]", failed && "bg-danger-soft")}
            data-test-id={test.id}
            data-status={result?.status ?? "pending"}
          >
            <span className="mt-0.5">
              <StatusIcon result={result} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("leading-snug", result?.status === "pass" ? "text-fg-muted" : "text-fg")}>
                <span className="sr-only">{statusText}: </span>
                {test.hidden ? (
                  <span className="inline-flex items-center gap-1.5">
                    <EyeOff className="size-3.5 text-fg-subtle" aria-hidden="true" />
                    {format(t.hidden, { number: hiddenNumbers.get(test.id) ?? 1 })}
                  </span>
                ) : (
                  <InlineMarkdown source={test.label} />
                )}
              </p>
              {failed ? (
                <div className="mt-1.5 space-y-2">
                  <p className="leading-snug text-fg-muted">
                    {result.status === "error" ? dict.workspace.runtime.testSuiteError : <InlineMarkdown source={test.failure} />}
                  </p>
                  {!test.hidden && (result.expected !== undefined || result.actual !== undefined) ? (
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-[12px]">
                      {result.expected !== undefined ? (
                        <>
                          <dt className="text-fg-subtle">{t.expected}</dt>
                          <dd className="whitespace-pre-wrap wrap-break-word text-success">{result.expected}</dd>
                        </>
                      ) : null}
                      {result.actual !== undefined ? (
                        <>
                          <dt className="text-fg-subtle">{t.received}</dt>
                          <dd className="whitespace-pre-wrap wrap-break-word text-danger">{result.actual}</dd>
                        </>
                      ) : null}
                    </dl>
                  ) : null}
                  {!test.hidden && result.message && result.status !== "error" ? (
                    <p className="font-mono text-[11.5px] text-fg-subtle wrap-anywhere">
                      {t.technicalDetail}: {result.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
