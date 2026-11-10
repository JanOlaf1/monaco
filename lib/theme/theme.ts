"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "koodaamo:theme";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

function apply(theme: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readPreference() === "system") apply(systemTheme());
    notify();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      apply(resolve(readPreference()));
      notify();
    }
  };
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// Snapshots are strings so React can compare them by value.
const getSnapshot = () => `${readPreference()}:${resolve(readPreference())}`;
const getServerSnapshot = () => "system:light";

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage unavailable: the choice applies to this page view only.
  }
  apply(resolve(preference));
  notify();
}

export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, resolved] = snapshot.split(":") as [ThemePreference, ResolvedTheme];
  return { preference, resolved };
}

/**
 * Re-applies the theme attribute after mount. The inline script in the root
 * layout sets it before first paint; in development React's Strict Mode
 * remount can clear attributes on <html>, so this restores it.
 */
export function useThemeAttribute() {
  useLayoutEffect(() => {
    apply(resolve(readPreference()));
  }, []);
}
