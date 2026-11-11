import type { CatalogChapter, CatalogCourse, CatalogExercise, CatalogSkill } from "@/lib/content/catalog";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/content/types";
import { isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";
import {
  effectiveLevel,
  type LevelSource,
  type RecommendationReason,
  type RecommendedNext,
  type TrackCompetency,
} from "./competency";

/**
 * Pure recommendation rules. Suggestions only: every chapter stays open, and
 * nothing here marks skipped chapters as completed.
 */

const rank = (level: SkillLevel) => SKILL_LEVELS.indexOf(level);

const playable = (course: CatalogCourse) =>
  course.chapters.filter((chapter) => chapter.status === "available" && chapter.exercises.length > 0);

/**
 * The first regular chapter that matches a level. Beginners start at the very
 * beginning (a quick first success). If no chapter is that advanced (for
 * example "professional"), the deepest band available is used.
 */
export function entryChapter(course: CatalogCourse, level: SkillLevel): CatalogChapter | undefined {
  const chapters = playable(course).filter((chapter) => chapter.kind === "chapter");
  if (chapters.length === 0) return undefined;
  if (level === "beginner") return chapters[0];
  const match = chapters.find((chapter) => rank(chapter.level) >= rank(level));
  if (match) return match;
  const deepest = Math.max(...chapters.map((chapter) => rank(chapter.level)));
  return chapters.find((chapter) => rank(chapter.level) === deepest);
}

/** The checkpoint right before a chapter: a way to confirm the band being skipped. */
export function checkpointBefore(course: CatalogCourse, chapterId: string): CatalogChapter | undefined {
  const chapters = playable(course);
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  const previous = index > 0 ? chapters[index - 1] : undefined;
  return previous?.kind === "checkpoint" ? previous : undefined;
}

export function recommendStart(
  course: CatalogCourse,
  level: SkillLevel,
  reason: RecommendationReason,
  now: string,
): RecommendedNext | null {
  const chapter = entryChapter(course, level);
  const exercise = chapter?.exercises[0];
  if (!chapter || !exercise) return null;
  return {
    courseId: course.id,
    chapterId: chapter.id,
    exerciseId: exercise.id,
    level,
    reason: level === "beginner" && reason !== "placement" && reason !== "override" ? "first-success" : reason,
    at: now,
  };
}

export interface NextTask {
  chapter: CatalogChapter;
  exercise: CatalogExercise;
  /** True when the task comes from the suggested starting point rather than the beginning. */
  fromRecommendation: boolean;
}

function locate(course: CatalogCourse, exerciseId: string) {
  for (const chapter of course.chapters) {
    const exercise = chapter.exercises.find((candidate) => candidate.id === exerciseId);
    if (exercise) return { chapter, exercise };
  }
  return undefined;
}

/**
 * The next meaningful task in a course: the first unfinished exercise from the
 * suggested starting point onwards, then anything unfinished earlier. Returns
 * `undefined` when everything is complete.
 */
export function nextTask(
  course: CatalogCourse,
  progress: ProgressState,
  track: TrackCompetency | undefined,
): NextTask | undefined {
  const ids = course.exerciseIds;
  const start = track?.recommendedNext?.courseId === course.id ? ids.indexOf(track.recommendedNext.exerciseId) : -1;
  const from = start > 0 ? start : 0;
  const ordered = [...ids.slice(from), ...ids.slice(0, from)];
  const nextId = ordered.find((id) => !isExerciseCompleted(progress, id));
  if (!nextId) return undefined;
  const located = locate(course, nextId);
  if (!located) return undefined;
  return { ...located, fromRecommendation: from > 0 && ids.indexOf(nextId) >= from };
}

export interface SkillStanding {
  skill: CatalogSkill;
  /** Completed exercises in chapters that practise this skill. */
  exercises: { completed: number; total: number };
  /** Correct answers in the latest placement, if any. */
  placement?: { correct: number; total: number };
}

/** Per-skill evidence for one course: exercise completions plus placement answers. */
export function skillStandings(
  course: CatalogCourse,
  skills: CatalogSkill[],
  progress: ProgressState,
  track: TrackCompetency | undefined,
): SkillStanding[] {
  return skills
    .filter((skill) => skill.track === course.language)
    .map((skill) => {
      const exercises = playable(course)
        .filter((chapter) => chapter.kind === "chapter" && chapter.skills.includes(skill.id))
        .flatMap((chapter) => chapter.exercises);
      const evidence = track?.skillEvidence[skill.id];
      return {
        skill,
        exercises: {
          completed: exercises.filter((exercise) => isExerciseCompleted(progress, exercise.id)).length,
          total: exercises.length,
        },
        placement: evidence ? { correct: evidence.correct, total: evidence.total } : undefined,
      };
    })
    .filter((standing) => standing.exercises.total > 0 || standing.placement);
}

/** The level used for suggestions on a course, if the learner has one. */
export function courseLevel(track: TrackCompetency | undefined): SkillLevel | null {
  return effectiveLevel(track)?.level ?? null;
}

const REASONS: Record<LevelSource, RecommendationReason> = { override: "override", placement: "placement", self: "self-report" };

/** The suggested start for a track's effective level, or null without a level or playable course. */
export function recommendForTrack(
  course: CatalogCourse | undefined,
  track: TrackCompetency | undefined,
  now: string,
): RecommendedNext | null {
  const effective = effectiveLevel(track);
  if (!course || course.exerciseIds.length === 0 || !effective) return null;
  return recommendStart(course, effective.level, REASONS[effective.source], now);
}
