import type { PracticeResponse, ReorderActivity } from "./types";

/** The answer-relevant fields of an activity (texts may be in any locale). */
export type AnswerKey =
  | { kind: "predict" | "quiz"; answer: string }
  | { kind: "complete" | "select"; answers: string[] }
  | { kind: "bug"; bugLine: number }
  | { kind: "reorder"; lines: string[]; alsoCorrect: number[][] };

export const BLANK = "___";

/** The program text for an arrangement of reorder lines. */
export function arrangeLines(lines: readonly string[], order: readonly number[]): string {
  return order.map((index) => lines[index]).join("\n");
}

/** True when `order` uses every line index exactly once. */
export function isPermutation(order: readonly number[], length: number): boolean {
  if (order.length !== length) return false;
  const seen = new Set<number>();
  for (const index of order) {
    if (!Number.isInteger(index) || index < 0 || index >= length || seen.has(index)) return false;
    seen.add(index);
  }
  return true;
}

/** Every accepted arrangement as program text (identical lines may swap places). */
export function acceptedArrangements(activity: Pick<ReorderActivity, "lines" | "alsoCorrect">): Set<string> {
  const identity = activity.lines.map((_, index) => index);
  return new Set([identity, ...activity.alsoCorrect].map((order) => arrangeLines(activity.lines, order)));
}

/**
 * Pure, deterministic check of one answer. The answer keys themselves are
 * verified by executing the code in tests/practice.test.ts.
 */
export function evaluatePractice(activity: AnswerKey, response: PracticeResponse): boolean {
  switch (activity.kind) {
    case "predict":
    case "quiz":
      return response.type === "choice" && response.optionId === activity.answer;
    case "complete":
    case "select":
      return response.type === "choice" && activity.answers.includes(response.optionId);
    case "bug":
      return response.type === "line" && response.index === activity.bugLine;
    case "reorder":
      return (
        response.type === "order" &&
        isPermutation(response.order, activity.lines.length) &&
        acceptedArrangements(activity).has(arrangeLines(activity.lines, response.order))
      );
  }
}
