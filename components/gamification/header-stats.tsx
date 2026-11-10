"use client";

import { Flame, Star } from "lucide-react";
import Link from "next/link";
import { useLearnerSummary } from "@/components/learner/use-learner-summary";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

/** Compact streak + level indicator for returning learners. Links to the progress page. */
export function HeaderStats() {
  const { locale, dict } = useI18n();
  const { summary, hydrated } = useLearnerSummary();
  if (!hydrated || !summary.isReturning) return null;
  const { level, streak } = summary;
  return (
    <Link
      href={`/${locale}/progress`}
      aria-label={format(dict.nav.statsLink, { level: level.level, xp: level.totalXp })}
      className="rise-in flex h-8 items-center gap-2.5 rounded-md border border-line bg-surface px-2.5 text-xs font-semibold tabular-nums transition-colors hover:bg-hover"
    >
      <span className={cn("flex items-center gap-1", streak.current > 0 ? "text-streak" : "text-fg-subtle")}>
        <Flame className="size-3.5" fill={streak.activeToday ? "currentColor" : "none"} aria-hidden="true" />
        {streak.current}
      </span>
      <span className="h-3.5 w-px bg-line" aria-hidden="true" />
      <span className="flex items-center gap-1 text-xp">
        <Star className="size-3.5" fill="currentColor" aria-hidden="true" />
        <span className="max-sm:hidden">{format(dict.gamification.levelShort, { level: level.level })}</span>
        <span className="sm:hidden">{level.level}</span>
      </span>
    </Link>
  );
}
