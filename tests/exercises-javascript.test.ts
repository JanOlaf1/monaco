import { describe, expect, it } from "vitest";
import { getAllExercises, getExercise } from "@/lib/content/registry";
import { runJavaScript } from "@/lib/execution/javascript/engine";
import { finalizeCheck } from "@/lib/execution/types";
import { javascriptSolutions as baseSolutions } from "./fixtures/solutions";
import { javascriptExpansionSolutions } from "./fixtures/solutions-expansion";
import { javascriptM3Solutions } from "./fixtures/solutions-m3";
import { isolatedAsyncFunction } from "./helpers/js-realm";

const javascriptSolutions = [...baseSolutions, ...javascriptExpansionSolutions, ...javascriptM3Solutions];

async function check(exerciseId: string, stepId: string, source: string) {
  const exercise = getExercise(exerciseId);
  const step = exercise?.steps.find((candidate) => candidate.id === stepId);
  if (!exercise || !step) throw new Error(`Unknown step ${exerciseId}/${stepId}`);
  const { run, tests = [] } = await runJavaScript({
    code: source,
    fileName: "index.js",
    tests: step.tests.map((test) => ({ id: test.id, code: test.code })),
    AsyncFunction: isolatedAsyncFunction(),
    settleMs: 200,
  });
  return { step, result: finalizeCheck(run, tests, run.durationMs) };
}

describe("JavaScript exercises: reference solutions", () => {
  for (const solution of javascriptSolutions) {
    it(`${solution.exerciseId} / ${solution.stepId}: ${solution.name}`, async () => {
      const { step, result } = await check(solution.exerciseId, solution.stepId, solution.code);
      const failing = result.tests.filter((test) => test.status !== "pass").map((test) => test.id);
      expect(failing).toEqual(solution.failing);
      // Every test of the step must have reported a result.
      expect(result.tests.map((test) => test.id)).toEqual(step.tests.map((test) => test.id));
      // Broken test definitions would show up as "error".
      expect(result.tests.some((test) => test.status === "error")).toBe(false);
      expect(result.passed).toBe(solution.failing.length === 0);
    });
  }

  it("covers every JavaScript step with at least one valid and one invalid solution", () => {
    for (const exercise of getAllExercises().filter((candidate) => candidate.language === "javascript")) {
      for (const step of exercise.steps) {
        const cases = javascriptSolutions.filter(
          (solution) => solution.exerciseId === exercise.id && solution.stepId === step.id,
        );
        expect(cases.some((solution) => solution.failing.length === 0), `${exercise.id}/${step.id} valid`).toBe(true);
        expect(cases.some((solution) => solution.failing.length > 0), `${exercise.id}/${step.id} invalid`).toBe(true);
      }
    }
  });
});

describe("JavaScript exercises: starter code", () => {
  for (const exercise of getAllExercises().filter((candidate) => candidate.language === "javascript")) {
    for (const step of exercise.steps) {
      it(`${exercise.id} / ${step.id}: starter code does not already pass`, async () => {
        const starter = (step.starterFiles ?? exercise.starterFiles).find((file) => file.entry);
        const { result } = await check(exercise.id, step.id, starter?.content ?? "");
        expect(result.run.error?.kind).not.toBe("syntax");
        expect(result.passed).toBe(false);
      });
    }
  }
});

describe("JavaScript exercises: feedback details", () => {
  it("shows expected and received values for a wrong return value", async () => {
    const { result } = await check(
      "greeting-functions",
      "write-function",
      'const learnerName = "Ada";\nconst greet = (name) => `Hello ${name}`;\n',
    );
    const test = result.tests.find((candidate) => candidate.id === "greet-ada");
    expect(test).toMatchObject({ status: "fail", expected: '"Hello, Ada!"', actual: '"Hello Ada"' });
  });

  it("does not complete a step when the program throws, even if tests pass", async () => {
    const { result } = await check(
      "greeting-functions",
      "store-name",
      'const learnerName = "Ada";\nundefinedFunction();\n',
    );
    expect(result.tests.every((test) => test.status === "pass")).toBe(true);
    expect(result.run.status).toBe("error");
    expect(result.passed).toBe(false);
  });
});
