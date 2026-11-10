import type { ExerciseType } from "@/lib/content/types";
import { isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";
import { toDateKey } from "@/lib/schedule/dates";
import { newlyUnlocked, type AchievementContext, type AchievementId } from "./achievements";
import { levelInfo } from "./levels";
import { MAX_FAILED_STEPS, type GamificationState } from "./state";
import { addActiveDay, streakInfo, type StreakInfo } from "./streaks";
import { XP_REWARDS, accomplishmentId, exercisesCompletedOn, totalXp, type XpAward } from "./xp";

/** The minimal content structure the engine needs (ids only, no texts). */
export interface GamificationCatalog {
  exercises: Record<string, { courseId: string; chapterId: string; type: ExerciseType; stepIds: string[] }>;
  chapters: { courseId: string; chapterId: string; language: string; exerciseIds: string[] }[];
}

export interface Rewards {
  /** XP awards created by this event (empty when everything was already earned). */
  awards: XpAward[];
  xpGained: number;
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  achievements: AchievementId[];
  exerciseCompleted: boolean;
  chapterCompleted?: { courseId: string; chapterId: string };
  streak: StreakInfo;
  /** First passed check today. */
  firstActivityToday: boolean;
  dailyGoal?: { done: number; target: number; reachedNow: boolean };
}

export function chapterIsComplete(
  chapter: GamificationCatalog["chapters"][number],
  progress: ProgressState,
): boolean {
  return chapter.exerciseIds.length > 0 && chapter.exerciseIds.every((id) => isExerciseCompleted(progress, id));
}

export function buildAchievementContext(
  state: GamificationState,
  progress: ProgressState,
  catalog: GamificationCatalog,
): AchievementContext {
  const completedIds = Object.keys(progress.exercises).filter((id) => isExerciseCompleted(progress, id));
  const completedChapters = { python: 0, javascript: 0 };
  for (const chapter of catalog.chapters) {
    if (chapterIsComplete(chapter, progress) && (chapter.language === "python" || chapter.language === "javascript")) {
      completedChapters[chapter.language] += 1;
    }
  }
  return {
    completedExercises: completedIds.length,
    completedLabs: completedIds.filter((id) => catalog.exercises[id]?.type === "lab").length,
    fixedFailingSolution: state.fixedFailingSolution,
    bestStreak: state.bestStreak,
    completedChapters,
  };
}

function award(state: GamificationState, awards: XpAward[], entry: XpAward) {
  if (state.awards[entry.id] || awards.some((existing) => existing.id === entry.id)) return;
  awards.push(entry);
}

function unlockAchievements(
  state: GamificationState,
  progress: ProgressState,
  catalog: GamificationCatalog,
  at: string,
): { state: GamificationState; unlocked: AchievementId[] } {
  const unlocked = newlyUnlocked(buildAchievementContext(state, progress, catalog), state.achievements);
  if (!unlocked.length) return { state, unlocked };
  const achievements = { ...state.achievements };
  for (const id of unlocked) achievements[id] = { at };
  return { state: { ...state, achievements }, unlocked };
}

/**
 * Apply a passed check. `progress` must already include the pass (see
 * `recordStepPassed`). Awards are keyed by accomplishment id, so calling
 * this again for the same step adds no XP.
 */
export function applyStepPass(input: {
  state: GamificationState;
  progress: ProgressState;
  catalog: GamificationCatalog;
  exerciseId: string;
  stepId: string;
  now: Date;
}): { state: GamificationState; rewards: Rewards } {
  const { progress, catalog, exerciseId, stepId, now } = input;
  const at = now.toISOString();
  const day = toDateKey(now);
  const before = input.state;
  const exercise = catalog.exercises[exerciseId];
  const awards: XpAward[] = [];

  const stepKey = accomplishmentId.step(exerciseId, stepId);
  award(before, awards, { id: stepKey, kind: "step", xp: XP_REWARDS.step, at, day });

  const exerciseCompleted = isExerciseCompleted(progress, exerciseId);
  if (exerciseCompleted && exercise) {
    award(before, awards, {
      id: accomplishmentId.exercise(exerciseId),
      kind: "exercise",
      xp: exercise.type === "lab" ? XP_REWARDS.lab : XP_REWARDS.challenge,
      at,
      day,
    });
  }

  let chapterCompleted: Rewards["chapterCompleted"];
  const chapter = exercise
    ? catalog.chapters.find((candidate) => candidate.courseId === exercise.courseId && candidate.chapterId === exercise.chapterId)
    : undefined;
  if (chapter && chapterIsComplete(chapter, progress)) {
    const id = accomplishmentId.chapter(chapter.courseId, chapter.chapterId);
    if (!before.awards[id]) {
      award(before, awards, { id, kind: "chapter", xp: XP_REWARDS.chapter, at, day });
      chapterCompleted = { courseId: chapter.courseId, chapterId: chapter.chapterId };
    }
  }

  const firstActivityToday = !before.activeDays.includes(day);
  const activeDays = addActiveDay(before.activeDays, day);
  const streak = streakInfo(activeDays, day, before.bestStreak);
  const fixed = before.failedSteps.includes(stepKey);

  let state: GamificationState = {
    ...before,
    awards: { ...before.awards, ...Object.fromEntries(awards.map((entry) => [entry.id, entry])) },
    activeDays,
    bestStreak: streak.longest,
    failedSteps: fixed ? before.failedSteps.filter((key) => key !== stepKey) : before.failedSteps,
    fixedFailingSolution: before.fixedFailingSolution || fixed,
  };
  const result = unlockAchievements(state, progress, catalog, at);
  state = result.state;

  const xpBefore = totalXp(before.awards);
  const xpAfter = totalXp(state.awards);
  const target = state.dailyGoal ?? 0;
  const doneBefore = exercisesCompletedOn(before.awards, day);
  const done = exercisesCompletedOn(state.awards, day);

  return {
    state,
    rewards: {
      awards,
      xpGained: xpAfter - xpBefore,
      totalXp: xpAfter,
      levelBefore: levelInfo(xpBefore).level,
      levelAfter: levelInfo(xpAfter).level,
      achievements: result.unlocked,
      exerciseCompleted,
      chapterCompleted,
      streak,
      firstActivityToday,
      dailyGoal: target > 0 ? { done, target, reachedNow: doneBefore < target && done >= target } : undefined,
    },
  };
}

/** Remember a failed check so fixing it later can unlock "Bug Hunter". */
export function applyCheckFailure(state: GamificationState, exerciseId: string, stepId: string): GamificationState {
  const key = accomplishmentId.step(exerciseId, stepId);
  if (state.failedSteps.includes(key)) return state;
  return { ...state, failedSteps: [...state.failedSteps, key].slice(-MAX_FAILED_STEPS) };
}

function dayOf(iso: string | undefined, fallback: Date): string {
  const date = iso ? new Date(iso) : fallback;
  return toDateKey(Number.isNaN(date.getTime()) ? fallback : date);
}

/**
 * One-time migration for progress saved before gamification existed: awards
 * XP for steps, exercises and chapters the learner had genuinely completed,
 * dated when they were completed. Safe to run repeatedly (ids are unique).
 */
export function backfillFromProgress(
  state: GamificationState,
  progress: ProgressState,
  catalog: GamificationCatalog,
  now: Date,
): GamificationState {
  if (state.migratedProgress) return state;
  const awards: XpAward[] = [];
  let activeDays = state.activeDays;
  for (const [exerciseId, entry] of Object.entries(progress.exercises)) {
    const exercise = catalog.exercises[exerciseId];
    if (!exercise) continue;
    const stepDay = dayOf(entry.updatedAt, now);
    for (const stepId of entry.completedStepIds) {
      if (!exercise.stepIds.includes(stepId)) continue;
      award(state, awards, {
        id: accomplishmentId.step(exerciseId, stepId),
        kind: "step",
        xp: XP_REWARDS.step,
        at: entry.updatedAt,
        day: stepDay,
      });
    }
    if (entry.completedAt) {
      const day = dayOf(entry.completedAt, now);
      award(state, awards, {
        id: accomplishmentId.exercise(exerciseId),
        kind: "exercise",
        xp: exercise.type === "lab" ? XP_REWARDS.lab : XP_REWARDS.challenge,
        at: entry.completedAt,
        day,
      });
      activeDays = addActiveDay(activeDays, day);
    }
  }
  for (const chapter of catalog.chapters) {
    if (!chapterIsComplete(chapter, progress)) continue;
    const latest = chapter.exerciseIds
      .map((id) => progress.exercises[id]?.completedAt ?? "")
      .sort()
      .at(-1);
    award(state, awards, {
      id: accomplishmentId.chapter(chapter.courseId, chapter.chapterId),
      kind: "chapter",
      xp: XP_REWARDS.chapter,
      at: latest || now.toISOString(),
      day: dayOf(latest, now),
    });
  }
  let next: GamificationState = {
    ...state,
    awards: { ...state.awards, ...Object.fromEntries(awards.map((entry) => [entry.id, entry])) },
    activeDays,
    bestStreak: streakInfo(activeDays, toDateKey(now), state.bestStreak).longest,
    migratedProgress: true,
  };
  next = unlockAchievements(next, progress, catalog, now.toISOString()).state;
  return next;
}

export function dailyGoalProgress(state: GamificationState, today: string): { done: number; target: number } {
  return { done: exercisesCompletedOn(state.awards, today), target: state.dailyGoal ?? 0 };
}
