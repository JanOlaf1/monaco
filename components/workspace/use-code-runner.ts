"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ProgrammingLanguage } from "@/lib/content/types";
import { getRunner, isRunnerAvailable } from "@/lib/execution/registry";
import type { CodeRunner, RunnerStatus } from "@/lib/execution/types";

const noopSubscribe = () => () => {};
const idle = (): RunnerStatus => "idle";

/**
 * Loads the shared runner for a language and exposes its status. Python's
 * runtime starts downloading as soon as an exercise is opened, so the first
 * Run is faster.
 */
export function useCodeRunner(language: ProgrammingLanguage) {
  const available = isRunnerAvailable(language);
  const [runner, setRunner] = useState<CodeRunner | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pending = getRunner(language);
    pending
      ?.then((loaded) => {
        if (cancelled) return;
        setRunner(loaded);
        void loaded.prepare().catch(() => undefined);
      })
      .catch((error) => console.error("[runner] Failed to load runner:", error));
    return () => {
      cancelled = true;
    };
  }, [language]);

  const status = useSyncExternalStore(
    runner?.subscribe ?? noopSubscribe,
    runner?.getStatus ?? idle,
    idle,
  );

  return { available, runner, status };
}
