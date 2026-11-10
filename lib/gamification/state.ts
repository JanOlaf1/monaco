import { isValidDateKey } from "@/lib/schedule/dates";
import { ACHIEVEMENT_IDS, type AchievementId } from "./achievements";
import { MAX_ACTIVE_DAYS } from "./streaks";
import type { AwardKind, XpAward } from "./xp";

/** Learner gamification data (stored locally under `koodaamo:v1:gamification`). */
export interface GamificationState {
  version: 1;
  /** Awarded accomplishments by id; total XP is their sum (single source of truth). */
  awards: Record<string, XpAward>;
  /** Local days with at least one passed check, sorted ascending. */
  activeDays: string[];
  /** Best streak ever, kept even after old days are trimmed. */
  bestStreak: number;
  achievements: Partial<Record<AchievementId, { at: string }>>;
  /** Step keys whose latest check failed (for the "Bug Hunter" achievement). */
  failedSteps: string[];
  fixedFailingSolution: boolean;
  /** Daily goal in exercises: null = never chosen, 0 = turned off. */
  dailyGoal: number | null;
  /** Course chosen during onboarding. */
  preferredCourse?: string;
  /** Set once XP has been backfilled from progress saved before gamification existed. */
  migratedProgress: boolean;
}

export const DAILY_GOAL_OPTIONS = [1, 2, 3] as const;
export const MAX_FAILED_STEPS = 300;

export const emptyGamification: GamificationState = {
  version: 1,
  awards: {},
  activeDays: [],
  bestStreak: 0,
  achievements: {},
  failedSteps: [],
  fixedFailingSolution: false,
  dailyGoal: null,
  migratedProgress: false,
};

const AWARD_KINDS: AwardKind[] = ["step", "exercise", "chapter"];

/** Validate stored data. Invalid entries are dropped, never the whole state. */
export function parseGamification(raw: unknown): GamificationState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== 1) return null;

  const awards: Record<string, XpAward> = {};
  if (value.awards && typeof value.awards === "object") {
    for (const [id, entry] of Object.entries(value.awards as Record<string, unknown>)) {
      const award = entry as Partial<XpAward> | null;
      if (
        award &&
        award.id === id &&
        AWARD_KINDS.includes(award.kind as AwardKind) &&
        typeof award.xp === "number" &&
        Number.isFinite(award.xp) &&
        award.xp >= 0 &&
        award.xp <= 1000 &&
        typeof award.at === "string" &&
        typeof award.day === "string" &&
        isValidDateKey(award.day)
      ) {
        awards[id] = { id, kind: award.kind as AwardKind, xp: award.xp, at: award.at, day: award.day };
      }
    }
  }

  const activeDays = Array.isArray(value.activeDays)
    ? [...new Set(value.activeDays.filter((day): day is string => typeof day === "string" && isValidDateKey(day)))]
        .sort()
        .slice(-MAX_ACTIVE_DAYS)
    : [];

  const achievements: GamificationState["achievements"] = {};
  if (value.achievements && typeof value.achievements === "object") {
    for (const id of ACHIEVEMENT_IDS) {
      const entry = (value.achievements as Record<string, { at?: unknown } | undefined>)[id];
      if (entry && typeof entry.at === "string") achievements[id] = { at: entry.at };
    }
  }

  const dailyGoal =
    value.dailyGoal === null || value.dailyGoal === undefined
      ? null
      : typeof value.dailyGoal === "number" && [0, ...DAILY_GOAL_OPTIONS].includes(value.dailyGoal as 0)
        ? value.dailyGoal
        : null;

  return {
    version: 1,
    awards,
    activeDays,
    bestStreak:
      typeof value.bestStreak === "number" && Number.isFinite(value.bestStreak) ? Math.max(0, value.bestStreak) : 0,
    achievements,
    failedSteps: Array.isArray(value.failedSteps)
      ? value.failedSteps.filter((key): key is string => typeof key === "string").slice(-MAX_FAILED_STEPS)
      : [],
    fixedFailingSolution: value.fixedFailingSolution === true,
    dailyGoal,
    preferredCourse: typeof value.preferredCourse === "string" ? value.preferredCourse : undefined,
    migratedProgress: value.migratedProgress === true,
  };
}
