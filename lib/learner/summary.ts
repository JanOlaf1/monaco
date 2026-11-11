import type { CatalogChapter, CatalogCourse, CatalogExercise } from "@/lib/content/catalog";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/gamification/achievements";
import { buildAchievementContext, chapterIsComplete, dailyGoalProgress, type GamificationCatalog } from "@/lib/gamification/engine";
import { levelInfo, type LevelInfo } from "@/lib/gamification/levels";
import { hasCompetencyChoices, type CompetencyState, type TrackId } from "@/lib/learning/competency";
import { nextTask } from "@/lib/learning/recommend";
import type { GamificationState } from "@/lib/gamification/state";
import { streakInfo, type StreakInfo } from "@/lib/gamification/streaks";
import { totalXp } from "@/lib/gamification/xp";
import { courseProgress, isExerciseCompleted, type CourseProgress, type ProgressState } from "@/lib/progress/progress";

/**
 * Everything the dashboard-style views need, derived purely from stored
 * learner state and the catalog (no storage or React here).
 */

export interface CourseStanding {
  course: CatalogCourse;
  progress: CourseProgress;
  /** First unfinished exercise, or the last exercise when the course is complete. */
  next?: { chapter: CatalogChapter; exercise: CatalogExercise };
  complete: boolean;
}

export type Milestone =
  | { kind: "chapter"; chapter: CatalogChapter; remaining: number }
  | { kind: "achievement"; id: AchievementId; value: number; target: number }
  | { kind: "level"; level: number; xpToNext: number };

export interface LearnerSummary {
  isReturning: boolean;
  level: LevelInfo;
  streak: StreakInfo;
  daily: { done: number; target: number };
  completedExercises: number;
  completedLabs: number;
  achievementsEarned: number;
  courses: CourseStanding[];
  /**
   * Where "Continue" should go. `reason`: `resume` = an unfinished exercise
   * the learner was working on, `recommended` = the suggested starting point
   * for their level, `next` = simply the next unfinished exercise.
   */
  continueAt?: {
    course: CatalogCourse;
    chapter: CatalogChapter;
    exercise: CatalogExercise;
    courseComplete: boolean;
    reason: "resume" | "recommended" | "next";
  };
  milestone?: Milestone;
  completedChapters: { course: CatalogCourse; chapter: CatalogChapter }[];
}

function locate(course: CatalogCourse, exerciseId: string) {
  for (const chapter of course.chapters) {
    const exercise = chapter.exercises.find((candidate) => candidate.id === exerciseId);
    if (exercise) return { chapter, exercise };
  }
  return undefined;
}

function standing(course: CatalogCourse, progress: ProgressState, competency?: CompetencyState): CourseStanding {
  const value = courseProgress(progress, course.exerciseIds);
  const task = nextTask(course, progress, competency?.tracks[course.language as TrackId]);
  const lastId = course.exerciseIds.at(-1);
  return {
    course,
    progress: value,
    next: task ?? (lastId ? locate(course, lastId) : undefined),
    complete: value.total > 0 && value.completed === value.total,
  };
}

export function hasLearnerActivity(
  progress: ProgressState,
  gamification: GamificationState,
  competency?: CompetencyState,
): boolean {
  return (
    Object.keys(progress.exercises).length > 0 ||
    Boolean(progress.lastVisited) ||
    Object.keys(gamification.awards).length > 0 ||
    Boolean(gamification.preferredCourse) ||
    (competency ? hasCompetencyChoices(competency) : false)
  );
}

export function summarizeLearner(input: {
  progress: ProgressState;
  gamification: GamificationState;
  competency?: CompetencyState;
  courses: CatalogCourse[];
  catalog: GamificationCatalog;
  today: string;
}): LearnerSummary {
  const { progress, gamification, competency, courses, catalog, today } = input;
  const available = courses.filter((course) => course.status === "available" && course.exerciseIds.length > 0);
  const standings = available.map((course) => standing(course, progress, competency));
  const reasonFor = (entry: CourseStanding) => {
    const task = nextTask(entry.course, progress, competency?.tracks[entry.course.language as TrackId]);
    return task?.fromRecommendation ? ("recommended" as const) : ("next" as const);
  };
  const context = buildAchievementContext(gamification, progress, catalog);
  const level = levelInfo(totalXp(gamification.awards));

  // Continue: the last visited course (its next unfinished exercise), else the onboarding choice.
  let continueAt: LearnerSummary["continueAt"];
  const last = progress.lastVisited;
  const lastCourse = last ? standings.find((entry) => entry.course.id === last.courseId) : undefined;
  if (last && lastCourse) {
    const lastLocated = locate(lastCourse.course, last.exerciseId);
    if (lastLocated && !isExerciseCompleted(progress, last.exerciseId)) {
      continueAt = { course: lastCourse.course, ...lastLocated, courseComplete: false, reason: "resume" };
    } else if (lastCourse.next) {
      continueAt = {
        course: lastCourse.course,
        chapter: lastCourse.next.chapter,
        exercise: lastCourse.next.exercise,
        courseComplete: lastCourse.complete,
        reason: reasonFor(lastCourse),
      };
    }
  }
  if (!continueAt) {
    const recommendedCourse = competency
      ? Object.values(competency.tracks).find((track) => track?.recommendedNext)?.recommendedNext?.courseId
      : undefined;
    const preferred =
      standings.find((entry) => entry.course.id === gamification.preferredCourse) ??
      standings.find((entry) => entry.course.id === recommendedCourse) ??
      standings.find((entry) => entry.progress.started);
    if (preferred?.next) {
      continueAt = {
        course: preferred.course,
        chapter: preferred.next.chapter,
        exercise: preferred.next.exercise,
        courseComplete: preferred.complete,
        reason: reasonFor(preferred),
      };
    }
  }

  // Next milestone: a nearly finished chapter, then the closest achievement, then the next level.
  let milestone: Milestone | undefined;
  if (continueAt && !continueAt.courseComplete) {
    const remaining = continueAt.chapter.exercises.filter((exercise) => !isExerciseCompleted(progress, exercise.id)).length;
    if (remaining > 0 && remaining <= 3) milestone = { kind: "chapter", chapter: continueAt.chapter, remaining };
  }
  if (!milestone) {
    const candidates = ACHIEVEMENTS.filter((definition) => !gamification.achievements[definition.id])
      .map((definition) => ({ id: definition.id, ...definition.progress(context) }))
      .filter((entry) => entry.target > 1 && entry.value > 0 && entry.value < entry.target)
      .sort((a, b) => b.value / b.target - a.value / a.target);
    if (candidates[0]) milestone = { kind: "achievement", ...candidates[0] };
  }
  milestone ??= { kind: "level", level: level.level + 1, xpToNext: level.xpToNext };

  const completedChapters = available.flatMap((course) =>
    course.chapters
      .filter((chapter) => {
        const entry = catalog.chapters.find((candidate) => candidate.courseId === course.id && candidate.chapterId === chapter.id);
        return entry ? chapterIsComplete(entry, progress) : false;
      })
      .map((chapter) => ({ course, chapter })),
  );

  return {
    isReturning: hasLearnerActivity(progress, gamification, competency),
    level,
    streak: streakInfo(gamification.activeDays, today, gamification.bestStreak),
    daily: dailyGoalProgress(gamification, today),
    completedExercises: context.completedExercises,
    completedLabs: context.completedLabs,
    achievementsEarned: Object.keys(gamification.achievements).length,
    courses: standings,
    continueAt,
    milestone,
    completedChapters,
  };
}
