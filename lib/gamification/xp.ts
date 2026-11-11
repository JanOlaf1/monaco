import type { ExerciseType } from "@/lib/content/types";

/**
 * XP is awarded for accomplishments, each identified by a stable id. An id is
 * awarded at most once, so re-checking a completed exercise never adds XP.
 */
export const XP_REWARDS = {
  /** Passing a step for the first time. */
  step: 5,
  /** Completing a micro-challenge (all steps passed). */
  challenge: 25,
  /** Completing a lab. */
  lab: 50,
  /** Passing a checkpoint (a lab-sized review of a whole band). */
  checkpoint: 50,
  /** One-time bonus when every exercise in a chapter is complete. */
  chapter: 50,
  /** First correct answer to a mobile practice activity (no crystals). */
  practice: 5,
} as const;

export type AwardKind = "step" | "exercise" | "chapter" | "practice";

/** XP for completing an exercise of a given type. */
export function exerciseXp(type: ExerciseType): number {
  return XP_REWARDS[type];
}

export interface XpAward {
  id: string;
  kind: AwardKind;
  xp: number;
  /** ISO timestamp. */
  at: string;
  /** Local calendar day (YYYY-MM-DD) on which it was earned. */
  day: string;
}

export const accomplishmentId = {
  step: (exerciseId: string, stepId: string) => `step:${exerciseId}:${stepId}`,
  exercise: (exerciseId: string) => `exercise:${exerciseId}`,
  chapter: (courseId: string, chapterId: string) => `chapter:${courseId}:${chapterId}`,
  practice: (activityId: string) => `practice:${activityId}`,
};

export function totalXp(awards: Record<string, XpAward>): number {
  let total = 0;
  for (const award of Object.values(awards)) total += award.xp;
  return total;
}

/** Exercises completed for the first time on `day` (used by the daily goal). */
export function exercisesCompletedOn(awards: Record<string, XpAward>, day: string): number {
  let count = 0;
  for (const award of Object.values(awards)) if (award.kind === "exercise" && award.day === day) count++;
  return count;
}
