/**
 * Achievements are unlocked only when their condition is genuinely met by the
 * learner's recorded progress. Each is evaluated from an AchievementContext
 * derived from stored state — never from UI state.
 */
export type AchievementId =
  | "first-steps"
  | "curious-coder"
  | "persistent-learner"
  | "bug-hunter"
  | "lab-champion"
  | "on-a-roll"
  | "python-explorer"
  | "javascript-explorer";

export interface AchievementContext {
  completedExercises: number;
  completedLabs: number;
  /** A step passed after a failed check of the same step. */
  fixedFailingSolution: boolean;
  bestStreak: number;
  completedChapters: { python: number; javascript: number };
}

export type AchievementIcon = "footprints" | "sparkles" | "mountain" | "bug" | "flask" | "flame" | "map" | "braces";

export interface AchievementDefinition {
  id: AchievementId;
  icon: AchievementIcon;
  tone: "teal" | "sky" | "violet" | "amber" | "rose" | "lime" | "indigo" | "orange";
  /** Progress toward the goal, for display. */
  progress(context: AchievementContext): { value: number; target: number };
}

const count = (value: number, target: number) => ({ value: Math.min(value, target), target });

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first-steps", icon: "footprints", tone: "teal", progress: (c) => count(c.completedExercises, 1) },
  { id: "curious-coder", icon: "sparkles", tone: "sky", progress: (c) => count(c.completedExercises, 5) },
  { id: "persistent-learner", icon: "mountain", tone: "indigo", progress: (c) => count(c.completedExercises, 10) },
  { id: "bug-hunter", icon: "bug", tone: "rose", progress: (c) => count(c.fixedFailingSolution ? 1 : 0, 1) },
  { id: "lab-champion", icon: "flask", tone: "violet", progress: (c) => count(c.completedLabs, 1) },
  { id: "on-a-roll", icon: "flame", tone: "orange", progress: (c) => count(c.bestStreak, 3) },
  { id: "python-explorer", icon: "map", tone: "lime", progress: (c) => count(c.completedChapters.python, 1) },
  {
    id: "javascript-explorer",
    icon: "braces",
    tone: "amber",
    progress: (c) => count(c.completedChapters.javascript, 1),
  },
];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((achievement) => achievement.id);

export function isAchieved(definition: AchievementDefinition, context: AchievementContext): boolean {
  const { value, target } = definition.progress(context);
  return value >= target;
}

/** Achievements whose condition is met but which are not yet recorded. */
export function newlyUnlocked(context: AchievementContext, unlocked: Partial<Record<AchievementId, unknown>>): AchievementId[] {
  return ACHIEVEMENTS.filter((definition) => !unlocked[definition.id] && isAchieved(definition, context)).map(
    (definition) => definition.id,
  );
}
