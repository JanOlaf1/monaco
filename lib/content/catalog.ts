import type { GamificationCatalog } from "@/lib/gamification/engine";
import type { ChapterDefinition, ExerciseType, ProgrammingLanguage, SkillId, SkillLevel } from "./types";

/**
 * Client-safe catalog types and helpers. The catalog is built on the server
 * (`getCatalog` in localize.ts) and passed to the browser; it contains no
 * test code or lesson text, only what navigation and progress views need.
 */
export interface CatalogExercise {
  id: string;
  courseId: string;
  chapterId: string;
  title: string;
  type: ExerciseType;
  estimatedMinutes: number;
  stepIds: string[];
  testCount: number;
}

export interface CatalogChapter {
  id: string;
  courseId: string;
  kind: "chapter" | "checkpoint";
  /** 1-based chapter number within the course; null for checkpoints. */
  number: number | null;
  level: SkillLevel;
  skills: SkillId[];
  /** Helpful-to-know-first skills (a suggestion, never a lock). */
  buildsOn: SkillId[];
  title: string;
  summary: string;
  status: ChapterDefinition["status"];
  theme: ChapterDefinition["theme"];
  exercises: CatalogExercise[];
}

export interface CatalogSkill {
  id: SkillId;
  track: ProgrammingLanguage;
  title: string;
}

export interface CatalogCourse {
  id: string;
  language: ProgrammingLanguage;
  status: "available" | "planned";
  title: string;
  summary: string;
  chapters: CatalogChapter[];
  /** The optional placement check for this course, if there is one. */
  placement: { minutes: number } | null;
  /** Ordered ids of all available exercises in the course. */
  exerciseIds: string[];
}

export function toGamificationCatalog(courses: CatalogCourse[]): GamificationCatalog {
  const exercises: GamificationCatalog["exercises"] = {};
  const chapters: GamificationCatalog["chapters"] = [];
  for (const course of courses) {
    for (const chapter of course.chapters) {
      if (chapter.status !== "available") continue;
      // Checkpoints earn their own XP but no chapter bonus, and do not count as
      // finished chapters for achievements.
      if (chapter.kind === "chapter") {
        chapters.push({
          courseId: course.id,
          chapterId: chapter.id,
          language: course.language,
          exerciseIds: chapter.exercises.map((exercise) => exercise.id),
        });
      }
      for (const exercise of chapter.exercises) {
        exercises[exercise.id] = {
          courseId: course.id,
          chapterId: chapter.id,
          type: exercise.type,
          stepIds: exercise.stepIds,
        };
      }
    }
  }
  return { exercises, chapters };
}

export function findExercise(courses: CatalogCourse[], exerciseId: string) {
  for (const course of courses) {
    for (const chapter of course.chapters) {
      const exercise = chapter.exercises.find((candidate) => candidate.id === exerciseId);
      if (exercise) return { course, chapter, exercise };
    }
  }
  return undefined;
}
