"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { setThemePreference, useTheme, type ThemePreference } from "@/lib/theme/theme";

/** Light, dark or system theme as a radio group (same preference as the header toggle). */
export function ThemeChoice() {
  const { dict } = useI18n();
  const { preference } = useTheme();
  const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "system", label: dict.nav.themeSystem, icon: Monitor },
    { value: "light", label: dict.nav.themeLight, icon: Sun },
    { value: "dark", label: dict.nav.themeDark, icon: Moon },
  ];
  return (
    <fieldset>
      <legend className="text-sm font-medium">{dict.nav.theme}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 bg-surface px-2 text-sm",
              "has-checked:border-accent has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
              "border-line text-fg-muted",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => setThemePreference(value)}
              className="sr-only"
            />
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
