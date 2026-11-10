"use client";

import { Flame, Star, Target } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LevelInfo } from "@/lib/gamification/levels";
import type { StreakInfo } from "@/lib/gamification/streaks";
import { useI18n } from "@/lib/i18n/client";
import { format, plural } from "@/lib/i18n/format";

/** Level number in a rounded tile plus an XP bar toward the next level. */
export function LevelProgress({ level, compact = false }: { level: LevelInfo; compact?: boolean }) {
  const { dict } = useI18n();
  const g = dict.gamification;
  const percent = Math.round(level.progress * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex shrink-0 flex-col items-center justify-center rounded-xl bg-xp-soft font-semibold text-xp",
          compact ? "size-10" : "size-14",
        )}
      >
        <Star className={compact ? "size-3.5" : "size-4"} fill="currentColor" aria-hidden="true" />
        <span className={cn("leading-none tabular-nums", compact ? "text-sm" : "mt-0.5 text-lg")}>{level.level}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{format(g.level, { level: level.level })}</p>
          <p className="text-xs tabular-nums text-fg-subtle">
            {format(g.xpProgress, { current: level.xpIntoLevel, total: level.xpForLevel })}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={format(g.xpToNext, { xp: level.xpToNext, level: level.level + 1 })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-xp transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        {!compact ? (
          <p className="mt-1 text-xs text-fg-muted">{format(g.xpToNext, { xp: level.xpToNext, level: level.level + 1 })}</p>
        ) : null}
      </div>
    </div>
  );
}

export function StreakBadge({ streak, className }: { streak: StreakInfo; className?: string }) {
  const { locale, dict } = useI18n();
  const g = dict.gamification;
  const active = streak.current > 0;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-streak-soft text-streak" : "bg-muted text-fg-subtle",
        )}
      >
        <Flame className="size-5" fill={streak.activeToday ? "currentColor" : "none"} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{active ? plural(locale, g.streak, streak.current) : g.streakNone}</p>
        <p className="text-xs text-fg-muted">
          {active ? (streak.activeToday ? g.streakActiveToday : g.streakKeepGoing) : plural(locale, g.bestStreak, streak.longest)}
        </p>
      </div>
    </div>
  );
}

/** Circular progress for the daily goal. */
export function GoalRing({ done, target, size = 40 }: { done: number; target: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, done / target) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={5} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        className={cn("transition-[stroke-dashoffset] duration-500", ratio >= 1 ? "stroke-success" : "stroke-accent")}
      />
    </svg>
  );
}

export function DailyGoalSummary({ done, target }: { done: number; target: number }) {
  const { dict } = useI18n();
  const g = dict.gamification;
  return (
    <div className="flex items-center gap-3">
      {target > 0 ? (
        <GoalRing done={done} target={target} />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-fg-subtle">
          <Target className="size-5" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold">{g.dailyGoal}</p>
        <p className="text-xs text-fg-muted">
          {target > 0 ? (done >= target ? g.dailyGoalDone : format(g.dailyGoalProgress, { done, target })) : g.dailyGoalOff}
        </p>
      </div>
    </div>
  );
}
