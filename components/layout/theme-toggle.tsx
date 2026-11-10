"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { setThemePreference, useTheme, useThemeAttribute, type ThemePreference } from "@/lib/theme/theme";

const order: ThemePreference[] = ["system", "light", "dark"];

export function ThemeToggle() {
  const { dict } = useI18n();
  const { preference } = useTheme();
  useThemeAttribute();

  const labels: Record<ThemePreference, string> = {
    light: dict.nav.themeLight,
    dark: dict.nav.themeDark,
    system: dict.nav.themeSystem,
  };
  const next = order[(order.indexOf(preference) + 1) % order.length];
  const Icon = preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => setThemePreference(next)}
      aria-label={`${dict.nav.theme}: ${labels[preference]}. ${labels[next]}?`}
      title={`${dict.nav.theme}: ${labels[preference]}`}
      className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface text-fg-muted transition-colors hover:bg-hover hover:text-fg"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
