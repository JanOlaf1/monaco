import { beforeAll, describe, expect, it } from "vitest";
import { getExercise } from "@/lib/content/registry";
import { runJavaScript } from "@/lib/execution/javascript/engine";
import { chunksToEntries } from "@/lib/execution/output";
import { locales } from "@/lib/i18n/config";
import { getLocalizedPractice, getPracticeActivities, localizeActivity } from "@/lib/practice/content";
import {
  BLANK,
  acceptedArrangements,
  arrangeLines,
  evaluatePractice,
  isPermutation,
} from "@/lib/practice/evaluate";
import { emptyPractice, mergePractice, parsePractice, recordPracticePass } from "@/lib/practice/state";
import { PRACTICE_KINDS, type PracticeActivity, type PracticeLanguage } from "@/lib/practice/types";
import { isolatedAsyncFunction } from "./helpers/js-realm";
import { loadHarness, type PythonHarness } from "./helpers/pyodide";

let harness: PythonHarness;
beforeAll(async () => {
  harness = await loadHarness();
});

interface RunResult {
  output: string;
  error?: string;
}

async function jsRun(source: string): Promise<RunResult> {
  const { run } = await runJavaScript({ code: source, fileName: "index.js", AsyncFunction: isolatedAsyncFunction(), settleMs: 200 });
  return { output: run.output.map((entry) => entry.text).join("\n"), error: run.error?.name };
}

function pyRun(source: string): RunResult {
  const report = harness.runProgram(source);
  const lines = chunksToEntries(report.output ?? []).filter((entry) => entry.stream === "stdout");
  return { output: lines.map((entry) => entry.text).join("\n"), error: report.error?.name };
}

const run = (language: PracticeLanguage, source: string) =>
  language === "javascript" ? jsRun(source) : Promise.resolve(pyRun(source));

/** A program "works" when it prints exactly the expected output without an error. */
const works = (result: RunResult, expected: string) => !result.error && result.output === expected;

function permutations(length: number): number[][] {
  if (length === 0) return [[]];
  const result: number[][] = [];
  for (const rest of permutations(length - 1)) {
    for (let position = 0; position <= rest.length; position++) {
      result.push([...rest.slice(0, position), length - 1, ...rest.slice(position)]);
    }
  }
  return result;
}

const activities = getPracticeActivities();

describe("practice content", () => {
  it("covers every activity kind in both languages, with unique, linked ids", () => {
    const ids = activities.map((activity) => activity.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const language of ["javascript", "python"] as const) {
      const kinds = new Set(activities.filter((activity) => activity.language === language).map((activity) => activity.kind));
      expect([...kinds].sort(), language).toEqual([...PRACTICE_KINDS].sort());
    }
    for (const activity of activities) {
      expect(activity.id, activity.id).toMatch(/^pr-(js|py)-[a-z0-9-]+$/);
      const exercise = getExercise(activity.exerciseId);
      expect(exercise, `${activity.id} → ${activity.exerciseId}`).toBeDefined();
      expect(exercise?.language, activity.id).toBe(activity.language);
    }
  });

  it("has well-formed answer keys", () => {
    for (const activity of activities) {
      if ("options" in activity) {
        const optionIds = activity.options.map((option) => option.id);
        expect(new Set(optionIds).size, activity.id).toBe(optionIds.length);
        expect(optionIds.length, activity.id).toBeGreaterThanOrEqual(3);
      }
      switch (activity.kind) {
        case "predict":
        case "quiz":
          expect(activity.options.map((option) => option.id), activity.id).toContain(activity.answer);
          break;
        case "complete":
          expect(activity.code.split(BLANK).length, `${activity.id}: exactly one blank`).toBe(2);
          for (const answer of activity.answers) expect(activity.options.map((option) => option.id)).toContain(answer);
          break;
        case "select":
          for (const answer of activity.answers) expect(activity.options.map((option) => option.id)).toContain(answer);
          break;
        case "bug":
          expect(activity.bugLine, activity.id).toBeLessThan(activity.code.split("\n").length);
          expect(activity.fix, activity.id).not.toBe(activity.code.split("\n")[activity.bugLine]);
          break;
        case "reorder":
          expect(activity.lines.length, activity.id).toBeLessThanOrEqual(6);
          expect(isPermutation(activity.start, activity.lines.length), activity.id).toBe(true);
          expect(acceptedArrangements(activity).has(arrangeLines(activity.lines, activity.start)), `${activity.id}: start is unsolved`).toBe(false);
          for (const order of activity.alsoCorrect) expect(isPermutation(order, activity.lines.length)).toBe(true);
          break;
      }
    }
  });

  it("is translated into every locale", () => {
    for (const activity of activities) {
      for (const locale of locales) {
        const localized = localizeActivity(activity, locale);
        expect(localized.prompt.trim().length, `${activity.id}.prompt.${locale}`).toBeGreaterThan(0);
        expect(localized.explanation.trim().length, `${activity.id}.explanation.${locale}`).toBeGreaterThan(0);
        if (localized.kind === "quiz") for (const option of localized.options) expect(option.label.trim().length).toBeGreaterThan(0);
      }
      expect(activity.prompt.fi, `${activity.id} prompt translated`).not.toBe(activity.prompt.en);
      expect(activity.explanation.fi, `${activity.id} explanation translated`).not.toBe(activity.explanation.en);
    }
  });

  it("keeps the answer keys identical in every locale", () => {
    for (const locale of locales) {
      for (const localized of getLocalizedPractice(locale)) {
        const original = activities.find((activity) => activity.id === localized.id)!;
        const correct = correctResponse(original);
        expect(evaluatePractice(localized, correct), `${localized.id}.${locale}`).toBe(true);
      }
    }
  });
});

