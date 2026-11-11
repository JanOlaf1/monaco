"use client";

import { useSyncExternalStore } from "react";
import { recordAdventurePass } from "@/lib/adventure/hooks";
import { publishRewards } from "@/lib/gamification/celebrations";
import {
  applyCheckFailure,
  applyStepPass,
  backfillFromProgress,
  type GamificationCatalog,
  type Rewards,
} from "@/lib/gamification/engine";
import type { CatalogCourse } from "@/lib/content/catalog";
import type { SkillLevel } from "@/lib/content/types";
import {
  applyPlacementResult,
  dismissPlacementPrompt,
  migrateCompetency,
  setOnboarding,
  setRecommendation,
  setSelfReportedLevel,
  setUserOverride,
  type PlacementResult,
  type SelfReportedLevel,
  type TrackId,
} from "@/lib/learning/competency";
import { recommendForTrack } from "@/lib/learning/recommend";
import { setDraftFile } from "@/lib/progress/drafts";
import { recordStepPassed, recordVisit, setCurrentStep } from "@/lib/progress/progress";
import { removeDeadline, setDeadline, targetKey, type DeadlineTarget } from "@/lib/schedule/deadlines";
import type { PersistentStore, StoreSnapshot } from "@/lib/storage/persistent-store";
import { competencyStore, draftsStore, gamificationStore, progressStore, scheduleStore } from "./stores";
import { hasLearnerActivity } from "./summary";

export function useStore<T>(store: PersistentStore<T>): StoreSnapshot<T> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export const useProgress = () => useStore(progressStore);
export const useSchedule = () => useStore(scheduleStore);
export const useGamification = () => useStore(gamificationStore);
export const useCompetency = () => useStore(competencyStore);

/** Only re-renders when hydration state changes (not on every keystroke). */
export function useDraftsHydrated(): boolean {
  return useSyncExternalStore(
    draftsStore.subscribe,
    () => draftsStore.getSnapshot().hydrated,
    () => false,
  );
}

const nowIso = () => new Date().toISOString();

export const progressActions = {
  visit(courseId: string, exerciseId: string) {
    progressStore.update((state) => recordVisit(state, courseId, exerciseId, nowIso()));
  },
  setCurrentStep(exerciseId: string, stepId: string) {
    progressStore.update((state) => setCurrentStep(state, exerciseId, stepId, nowIso()));
  },
};

/**
 * Record the outcome of a "Check answer". Only a passed check (every test
 * passed and the program ran without errors) marks progress and can award
 * XP; the gamification engine guarantees each accomplishment is rewarded at
 * most once. Returns the rewards so the workspace can show them inline.
 */
export function recordCheckResult(input: {
  catalog: GamificationCatalog;
  exerciseId: string;
  stepId: string;
  allStepIds: string[];
  passed: boolean;
}): Rewards | null {
  const { catalog, exerciseId, stepId, allStepIds, passed } = input;
  if (!passed) {
    gamificationStore.update((state) => applyCheckFailure(state, exerciseId, stepId));
    return null;
  }
  if (!progressStore.getSnapshot().hydrated || !gamificationStore.getSnapshot().hydrated) return null;
  const now = new Date();
  progressStore.update((state) => recordStepPassed(state, exerciseId, stepId, allStepIds, now.toISOString()));
  const progress = progressStore.getSnapshot().value;
  let rewards: Rewards | null = null;
  gamificationStore.update((state) => {
    const result = applyStepPass({ state, progress, catalog, exerciseId, stepId, now });
    rewards = result.rewards;
    return result.state;
  });
  void recordAdventurePass({
    progress, catalog, exerciseId, stepId, now,
    xpAwards: gamificationStore.getSnapshot().value.awards,
  }).catch((error: unknown) => console.warn("[adventure] Could not record local rewards:", error));
  if (rewards) publishRewards(rewards);
  return rewards;
}

/**
 * One-time migrations for data saved by earlier versions: the XP backfill for
 * progress saved before gamification existed, and marking learners who were
 * already active before proficiency levels existed (so no onboarding is forced
 * on them). Existing stores are only read here, never rewritten.
 */
