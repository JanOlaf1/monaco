"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OutputEntry } from "@/lib/execution/types";

const MAX_ENTRIES = 2_000;

/** Output entries with streamed appends batched per animation frame. */
export function useOutputLog() {
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const pending = useRef<OutputEntry[]>([]);
  const frame = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    pending.current = [];
  }, []);

  const append = useCallback((entry: OutputEntry) => {
    pending.current.push(entry);
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const batch = pending.current;
      pending.current = [];
      setEntries((previous) => [...previous, ...batch].slice(-MAX_ENTRIES));
    });
  }, []);

  const replace = useCallback(
    (next: OutputEntry[]) => {
      cancel();
      setEntries(next.slice(-MAX_ENTRIES));
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { entries, append, replace };
}
