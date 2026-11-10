"use client";

import { useSyncExternalStore } from "react";

/** Desktop panel widths in percent. A per-browser convenience setting. */
export interface PanelSizes {
  left: number;
  right: number;
}

const KEY = "koodaamo:workspace-layout";
export const DEFAULT_SIZES: PanelSizes = { left: 32, right: 28 };
export const LIMITS = { left: [20, 48], right: [18, 45], centerMin: 28 } as const;

let cached: PanelSizes | null = null;
const listeners = new Set<() => void>();

export function clampSizes(sizes: PanelSizes): PanelSizes {
  const left = Math.min(LIMITS.left[1], Math.max(LIMITS.left[0], sizes.left));
  let right = Math.min(LIMITS.right[1], Math.max(LIMITS.right[0], sizes.right));
  if (left + right > 100 - LIMITS.centerMin) right = Math.max(LIMITS.right[0], 100 - LIMITS.centerMin - left);
  return { left: Math.round(left * 10) / 10, right: Math.round(right * 10) / 10 };
}

function read(): PanelSizes {
  if (cached) return cached;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<PanelSizes> | null;
    cached =
      raw && typeof raw.left === "number" && typeof raw.right === "number"
        ? clampSizes({ left: raw.left, right: raw.right })
        : DEFAULT_SIZES;
  } catch {
    cached = DEFAULT_SIZES;
  }
  return cached;
}

export function setPanelSizes(sizes: PanelSizes, persist = true) {
  cached = clampSizes(sizes);
  for (const listener of listeners) listener();
  if (!persist) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    // Not critical.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverSizes = () => DEFAULT_SIZES;

export function usePanelSizes(): PanelSizes {
  return useSyncExternalStore(subscribe, read, serverSizes);
}
