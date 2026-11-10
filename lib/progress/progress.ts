/**
 * Learner progress: pure state transitions, independent of storage.
 * A step is recorded as passed ONLY by `recordStepPassed`, which the
 * workspace calls when a CheckResult has `passed: true`.
 */

export type ExerciseStatus = "not_started" | "in_progress" | "completed";

export interface ExerciseProgress {
  completedStepIds: string[];
  currentStepId?: string;
  /** ISO timestamp of the first completion. */
  completedAt?: string;
  updatedAt: string;
}

export interface ProgressState {
  version: 1;
  exercises: Record<string, ExerciseProgress>;
  lastVisited?: { courseId: string; exerciseId: string; at: string };
}

export const emptyProgress: ProgressState = { version: 1, exercises: {} };

export function parseProgress(raw: unknown): ProgressState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<ProgressState>;
  if (value.version !== 1 || typeof value.exercises !== "object" || value.exercises === null) return null;
  const exercises: Record<string, ExerciseProgress> = {};
  for (const [id, entry] of Object.entries(value.exercises)) {
    if (!entry || !Array.isArray(entry.completedStepIds)) continue;
    exercises[id] = {
      completedStepIds: entry.completedStepIds.filter((stepId): stepId is string => typeof stepId === "string"),
      currentStepId: typeof entry.currentStepId === "string" ? entry.currentStepId : undefined,
      completedAt: typeof entry.completedAt === "string" ? entry.completedAt : undefined,
      updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date(0).toISOString(),
    };
  }
  const last = value.lastVisited;
  return {
    version: 1,
    exercises,
    lastVisited:
      last && typeof last.courseId === "string" && typeof last.exerciseId === "string"
        ? { courseId: last.courseId, exerciseId: last.exerciseId, at: String(last.at ?? "") }
        : undefined,
  };
}

function entry(state: ProgressState, exerciseId: string, now: string): ExerciseProgress {
  return state.exercises[exerciseId] ?? { completedStepIds: [], updatedAt: now };
}

export function recordVisit(state: ProgressState, courseId: string, exerciseId: string, now: string): ProgressState {
  if (state.lastVisited?.exerciseId === exerciseId && state.lastVisited.courseId === courseId) return state;
  return { ...state, lastVisited: { courseId, exerciseId, at: now } };
}

export function setCurrentStep(state: ProgressState, exerciseId: string, stepId: string, now: string): ProgressState {
  const current = entry(state, exerciseId, now);
  if (current.currentStepId === stepId) return state;
  return {
    ...state,
    exercises: { ...state.exercises, [exerciseId]: { ...current, currentStepId: stepId, updatedAt: now } },
  };
}

/**
 * Mark a step as passed. The exercise becomes completed when every step id in
 * `allStepIds` has passed. Completion is never removed by later edits.
 */
export function recordStepPassed(
  state: ProgressState,
  exerciseId: string,
  stepId: string,
  allStepIds: string[],
  now: string,
): ProgressState {
  if (!allStepIds.includes(stepId)) return state;
  const current = entry(state, exerciseId, now);
  const completedStepIds = current.completedStepIds.includes(stepId)
    ? current.completedStepIds
    : [...current.completedStepIds, stepId];
  const allDone = allStepIds.every((id) => completedStepIds.includes(id));
  return {
    ...state,
    exercises: {
      ...state.exercises,
      [exerciseId]: {
        ...current,
        completedStepIds,
        completedAt: current.completedAt ?? (allDone ? now : undefined),
        updatedAt: now,
      },
    },
  };
}

export function exerciseStatus(state: ProgressState, exerciseId: string): ExerciseStatus {
  const progress = state.exercises[exerciseId];
  if (!progress) return "not_started";
  if (progress.completedAt) return "completed";
  return "in_progress";
}

export function isExerciseCompleted(state: ProgressState, exerciseId: string): boolean {
  return Boolean(state.exercises[exerciseId]?.completedAt);
}

export interface CourseProgress {
  completed: number;
  total: number;
  started: boolean;
  /** 0–100 */
  percent: number;
}

export function courseProgress(state: ProgressState, exerciseIds: string[]): CourseProgress {
  const total = exerciseIds.length;
  const completed = exerciseIds.filter((id) => isExerciseCompleted(state, id)).length;
  const started = exerciseIds.some((id) => Boolean(state.exercises[id]));
  return { completed, total, started, percent: total ? Math.round((completed / total) * 100) : 0 };
}

/** The exercise to resume in a course: the first one not yet completed. */
export function nextExerciseInCourse(state: ProgressState, exerciseIds: string[]): string | undefined {
  return exerciseIds.find((id) => !isExerciseCompleted(state, id)) ?? exerciseIds[0];
}

/** Which step to show when opening an exercise. */
export function initialStepIndex(state: ProgressState, exerciseId: string, stepIds: string[]): number {
  const progress = state.exercises[exerciseId];
  if (!progress) return 0;
  const current = progress.currentStepId ? stepIds.indexOf(progress.currentStepId) : -1;
  if (current >= 0) return current;
  const firstOpen = stepIds.findIndex((id) => !progress.completedStepIds.includes(id));
  return firstOpen >= 0 ? firstOpen : 0;
}
