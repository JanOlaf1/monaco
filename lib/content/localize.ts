import { localize, type Locale } from "@/lib/i18n/config";
import type { CatalogChapter, CatalogCourse, CatalogExercise } from "./catalog";
import { getCourseExerciseIds, getCourses, getExercise } from "./registry";
import type {
  CourseDefinition,
  Difficulty,
  ExerciseDefinition,
  ExerciseType,
  ProgrammingLanguage,
  StarterFile,
} from "./types";

/**
 * Serializable, single-locale views of the content, passed from Server
 * Components to Client Components. Only the active locale is sent to the
 * browser.
 */

export interface LocalizedTest {
  id: string;
  label: string;
  failure: string;
  hidden: boolean;
  code: string;
}

export interface LocalizedStep {
  id: string;
  title: string;
  instructions: string;
  hints: string[];
  tests: LocalizedTest[];
  starterFiles: StarterFile[];
}

export interface LocalizedExercise {
  id: string;
  courseId: string;
  chapterId: string;
  language: ProgrammingLanguage;
  type: ExerciseType;
  difficulty: Difficulty;
  estimatedMinutes: number;
  title: string;
  summary: string;
  concept: string;
  objectives: string[];
  requirements: string[];
  starterFiles: StarterFile[];
  steps: LocalizedStep[];
  expectedOutput?: { text: string; note?: string };
}

export function localizeExercise(exercise: ExerciseDefinition, locale: Locale): LocalizedExercise {
  return {
    id: exercise.id,
    courseId: exercise.courseId,
    chapterId: exercise.chapterId,
    language: exercise.language,
    type: exercise.type,
    difficulty: exercise.difficulty,
    estimatedMinutes: exercise.estimatedMinutes,
    title: localize(exercise.title, locale),
    summary: localize(exercise.summary, locale),
    concept: localize(exercise.concept, locale),
    objectives: exercise.objectives.map((text) => localize(text, locale)),
    requirements: (exercise.requirements ?? []).map((text) => localize(text, locale)),
    starterFiles: exercise.starterFiles,
    steps: exercise.steps.map((step) => ({
      id: step.id,
      title: localize(step.title, locale),
      instructions: localize(step.instructions, locale),
      hints: (step.hints ?? []).map((hint) => localize(hint, locale)),
      starterFiles: step.starterFiles ?? exercise.starterFiles,
      tests: step.tests.map((test) => ({
        id: test.id,
        label: localize(test.label, locale),
        failure: localize(test.failure, locale),
        hidden: Boolean(test.hidden),
        code: test.code,
      })),
    })),
    expectedOutput: exercise.expectedOutput
      ? {
          text: exercise.expectedOutput.text,
          note: exercise.expectedOutput.note ? localize(exercise.expectedOutput.note, locale) : undefined,
        }
      : undefined,
  };
}

export function summarizeExercise(exercise: ExerciseDefinition, locale: Locale): CatalogExercise {
  return {
    id: exercise.id,
    courseId: exercise.courseId,
    chapterId: exercise.chapterId,
    title: localize(exercise.title, locale),
    type: exercise.type,
    difficulty: exercise.difficulty,
    estimatedMinutes: exercise.estimatedMinutes,
    stepIds: exercise.steps.map((step) => step.id),
    testCount: exercise.steps.reduce((sum, step) => sum + step.tests.length, 0),
  };
}

function summarizeCourse(course: CourseDefinition, locale: Locale): CatalogCourse {
  const chapters: CatalogChapter[] = course.chapters.map((chapter, index) => ({
    id: chapter.id,
    courseId: course.id,
    number: index + 1,
    title: localize(chapter.title, locale),
    summary: localize(chapter.summary, locale),
    status: chapter.status,
    theme: chapter.theme,
    exercises:
      chapter.status === "available"
        ? chapter.exerciseIds
            .map((id) => getExercise(id))
            .filter((exercise): exercise is ExerciseDefinition => Boolean(exercise))
            .map((exercise) => summarizeExercise(exercise, locale))
        : [],
  }));
  return {
    id: course.id,
    language: course.language,
    status: course.status,
    title: localize(course.title, locale),
    summary: localize(course.summary, locale),
    chapters,
    exerciseIds: getCourseExerciseIds(course.id),
  };
}

/** The whole course catalog in one locale (small: ids, titles and metadata only). */
export function getCatalog(locale: Locale): CatalogCourse[] {
  return getCourses().map((course) => summarizeCourse(course, locale));
}
