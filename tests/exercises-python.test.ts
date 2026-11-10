import { beforeAll, describe, expect, it } from "vitest";
import { getAllExercises, getExercise } from "@/lib/content/registry";
import { chunksToEntries } from "@/lib/execution/output";
import { pythonSolutions as baseSolutions } from "./fixtures/solutions";
import { pythonExpansionSolutions } from "./fixtures/solutions-expansion";
import { loadHarness, type PythonHarness } from "./helpers/pyodide";

const pythonSolutions = [...baseSolutions, ...pythonExpansionSolutions];

let harness: PythonHarness;

beforeAll(async () => {
  harness = await loadHarness();
});

function stepTests(exerciseId: string, stepId: string) {
  const step = getExercise(exerciseId)?.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Unknown step ${exerciseId}/${stepId}`);
  return step.tests.map((test) => ({ id: test.id, code: test.code }));
}

describe("Python harness", () => {
  it("captures output and reports runtime errors with the learner's line", () => {
    const report = harness.runProgram('print("hi")\nx = 1\nprint(y)\n');
    expect(report.error).toMatchObject({ kind: "runtime", name: "NameError", line: 3 });
    expect(chunksToEntries(report.output ?? [])).toEqual([{ stream: "stdout", text: "hi" }]);
  });

  it("reports syntax errors and skips tests", () => {
    const report = harness.runTests("if True\n    print(1)\n", [{ id: "a", code: "expect(True)" }]);
    expect(report.run.error).toMatchObject({ kind: "syntax", name: "SyntaxError", line: 1 });
    expect(report.tests).toEqual([{ id: "a", status: "skipped" }]);
  });

  it("reports indentation errors as syntax errors", () => {
    const report = harness.runProgram("if True:\nprint(1)\n");
    expect(report.error).toMatchObject({ kind: "syntax", name: "IndentationError", line: 2 });
  });

  it("blocks input() and browser bridge modules", () => {
    expect(harness.runProgram("input()\n").error?.name).toBe("EOFError");
    expect(harness.runProgram("import js\n").error?.name).toBe("ImportError");
    expect(harness.runProgram("import math\nprint(math.sqrt(16))\n").error).toBeNull();
  });

  it("isolates namespaces and restores builtins between runs", () => {
    harness.runProgram("import builtins\nbuiltins.len = lambda x: 0\nsecret = 1\n");
    const report = harness.runTests("value = len('abc')\n", [
      { id: "len", code: "expect_equal(var('value'), 3)" },
      { id: "isolated", code: "expect(not has_var('secret'))" },
    ]);
    expect(report.tests.map((test) => test.status)).toEqual(["pass", "pass"]);
  });

  it("re-runs programs with replaced top-level values", () => {
    const report = harness.runTests("n = 2\nsquare = n * n\n", [
      { id: "override", code: "expect_equal(run(n=5).var('square'), 25)" },
      { id: "missing", code: "run(m=1)" },
    ]);
    expect(report.tests[0]).toEqual({ id: "override", status: "pass" });
    expect(report.tests[1]).toMatchObject({ id: "missing", status: "fail" });
  });

  it("formats expected and actual values for failed expectations", () => {
    const report = harness.runTests("total = 4\n", [{ id: "eq", code: "expect_equal(var('total'), 5)" }]);
    expect(report.tests[0]).toMatchObject({ status: "fail", expected: "5", actual: "4" });
  });

  it("marks broken test code as a test error", () => {
    const report = harness.runTests("x = 1\n", [{ id: "broken", code: "expect(" }]);
    expect(report.tests[0].status).toBe("error");
  });
});

describe("Python exercises: reference solutions", () => {
  for (const solution of pythonSolutions) {
    it(`${solution.exerciseId} / ${solution.stepId}: ${solution.name}`, () => {
      const tests = stepTests(solution.exerciseId, solution.stepId);
      const report = harness.runTests(solution.code, tests);
      const failing = report.tests.filter((test) => test.status !== "pass").map((test) => test.id);
      expect(failing).toEqual(solution.failing);
      expect(report.tests.map((test) => test.id)).toEqual(tests.map((test) => test.id));
      expect(report.tests.some((test) => test.status === "error")).toBe(false);
      if (solution.failing.length === 0) expect(report.run.error).toBeNull();
    });
  }

  it("covers every Python step with at least one valid and one invalid solution", () => {
    for (const exercise of getAllExercises().filter((candidate) => candidate.language === "python")) {
      for (const step of exercise.steps) {
        const cases = pythonSolutions.filter(
          (solution) => solution.exerciseId === exercise.id && solution.stepId === step.id,
        );
        expect(cases.some((solution) => solution.failing.length === 0), `${exercise.id}/${step.id} valid`).toBe(true);
        expect(cases.some((solution) => solution.failing.length > 0), `${exercise.id}/${step.id} invalid`).toBe(true);
      }
    }
  });
});

describe("Python exercises: starter code", () => {
  for (const exercise of getAllExercises().filter((candidate) => candidate.language === "python")) {
    for (const step of exercise.steps) {
      it(`${exercise.id} / ${step.id}: starter code runs but does not pass`, () => {
        const starter = (step.starterFiles ?? exercise.starterFiles).find((file) => file.entry);
        const report = harness.runTests(starter?.content ?? "", stepTests(exercise.id, step.id));
        expect(report.run.error).toBeNull();
        expect(report.tests.every((test) => test.status === "pass")).toBe(false);
      });
    }
  }
});