describe("practice answer keys, verified by running the code", () => {
  for (const activity of activities) {
    it(`${activity.id} (${activity.kind})`, async () => {
      const { language } = activity;
      switch (activity.kind) {
        case "predict": {
          const result = await run(language, activity.code);
          expect(result.error).toBeUndefined();
          const matching = activity.options.filter((option) => option.output === result.output).map((option) => option.id);
          expect(matching).toEqual([activity.answer]);
          break;
        }
        case "bug": {
          const lines = activity.code.split("\n");
          expect(works(await run(language, activity.code), activity.expectedOutput), "the original is buggy").toBe(false);
          const fixed = lines.map((line, index) => (index === activity.bugLine ? activity.fix : line)).join("\n");
          expect(await run(language, fixed)).toEqual({ output: activity.expectedOutput, error: undefined });
          break;
        }
        case "complete": {
          const passing: string[] = [];
          for (const option of activity.options) {
            if (works(await run(language, activity.code.replace(BLANK, option.text)), activity.expectedOutput)) passing.push(option.id);
          }
          expect(passing.sort()).toEqual([...activity.answers].sort());
          break;
        }
        case "select": {
          const passing: string[] = [];
          for (const option of activity.options) {
            if (works(await run(language, `${option.code}\n${activity.harness}`), activity.expectedOutput)) passing.push(option.id);
          }
          expect(passing.sort()).toEqual([...activity.answers].sort());
          break;
        }
        case "reorder": {
          // Every order that really works must be accepted, and only those.
          const working = new Set<string>();
          for (const order of permutations(activity.lines.length)) {
            const program = arrangeLines(activity.lines, order);
            if (works(await run(language, program), activity.expectedOutput)) working.add(program);
          }
          expect([...working].sort()).toEqual([...acceptedArrangements(activity)].sort());
          break;
        }
        case "quiz": {
          if (!activity.code) break;
          expect(activity.check, `${activity.id}: a quiz about code states what it does`).toBeDefined();
          const result = await run(language, activity.code);
          if (activity.check?.error) expect(result.error).toBe(activity.check.error);
          else expect(result.error).toBeUndefined();
          if (activity.check?.output !== undefined) expect(result.output).toBe(activity.check.output);
          break;
        }
      }
    });
  }
});

function correctResponse(activity: PracticeActivity) {
  switch (activity.kind) {
    case "predict":
    case "quiz":
      return { type: "choice" as const, optionId: activity.answer };
    case "complete":
    case "select":
      return { type: "choice" as const, optionId: activity.answers[0] };
    case "bug":
      return { type: "line" as const, index: activity.bugLine };
    case "reorder":
      return { type: "order" as const, order: activity.lines.map((_, index) => index) };
  }
}

