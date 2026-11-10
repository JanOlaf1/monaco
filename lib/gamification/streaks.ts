import { addDays, daysBetween, isValidDateKey } from "@/lib/schedule/dates";

/**
 * Learning streaks are computed from the set of local calendar days on which
 * the learner passed at least one check. Day keys (YYYY-MM-DD) come from the
 * learner's local clock, and day arithmetic uses calendar dates, so midnight
 * and daylight-saving changes cannot double-count or skip a day.
 *
 * A streak stays "current" until the end of the day after the last active
 * day: studying yesterday but not yet today keeps it alive. Missing a day only
 * resets the streak counter; nothing else is affected.
 */

/** How many days of history to keep (the best streak is stored separately). */
export const MAX_ACTIVE_DAYS = 730;

export function addActiveDay(days: readonly string[], day: string): string[] {
  if (!isValidDateKey(day)) return [...days];
  if (days.includes(day)) return [...days];
  const next = [...days, day].sort();
  return next.length > MAX_ACTIVE_DAYS ? next.slice(next.length - MAX_ACTIVE_DAYS) : next;
}

export function currentStreak(days: readonly string[], today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function longestStreak(days: readonly string[]): number {
  const sorted = [...new Set(days)].filter(isValidDateKey).sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
  lastActiveDay?: string;
}

export function streakInfo(days: readonly string[], today: string, storedBest = 0): StreakInfo {
  const current = currentStreak(days, today);
  return {
    current,
    longest: Math.max(storedBest, longestStreak(days), current),
    activeToday: days.includes(today),
    lastActiveDay: days.length ? [...days].sort()[days.length - 1] : undefined,
  };
}

/** The last `count` days ending today, oldest first, with activity flags. */
export function recentDays(days: readonly string[], today: string, count: number): { day: string; active: boolean }[] {
  const set = new Set(days);
  return Array.from({ length: count }, (_, index) => {
    const day = addDays(today, index - count + 1);
    return { day, active: set.has(day) };
  });
}
