"use client";

import { cn } from "@/lib/cn";
import { DAILY_GOAL_OPTIONS } from "@/lib/gamification/state";
import { useI18n } from "@/lib/i18n/client";
import { plural } from "@/lib/i18n/format";
import { gamificationActions } from "@/lib/learner/hooks";

/** Segmented control for the optional daily goal (0 = no goal). */
export function DailyGoalPicker({ value }: { value: number | null }) {
  const { locale, dict } = useI18n();
  const g = dict.gamification;
  const options = [0, ...DAILY_GOAL_OPTIONS];
  return (
    <div className="@container">
      <div role="radiogroup" aria-label={g.dailyGoalSet} className="grid grid-cols-2 gap-1.5 @md:grid-cols-4">
        {options.map((option) => {
          const selected = (value ?? 0) === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => gamificationActions.setDailyGoal(option)}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left text-[13px] transition-colors",
                selected ? "border-accent bg-accent-soft font-medium text-fg" : "border-line text-fg-muted hover:bg-hover",
              )}
            >
              {option === 0 ? g.dailyGoalNone : plural(locale, g.dailyGoalOption, option)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-fg-subtle">{g.dailyGoalHint}</p>
    </div>
  );
}