describe("evaluatePractice", () => {
  const byKind = <K extends PracticeActivity["kind"]>(kind: K) =>
    activities.find((activity): activity is Extract<PracticeActivity, { kind: K }> => activity.kind === kind)!;

  it("accepts the right choice and rejects the others", () => {
    const predict = byKind("predict");
    expect(evaluatePractice(predict, { type: "choice", optionId: predict.answer })).toBe(true);
    for (const option of predict.options.filter((candidate) => candidate.id !== predict.answer)) {
      expect(evaluatePractice(predict, { type: "choice", optionId: option.id })).toBe(false);
    }
    expect(evaluatePractice(predict, { type: "choice", optionId: "nope" })).toBe(false);
  });

  it("accepts every equivalent correct option", () => {
    const multi = activities.find(
      (activity): activity is Extract<PracticeActivity, { kind: "complete" | "select" }> =>
        (activity.kind === "complete" || activity.kind === "select") && activity.answers.length > 1,
    )!;
    for (const answer of multi.answers) expect(evaluatePractice(multi, { type: "choice", optionId: answer })).toBe(true);
  });

  it("checks the selected bug line", () => {
    const bug = byKind("bug");
    expect(evaluatePractice(bug, { type: "line", index: bug.bugLine })).toBe(true);
    expect(evaluatePractice(bug, { type: "line", index: bug.bugLine + 1 })).toBe(false);
  });

  it("accepts alternative orders and rejects invalid ones", () => {
    const reorder = activities.find(
      (activity): activity is Extract<PracticeActivity, { kind: "reorder" }> =>
        activity.kind === "reorder" && activity.alsoCorrect.length > 0,
    )!;
    const identity = reorder.lines.map((_, index) => index);
    expect(evaluatePractice(reorder, { type: "order", order: identity })).toBe(true);
    expect(evaluatePractice(reorder, { type: "order", order: reorder.alsoCorrect[0] })).toBe(true);
    expect(evaluatePractice(reorder, { type: "order", order: reorder.start })).toBe(false);
    // Not a permutation: repeated or missing lines can never pass.
    expect(evaluatePractice(reorder, { type: "order", order: identity.map(() => 0) })).toBe(false);
    expect(evaluatePractice(reorder, { type: "order", order: identity.slice(1) })).toBe(false);
    expect(evaluatePractice(reorder, { type: "order", order: [...identity.slice(0, -1), 99] })).toBe(false);
  });

  it("rejects a response of the wrong type", () => {
    const predict = byKind("predict");
    expect(evaluatePractice(predict, { type: "line", index: 0 })).toBe(false);
    expect(evaluatePractice(byKind("bug"), { type: "choice", optionId: "a" })).toBe(false);
  });
});

describe("practice state", () => {
  it("records the first and latest correct answer", () => {
    const first = recordPracticePass(emptyPractice, "pr-js-let-update", "2026-11-01T10:00:00.000Z");
    const again = recordPracticePass(first, "pr-js-let-update", "2026-11-03T10:00:00.000Z");
    expect(again.activities["pr-js-let-update"]).toEqual({
      firstPassedAt: "2026-11-01T10:00:00.000Z",
      lastPassedAt: "2026-11-03T10:00:00.000Z",
    });
  });

  it("drops malformed stored entries without losing valid ones", () => {
    expect(parsePractice(null)).toBeNull();
    expect(parsePractice({ version: 2, activities: {} })).toBeNull();
    const parsed = parsePractice({
      version: 1,
      activities: {
        "pr-py-average": { firstPassedAt: "2026-11-02T10:00:00.000Z", lastPassedAt: "2026-11-01T10:00:00.000Z" },
        "Bad Id!": { firstPassedAt: "2026-11-02T10:00:00.000Z", lastPassedAt: "2026-11-02T10:00:00.000Z" },
        "pr-py-range-end": { firstPassedAt: "yesterday" },
      },
    });
    // Swapped timestamps are put back in order.
    expect(parsed).toEqual({
      version: 1,
      activities: {
        "pr-py-average": { firstPassedAt: "2026-11-01T10:00:00.000Z", lastPassedAt: "2026-11-02T10:00:00.000Z" },
      },
    });
  });

  it("merges histories by keeping the earliest first pass and the latest pass", () => {
    const a = { version: 1 as const, activities: { x: { firstPassedAt: "2026-01-02", lastPassedAt: "2026-01-05" } } };
    const b = {
      version: 1 as const,
      activities: { x: { firstPassedAt: "2026-01-01", lastPassedAt: "2026-01-03" }, y: { firstPassedAt: "2026-01-04", lastPassedAt: "2026-01-04" } },
    };
    expect(mergePractice(a, b).activities).toEqual({
      x: { firstPassedAt: "2026-01-01", lastPassedAt: "2026-01-05" },
      y: { firstPassedAt: "2026-01-04", lastPassedAt: "2026-01-04" },
    });
  });
});
