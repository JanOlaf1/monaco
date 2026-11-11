import type { LocalizedText } from "@/lib/i18n/config";

/**
 * Mobile practice activities: short, touch-friendly tasks that complement the
 * Monaco workspace (they never replace it). Every activity has a deterministic
 * answer key, and tests/practice.test.ts verifies the keys by running the code
 * with the same JavaScript engine and Python harness the lessons use.
 */
export type PracticeKind = "predict" | "bug" | "complete" | "reorder" | "select" | "quiz";
export const PRACTICE_KINDS: PracticeKind[] = ["predict", "bug", "complete", "reorder", "select", "quiz"];

export type PracticeLanguage = "javascript" | "python";

interface ActivityBase {
  /** Stable id, unique across all activities (stored in progress and XP awards). */
  id: string;
  language: PracticeLanguage;
  /** The lesson this activity reviews; completed lessons put it in the review deck. */
  exerciseId: string;
  /** Markdown question. */
  prompt: LocalizedText;
  /** Shown after answering: why the answer is right. */
  explanation: LocalizedText;
}

/** "What does this print?" Options are exact program output. */
export interface PredictActivity extends ActivityBase {
  kind: "predict";
  code: string;
  options: { id: string; output: string }[];
  answer: string;
}

/** "Which line has the bug?" `fix` replaces that line to give `expectedOutput`. */
export interface BugActivity extends ActivityBase {
  kind: "bug";
  code: string;
  expectedOutput: string;
  /** 0-based index of the faulty line in `code`. */
  bugLine: number;
  fix: string;
}

/**
 * Fill the blank (`___`, exactly once in `code`). Every option that makes the
 * program print `expectedOutput` is listed in `answers` (equivalent correct
 * choices are all accepted).
 */
export interface CompleteActivity extends ActivityBase {
  kind: "complete";
  code: string;
  expectedOutput: string;
  options: { id: string; text: string }[];
  answers: string[];
}

/**
 * Arrange lines into a working program. `lines` are written in a correct
 * order; `alsoCorrect` lists any other orders (as indexes into `lines`) that
 * print `expectedOutput` too. `start` is the scrambled order shown first.
 */
export interface ReorderActivity extends ActivityBase {
  kind: "reorder";
  lines: string[];
  expectedOutput: string;
  alsoCorrect: number[][];
  start: number[];
}

/**
 * Pick the implementation(s) that meet the description. `harness` is code
 * appended to each option; an option is correct when the program prints
 * `expectedOutput`.
 */
export interface SelectActivity extends ActivityBase {
  kind: "select";
  options: { id: string; code: string }[];
  harness: string;
  expectedOutput: string;
  answers: string[];
}

/**
 * A short concept question. When it asks about `code`, `check` states what
 * running that code really does (verified by the tests).
 */
export interface QuizActivity extends ActivityBase {
  kind: "quiz";
  code?: string;
  check?: { output?: string; error?: string };
  options: { id: string; label: LocalizedText }[];
  answer: string;
}

export type PracticeActivity =
  | PredictActivity
  | BugActivity
  | CompleteActivity
  | ReorderActivity
  | SelectActivity
  | QuizActivity;

/** What the learner submitted. */
export type PracticeResponse =
  | { type: "choice"; optionId: string }
  | { type: "line"; index: number }
  | { type: "order"; order: number[] };
