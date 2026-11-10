import type { LocalizedText } from "@/lib/i18n/config";
import type {
  Difficulty,
  ExerciseDefinition,
  ExpectedOutput,
  TestDefinition,
} from "./types";

/**
 * Authoring helpers. They keep exercise files short and consistent:
 *
 *   l("Hello", "Hei")                           -> LocalizedText
 *   check("id", label, failure, code)           -> TestDefinition
 *   pyChallenge({...}) / jsChallenge({...})     -> one-step micro-challenge
 *   pyLab({...}) / jsLab({...})                 -> lab (milestone) exercise
 *
 * Everything they produce is plain data validated by tests/content.test.ts.
 */

export const l = (en: string, fi: string): LocalizedText => ({ en, fi });

export function check(
  id: string,
  label: LocalizedText,
  failure: LocalizedText,
  code: string,
  options: { hidden?: boolean } = {},
): TestDefinition {
  return { id, label, failure, code, hidden: options.hidden };
}

type RunnableLanguage = "python" | "javascript";

const FILES: Record<RunnableLanguage, string> = { python: "main.py", javascript: "index.js" };

export interface ExerciseInput {
  id: string;
  chapterId: string;
  difficulty?: Difficulty;
  minutes: number;
  title: LocalizedText;
  /** One sentence shown under the title. */
  summary: LocalizedText;
  /** Markdown theory shown in the collapsible "Concept" section. */
  concept: LocalizedText;
  objectives: LocalizedText[];
  /** Markdown: the task itself. Keep it short and concrete. */
  instructions: LocalizedText;
  /** Progressive hints, from a nudge to an almost-solution. */
  hints: LocalizedText[];
  tests: TestDefinition[];
  starter: string;
  expectedOutput?: ExpectedOutput;
}

function withNewline(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function build(
  language: RunnableLanguage,
  type: ExerciseDefinition["type"],
  input: ExerciseInput & { requirements?: LocalizedText[] },
): ExerciseDefinition {
  return {
    id: input.id,
    courseId: language,
    chapterId: input.chapterId,
    language,
    type,
    difficulty: input.difficulty ?? "beginner",
    estimatedMinutes: input.minutes,
    title: input.title,
    summary: input.summary,
    concept: input.concept,
    objectives: input.objectives,
    requirements: input.requirements,
    starterFiles: [{ name: FILES[language], language, entry: true, content: withNewline(input.starter) }],
    steps: [
      {
        id: type === "lab" ? "lab" : "task",
        title: input.title,
        instructions: input.instructions,
        hints: input.hints,
        tests: input.tests,
      },
    ],
    expectedOutput: input.expectedOutput,
  };
}

export const pyChallenge = (input: ExerciseInput) => build("python", "challenge", input);
export const jsChallenge = (input: ExerciseInput) => build("javascript", "challenge", input);
export const pyLab = (input: ExerciseInput & { requirements: LocalizedText[] }) => build("python", "lab", input);
export const jsLab = (input: ExerciseInput & { requirements: LocalizedText[] }) => build("javascript", "lab", input);
