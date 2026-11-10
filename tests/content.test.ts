import { parse } from "acorn";
import { beforeAll, describe, expect, it } from "vitest";
import { getAllExercises, getCourseExerciseIds, getCourses, getExercise, getExerciseRouteParams } from "@/lib/content/registry";
import { localizeExercise } from "@/lib/content/localize";
import { runnerSupport } from "@/lib/execution/registry";
import { locales } from "@/lib/i18n/config";
import { loadHarness, type PythonHarness } from "./helpers/pyodide";

/** Every object that looks like LocalizedText ({ en, fi }) in a content tree. */
function collectLocalized(value: unknown, path: string, out: { path: string; text: Record<string, unknown> }[]) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectLocalized(item, `${path}[${index}]`, out));
    return;
  }
  const record = value as Record<string, unknown>;
  if ("en" in record && typeof record.en === "string") {
    out.push({ path, text: record });
    return;
  }
  for (const [key, child] of Object.entries(record)) collectLocalized(child, `${path}.${key}`, out);
}

describe("course content", () => {
  it("has unique exercise ids and consistent course/chapter references", () => {
    const ids = getAllExercises().map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const exercise of getAllExercises()) {
      const course = getCourses().find((candidate) => candidate.id === exercise.courseId);
      expect(course, exercise.id).toBeDefined();
      const chapter = course?.chapters.find((candidate) => candidate.id === exercise.chapterId);
      expect(chapter?.exerciseIds, exercise.id).toContain(exercise.id);
    }
    const listed: string[] = [];
    for (const course of getCourses()) {
      const chapterIds = course.chapters.map((chapter) => chapter.id);
      expect(new Set(chapterIds).size, course.id).toBe(chapterIds.length);
      for (const chapter of course.chapters) {
        for (const id of chapter.exerciseIds) expect(getExercise(id), `${course.id}/${id}`).toBeDefined();
        if (chapter.status === "planned") expect(chapter.exerciseIds).toEqual([]);
        listed.push(...chapter.exerciseIds);
      }
    }
    // Every exercise appears in exactly one chapter.
    expect([...listed].sort()).toEqual([...ids].sort());
  });

  it("has at least 20 playable exercises in each runnable language", () => {
    for (const courseId of ["python", "javascript"]) {
      expect(getCourseExerciseIds(courseId).length, courseId).toBeGreaterThanOrEqual(20);
      const course = getCourses().find((candidate) => candidate.id === courseId)!;
      expect(course.chapters.filter((chapter) => chapter.status === "available").length).toBeGreaterThanOrEqual(10);
    }
  });

  it("meets the authoring quality bar for every exercise", () => {
    for (const exercise of getAllExercises()) {
      expect(exercise.objectives.length, `${exercise.id} objectives`).toBeGreaterThan(0);
      expect(exercise.estimatedMinutes, `${exercise.id} minutes`).toBeGreaterThan(0);
      for (const step of exercise.steps) {
        expect(step.hints?.length ?? 0, `${exercise.id}/${step.id} hints`).toBeGreaterThan(0);
        expect(step.tests.length, `${exercise.id}/${step.id} tests`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("only lists interactive exercises for languages with a working runner", () => {
    for (const course of getCourses()) {
      const exerciseIds = getCourseExerciseIds(course.id);
      if (runnerSupport[course.language] !== "available") {
        expect(exerciseIds, course.id).toEqual([]);
        expect(course.status).toBe("planned");
      }
    }
    expect(getExerciseRouteParams().length).toBeGreaterThan(0);
  });

  it("provides every localized text in every locale", () => {
    const entries: { path: string; text: Record<string, unknown> }[] = [];
    for (const course of getCourses()) collectLocalized(course, course.id, entries);
    for (const exercise of getAllExercises()) collectLocalized(exercise, exercise.id, entries);
    expect(entries.length).toBeGreaterThan(100);
    for (const { path, text } of entries) {
      for (const locale of locales) {
        expect(typeof text[locale] === "string" && (text[locale] as string).trim().length > 0, `${path}.${locale}`).toBe(
          true,
        );
      }
    }
  });

  it("keeps code identifiers identical across translations", () => {
    // Inline code (`...`) names variables and APIs; translations must not change them.
    const entries: { path: string; text: Record<string, unknown> }[] = [];
    for (const exercise of getAllExercises()) collectLocalized(exercise, exercise.id, entries);
    const codeSpans = (text: string) =>
      [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]).filter((span) => /^[A-Za-z_][\w.]*$/.test(span));
    for (const { path, text } of entries) {
      const english = new Set(codeSpans(String(text.en)));
      for (const span of codeSpans(String(text.fi))) {
        expect(english.has(span) || span.length < 3, `${path}: \`${span}\` only in Finnish`).toBe(true);
      }
    }
  });

  it("has valid exercise structure", () => {
    for (const exercise of getAllExercises()) {
      expect(exercise.steps.length, exercise.id).toBeGreaterThan(0);
      if (exercise.type === "lab") {
        expect(exercise.steps, exercise.id).toHaveLength(1);
        expect(exercise.requirements?.length, exercise.id).toBeGreaterThan(0);
      }
      expect(exercise.starterFiles.filter((file) => file.entry), exercise.id).toHaveLength(1);
      const stepIds = exercise.steps.map((step) => step.id);
      expect(new Set(stepIds).size, exercise.id).toBe(stepIds.length);
      for (const step of exercise.steps) {
        expect(step.tests.length, `${exercise.id}/${step.id}`).toBeGreaterThan(0);
        const testIds = step.tests.map((test) => test.id);
        expect(new Set(testIds).size, `${exercise.id}/${step.id}`).toBe(testIds.length);
        for (const file of step.starterFiles ?? []) {
          expect(exercise.starterFiles.map((starter) => starter.name), `${exercise.id}/${step.id}`).toContain(file.name);
        }
      }
    }
  });

  it("localizes an exercise into a single-locale, serializable object", () => {
    const exercise = getExercise("shipping-cost-lab")!;
    const fi = localizeExercise(exercise, "fi");
    expect(fi.title).toBe("Harjoitustyö: Toimituskulujen laskuri");
    expect(fi.steps[0].tests[0].label).toContain("`if`");
    expect(JSON.parse(JSON.stringify(fi))).toEqual(fi);
    expect(fi.steps[0].starterFiles).toEqual(exercise.starterFiles);
  });

  it("has JavaScript test code that parses", () => {
    for (const exercise of getAllExercises().filter((candidate) => candidate.language === "javascript")) {
      for (const step of exercise.steps) {
        for (const test of step.tests) {
          expect(
            () => parse(`(async function (t) {\n${test.code}\n})`, { ecmaVersion: "latest" }),
            `${exercise.id}/${step.id}/${test.id}`,
          ).not.toThrow();
        }
      }
    }
  });
});

describe("Python test code", () => {
  let harness: PythonHarness;
  beforeAll(async () => {
    harness = await loadHarness();
  });

  it("compiles", () => {
    for (const exercise of getAllExercises().filter((candidate) => candidate.language === "python")) {
      for (const step of exercise.steps) {
        for (const test of step.tests) {
          harness.pyodide.globals.set("__test_source", test.code);
          expect(
            () => harness.pyodide.runPython("compile(__test_source, '<test>', 'exec')"),
            `${exercise.id}/${step.id}/${test.id}`,
          ).not.toThrow();
        }
      }
    }
  });
});
