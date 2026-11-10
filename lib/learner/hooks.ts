"use client";

import { useSyncExternalStore } from "react";
import { publishRewards } from "@/lib/gamification/celebrations";
import {
  applyCheckFailure,
  applyStepPass,
  backfillFromProgress,
  type GamificationCatalog,
  type Rewards,
} from "@/lib/gamification/engine";
import { setDraftFile } from "@/lib/progress/drafts";
import { recordStepPassed, recordVisit, setCurrentStep } from "@/lib/progress/progress";
import { removeDeadline, setDeadline, targetKey, type DeadlineTarget } from "@/lib/schedule/deadlines";
import type { PersistentStore, StoreSnapshot } from "@/lib/storage/persistent-store";
import { draftsStore, gamificationStore, progressStore, scheduleStore } from "./stores";

export function useStore<T>(store: PersistentStore<T>): StoreSnapshot<T> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export const useProgress = () => useStore(progressStore);
export const useSchedule = () => useStore(scheduleStore);
export const useGamification = () => useStore(gamificationStore);

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
  if (rewards) publishRewards(rewards);
  return rewards;
}

/** One-time XP backfill for progress saved before gamification existed. */
export function migrateLearnerData(catalog: GamificationCatalog) {
  if (!progressStore.getSnapshot().hydrated || !gamificationStore.getSnapshot().hydrated) return;
  const progress = progressStore.getSnapshot().value;
  gamificationStore.update((state) => backfillFromProgress(state, progress, catalog, new Date()));
}

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
