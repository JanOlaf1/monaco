import type { SkillId, SkillLevel, TestDefinition } from "@/lib/content/types";
import type { LocalizedText } from "@/lib/i18n/config";

/**
 * Placement assessment: content types and pure scoring.
 *
 * A placement is a short, optional set of questions per language, ordered from
 * beginner to advanced. It produces a *recommendation* of where to start, never
 * a certificate. "professional" can only be self-reported, because a few
 * questions cannot verify professional competence.
 */

export type PlacementLevel = Exclude<SkillLevel, "professional">;
export const PLACEMENT_LEVELS: PlacementLevel[] = ["beginner", "intermediate", "advanced"];

interface ItemBase {
  /** Stable id, unique within the assessment (stored in results). */
  id: string;
  level: PlacementLevel;
  skills: SkillId[];
  /** Markdown question. */
  prompt: LocalizedText;
  /** Shown after answering: why the answer is what it is. */
  explanation: LocalizedText;
}

/** "What does this print?" The options are exact program output. */
export interface PredictItem extends ItemBase {
  kind: "predict";
  code: string;
  options: { id: string; output: string }[];
  answer: string;
}

/** "Which change fixes the bug?" Each option carries the fixed program, so tests can run it. */
export interface DebugItem extends ItemBase {
  kind: "debug";
  code: string;
  expectedOutput: string;
  options: { id: string; label: LocalizedText; fixed: string }[];
  answer: string;
}

/** A small coding task checked with the real runner. */
export interface CodeItem extends ItemBase {
  kind: "code";
  starter: string;
  tests: TestDefinition[];
}

export type PlacementItem = PredictItem | DebugItem | CodeItem;

export interface PlacementDefinition {
  /** Stable id, e.g. `placement-python`. */
  id: string;
  /** Bump when items change meaningfully; stored with results. */
  version: number;
  courseId: string;
  language: "javascript" | "python";
  minutes: number;
  /** Ordered beginner → advanced. */
  items: PlacementItem[];
}

/** How a learner answered one item. Skipped items and "I don't know" count as not correct. */
export interface PlacementAnswer {
  itemId: string;
  correct: boolean;
  skipped: boolean;
}

/** Correct answers needed to pass a level (two of three). */
export function passMark(total: number): number {
  return Math.ceil((total * 2) / 3);
}

export interface PlacementOutcome {
  level: PlacementLevel;
  perLevel: Record<PlacementLevel, { correct: number; answered: number; total: number }>;
  /** Evidence per skill from the answered items. */
  skills: Record<SkillId, { correct: number; total: number }>;
  correct: number;
  answered: number;
  total: number;
  /** True when the assessment stopped before the last level. */
  stoppedEarly: boolean;
}

function tally(items: Pick<PlacementItem, "id" | "level">[], answers: PlacementAnswer[]) {
  const byId = new Map(answers.map((answer) => [answer.itemId, answer]));
  const perLevel = Object.fromEntries(
    PLACEMENT_LEVELS.map((level) => [level, { correct: 0, answered: 0, total: 0 }]),
  ) as PlacementOutcome["perLevel"];
  for (const item of items) {
    const entry = perLevel[item.level];
    entry.total += 1;
    const answer = byId.get(item.id);
    if (answer) {
      entry.answered += 1;
      if (answer.correct) entry.correct += 1;
    }
  }
  return { byId, perLevel };
}

/**
 * Index of the next item to show, or `null` when the assessment is over.
 * Adaptive stop: when a level is finished without reaching the pass mark,
 * harder levels are skipped (they would only be discouraging guesses).
 */
export function nextItemIndex(items: Pick<PlacementItem, "id" | "level">[], answers: PlacementAnswer[]): number | null {
  const { byId, perLevel } = tally(items, answers);
  for (const level of PLACEMENT_LEVELS) {
    const entry = perLevel[level];
    if (entry.total === 0) continue;
    const pending = items.findIndex((item) => item.level === level && !byId.has(item.id));
    if (pending >= 0) return pending;
    if (entry.correct < passMark(entry.total)) return null;
  }
  return null;
}

/** Score the answers and recommend a starting level. */
export function placementOutcome(
  items: Pick<PlacementItem, "id" | "level" | "skills">[],
  answers: PlacementAnswer[],
): PlacementOutcome {
  const { byId, perLevel } = tally(items, answers);
  const passed = (level: PlacementLevel) =>
    perLevel[level].total > 0 && perLevel[level].correct >= passMark(perLevel[level].total);

  let level: PlacementLevel = "beginner";
  if (passed("beginner")) level = passed("intermediate") ? "advanced" : "intermediate";

  const skills: PlacementOutcome["skills"] = {};
  for (const item of items) {
    const answer = byId.get(item.id);
    if (!answer) continue;
    for (const skill of item.skills) {
      const entry = (skills[skill] ??= { correct: 0, total: 0 });
      entry.total += 1;
      if (answer.correct) entry.correct += 1;
    }
  }

  const answered = answers.filter((answer) => items.some((item) => item.id === answer.itemId));
  return {
    level,
    perLevel,
    skills,
    correct: answered.filter((answer) => answer.correct).length,
    answered: answered.length,
    total: items.length,
    stoppedEarly: answered.length < items.length && nextItemIndex(items, answers) === null,
  };
}