export function migrateLearnerData(catalog: GamificationCatalog) {
  if (!progressStore.getSnapshot().hydrated || !gamificationStore.getSnapshot().hydrated) return;
  const progress = progressStore.getSnapshot().value;
  if (!gamificationStore.getSnapshot().value.migratedProgress) {
    gamificationStore.update((state) => backfillFromProgress(state, progress, catalog, new Date()));
  }
  if (competencyStore.getSnapshot().hydrated && !competencyStore.getSnapshot().value.migrated) {
    const active = hasLearnerActivity(progress, gamificationStore.getSnapshot().value);
    competencyStore.update((state) => migrateCompetency(state, active));
  }
}

/** Recompute the suggested starting point after the effective level changed. */
function refreshRecommendation(course: CatalogCourse | undefined, trackId: TrackId) {
  const now = nowIso();
  competencyStore.update((state) => {
    const next = recommendForTrack(course, state.tracks[trackId], now);
    return setRecommendation(state, trackId, next, now);
  });
}

export const competencyActions = {
  /**
   * Onboarding: the level chosen for the first language plus optional levels
   * for the others. Returns the exercise to start with, or null for "not sure"
   * (the caller then offers the placement check).
   */
  completeOnboarding(input: {
    course: CatalogCourse;
    level: SelfReportedLevel | null;
    otherLevels: Partial<Record<TrackId, SelfReportedLevel>>;
    courses: CatalogCourse[];
  }): string | null {
    const now = nowIso();
    const trackId = input.course.language as TrackId;
    competencyStore.update((state) => {
      let next = setOnboarding(state, input.level ? "completed" : "skipped");
      if (input.level) next = setSelfReportedLevel(next, trackId, input.level, now);
      for (const [other, level] of Object.entries(input.otherLevels)) {
        if (level) next = setSelfReportedLevel(next, other as TrackId, level, now);
      }
      return next;
    });
    for (const [other, level] of Object.entries(input.otherLevels)) {
      const otherCourse = input.courses.find((course) => course.language === other && course.exerciseIds.length > 0);
      if (level && level !== "not-sure") refreshRecommendation(otherCourse, other as TrackId);
    }
    gamificationActions.setPreferredCourse(input.course.id);
    if (input.level === "not-sure") return null;
    refreshRecommendation(input.course, trackId);
    const recommended = competencyStore.getSnapshot().value.tracks[trackId]?.recommendedNext?.exerciseId;
    return recommended ?? input.course.exerciseIds[0] ?? null;
  },
  /** "Skip for now": no level is stored; the learner starts from the beginning. */
  skipOnboarding(course: CatalogCourse) {
    competencyStore.update((state) => setOnboarding(state, "skipped"));
    gamificationActions.setPreferredCourse(course.id);
  },
  savePlacement(input: {
    course: CatalogCourse;
    result: PlacementResult;
    skills: Record<string, { correct: number; total: number }>;
  }) {
    const now = nowIso();
    const trackId = input.course.language as TrackId;
    competencyStore.update((state) => {
      const next = applyPlacementResult(state, trackId, input.result, input.skills, now);
      return state.onboarding === "pending" ? setOnboarding(next, "completed") : next;
    });
    refreshRecommendation(input.course, trackId);
    gamificationActions.setPreferredCourse(input.course.id);
  },
  /** The learner's own level, which always wins; null clears it so suggestions apply again. */
  setOverride(course: CatalogCourse | undefined, trackId: TrackId, level: SkillLevel | null) {
    competencyStore.update((state) => setUserOverride(state, trackId, level, nowIso()));
    refreshRecommendation(course, trackId);
  },
  dismissPlacementPrompt(trackId: TrackId) {
    competencyStore.update((state) => dismissPlacementPrompt(state, trackId));
  },
};

export const gamificationActions = {
  setDailyGoal(goal: number) {
    gamificationStore.update((state) => ({ ...state, dailyGoal: goal }));
  },
  setPreferredCourse(courseId: string) {
    gamificationStore.update((state) =>
      state.preferredCourse === courseId ? state : { ...state, preferredCourse: courseId },
    );
  },
};

export const draftActions = {
  /** Keeps the latest code in memory immediately and persists it shortly after. */
  saveFile(exerciseId: string, fileName: string, content: string) {
    draftsStore.update((state) => setDraftFile(state, exerciseId, fileName, content, nowIso()), {
      debounceMs: 400,
      silent: true,
    });
  },
};

export const scheduleActions = {
  set(target: DeadlineTarget, dueDate: string) {
    scheduleStore.update((state) => setDeadline(state, target, dueDate, nowIso()));
  },
  remove(target: DeadlineTarget) {
    scheduleStore.update((state) => removeDeadline(state, targetKey(target)));
  },
};
