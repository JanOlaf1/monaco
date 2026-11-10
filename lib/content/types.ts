import type { LocalizedText } from "@/lib/i18n/config";

/**
 * Course content model.
 *
 * Content is plain, serializable data. A single generic workspace renders every
 * exercise, and language runners evaluate the `TestDefinition.code` strings, so
 * adding an exercise never requires a new React component.
 *
 * Learner state (completion, saved code, target dates) is intentionally NOT part
 * of the content model. It lives in `lib/progress` and is joined at view time.
 */

/** Technologies taught on the platform. */
export type ProgrammingLanguage = "javascript" | "typescript" | "python" | "react";

/** Monaco language ids used for editor files. */
export type EditorLanguage = "javascript" | "typescript" | "python" | "html" | "css" | "json";

export type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * - `challenge`: a micro-challenge focused on one concept. Usually one step;
 *   guided challenges may have several small steps in the same file.
 * - `lab`: a larger assignment combining several concepts, with a list of
 *   requirements and many tests (exactly one step). Shown as a milestone
 *   ("boss") node on the learning path.
 */
export type ExerciseType = "challenge" | "lab";

export type AvailabilityStatus = "available" | "planned";

export interface StarterFile {
  /** File name shown in the editor tab, e.g. `main.py` or `index.js`. */
  name: string;
  language: EditorLanguage;
  content: string;
  /** The file the runner executes. Exactly one file per exercise is the entry. */
  entry?: boolean;
  readOnly?: boolean;
}

export interface TestDefinition {
  /** Stable id, unique within its step. */
  id: string;
  /** The requirement shown to the learner (inline markdown). */
  label: LocalizedText;
  /** What to do when the test fails (inline markdown). Shown only on failure. */
  failure: LocalizedText;
  /**
   * Hidden tests run like any other test, but the UI does not reveal their
   * label or expected values. NOTE: they are still shipped to the browser, so
   * they discourage overfitting rather than provide secrecy.
   */
  hidden?: boolean;
  /**
   * Runner-specific test source:
   * - JavaScript: the body of an async function receiving `t` (see
   *   `lib/execution/javascript/test-api.ts`). It runs in the same scope as
   *   the learner's code, so it can reference their declarations directly.
   * - Python: a snippet executed with the helpers from
   *   `lib/execution/python/harness.ts` (`var`, `run`, `expect_equal`, ...).
   */
  code: string;
}

export interface ExerciseStep {
  /** Stable id, unique within the exercise. Used as a progress key. */
  id: string;
  title: LocalizedText;
  /** Markdown. */
  instructions: LocalizedText;
  hints?: LocalizedText[];
  tests: TestDefinition[];
  /** Code this step starts from; used by "Reset". Defaults to the exercise starter files. */
  starterFiles?: StarterFile[];
}

export interface ExpectedOutput {
  text: string;
  note?: LocalizedText;
}

export interface ExerciseDefinition {
  /** Globally unique, URL-safe id. Also used as the progress/storage key. */
  id: string;
  courseId: string;
  chapterId: string;
  language: ProgrammingLanguage;
  type: ExerciseType;
  difficulty: Difficulty;
  estimatedMinutes: number;
  title: LocalizedText;
  /** One or two sentences for cards and headers. */
  summary: LocalizedText;
  /** Markdown: what the concept is, why it matters and how it works. */
  concept: LocalizedText;
  objectives: LocalizedText[];
  /** Lab user stories / requirements (inline markdown). */
  requirements?: LocalizedText[];
  starterFiles: StarterFile[];
  /** Challenges have one or more steps; labs have exactly one. */
  steps: ExerciseStep[];
  expectedOutput?: ExpectedOutput;
}

/** Icons available for chapter themes (mapped to Lucide icons in the UI). */
export type ChapterIcon =
  | "compass"
  | "box"
  | "calculator"
  | "toggle"
  | "split"
  | "function"
  | "repeat"
  | "list"
  | "braces"
  | "type"
  | "rocket";

/** Colour families for chapter themes (defined as design tokens in globals.css). */
export type ChapterTone = "teal" | "sky" | "violet" | "amber" | "rose" | "lime" | "indigo" | "orange";

export interface ChapterDefinition {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  status: AvailabilityStatus;
  theme: { icon: ChapterIcon; tone: ChapterTone };
  /** Ordered exercise ids. Empty for planned chapters. */
  exerciseIds: string[];
}

export interface CourseDefinition {
  id: string;
  language: ProgrammingLanguage;
  status: AvailabilityStatus;
  title: LocalizedText;
  summary: LocalizedText;
  /** Markdown. */
  description: LocalizedText;
  chapters: ChapterDefinition[];
}
