import { javascriptCourse, pythonCourse, reactCourse, typescriptCourse } from "@/content/courses";
import * as jsChapters1to5 from "@/content/exercises/javascript/chapters-1-5";
import * as jsChapters6to10 from "@/content/exercises/javascript/chapters-6-10";
import { greetingFunctions } from "@/content/exercises/javascript/greeting-functions";
import { weatherAdvisorLab } from "@/content/exercises/javascript/weather-advisor-lab";
import * as pyChapters1to5 from "@/content/exercises/python/chapters-1-5";
import * as pyChapters6to10 from "@/content/exercises/python/chapters-6-10";
import { shippingCostLab } from "@/content/exercises/python/shipping-cost-lab";
import { variablesAndStrings } from "@/content/exercises/python/variables-and-strings";
import type { ChapterDefinition, CourseDefinition, ExerciseDefinition } from "./types";

/**
 * Central content registry. Courses list their chapters and exercise ids;
 * exercise modules export ExerciseDefinitions. Pages, static params, the
 * learner catalog and the validation tests all read from here.
 */
const courseList: CourseDefinition[] = [pythonCourse, javascriptCourse, typescriptCourse, reactCourse];

const exerciseList: ExerciseDefinition[] = [
  greetingFunctions,
  weatherAdvisorLab,
  variablesAndStrings,
  shippingCostLab,
  ...Object.values(jsChapters1to5),
  ...Object.values(jsChapters6to10),
  ...Object.values(pyChapters1to5),
  ...Object.values(pyChapters6to10),
];

const coursesById = new Map(courseList.map((course) => [course.id, course]));
const exercisesById = new Map(exerciseList.map((exercise) => [exercise.id, exercise]));

export function getCourses(): CourseDefinition[] {
  return courseList;
}

export function getAllExercises(): ExerciseDefinition[] {
  return exerciseList;
}

export function getCourse(courseId: string): CourseDefinition | undefined {
  return coursesById.get(courseId);
}

export function getExercise(exerciseId: string): ExerciseDefinition | undefined {
  return exercisesById.get(exerciseId);
}

/** Ordered ids of the course's available exercises. */
export function getCourseExerciseIds(courseId: string): string[] {
  const course = getCourse(courseId);
  if (!course) return [];
  return course.chapters
    .filter((chapter) => chapter.status === "available")
    .flatMap((chapter) => chapter.exerciseIds)
    .filter((id) => exercisesById.has(id));
}

export interface ExerciseContext {
  course: CourseDefinition;
  chapter: ChapterDefinition;
  chapterNumber: number;
  /** 1-based position of the exercise within its chapter. */
  positionInChapter: number;
  exercise: ExerciseDefinition;
  previousId?: string;
  nextId?: string;
}

export function getExerciseContext(courseId: string, exerciseId: string): ExerciseContext | undefined {
  const course = getCourse(courseId);
  const exercise = getExercise(exerciseId);
  if (!course || !exercise || exercise.courseId !== course.id) return undefined;
  const chapterIndex = course.chapters.findIndex((chapter) => chapter.id === exercise.chapterId);
  const chapter = course.chapters[chapterIndex];
  if (!chapter || chapter.status !== "available") return undefined;
  const ordered = getCourseExerciseIds(course.id);
  const index = ordered.indexOf(exercise.id);
  return {
    course,
    chapter,
    chapterNumber: chapterIndex + 1,
    positionInChapter: chapter.exerciseIds.indexOf(exercise.id) + 1,
    exercise,
    previousId: index > 0 ? ordered[index - 1] : undefined,
    nextId: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
  };
}

/** All `{ courseId, exerciseId }` pairs for static generation. */
export function getExerciseRouteParams(): { courseId: string; exerciseId: string }[] {
  return courseList.flatMap((course) =>
    getCourseExerciseIds(course.id).map((exerciseId) => ({ courseId: course.id, exerciseId })),
  );
}
