import { describe, expect, it } from "vitest";
import { emptyDrafts, parseDrafts, resolveFiles, setDraftFile } from "@/lib/progress/drafts";
import {
  courseProgress,
  emptyProgress,
  exerciseStatus,
  initialStepIndex,
  nextExerciseInCourse,
  parseProgress,
  recordStepPassed,
  recordVisit,
  setCurrentStep,
} from "@/lib/progress/progress";
import type { PersistenceAdapter } from "@/lib/storage/adapter";
import { createPersistentStore } from "@/lib/storage/persistent-store";

const now = "2026-11-10T12:00:00.000Z";
const steps = ["a", "b", "c"];

describe("progress", () => {
  it("completes an exercise only when every step has passed", () => {
    let state = recordStepPassed(emptyProgress, "ex", "a", steps, now);
    expect(exerciseStatus(state, "ex")).toBe("in_progress");
    state = recordStepPassed(state, "ex", "b", steps, now);
    state = recordStepPassed(state, "ex", "b", steps, now); // repeated check
    expect(state.exercises.ex.completedStepIds).toEqual(["a", "b"]);
    expect(exerciseStatus(state, "ex")).toBe("in_progress");
    state = recordStepPassed(state, "ex", "c", steps, "2026-11-11T00:00:00.000Z");
    expect(exerciseStatus(state, "ex")).toBe("completed");
    expect(state.exercises.ex.completedAt).toBe("2026-11-11T00:00:00.000Z");
  });

  it("ignores unknown step ids and keeps the first completion date", () => {
    expect(recordStepPassed(emptyProgress, "ex", "zzz", steps, now)).toBe(emptyProgress);
    let state = recordStepPassed(emptyProgress, "lab", "only", ["only"], now);
    state = recordStepPassed(state, "lab", "only", ["only"], "2027-01-01T00:00:00.000Z");
    expect(state.exercises.lab.completedAt).toBe(now);
  });

  it("computes course progress and the exercise to continue with", () => {
    let state = recordStepPassed(emptyProgress, "one", "lab", ["lab"], now);
    state = recordVisit(state, "course", "two", now);
    expect(courseProgress(state, ["one", "two", "three"])).toEqual({ completed: 1, total: 3, started: true, percent: 33 });
    expect(nextExerciseInCourse(state, ["one", "two", "three"])).toBe("two");
    expect(courseProgress(emptyProgress, [])).toEqual({ completed: 0, total: 0, started: false, percent: 0 });
  });

  it("resumes at the saved step, else the first unfinished one", () => {
    let state = recordStepPassed(emptyProgress, "ex", "a", steps, now);
    expect(initialStepIndex(state, "ex", steps)).toBe(1);
    state = setCurrentStep(state, "ex", "a", now);
    expect(initialStepIndex(state, "ex", steps)).toBe(0);
    expect(initialStepIndex(emptyProgress, "ex", steps)).toBe(0);
  });

  it("parses malformed stored progress safely", () => {
    expect(parseProgress("garbage")).toBeNull();
    expect(parseProgress({ version: 99, exercises: {} })).toBeNull();
    const parsed = parseProgress({
      version: 1,
      exercises: { ok: { completedStepIds: ["a", 3], updatedAt: now }, broken: { completedStepIds: "nope" } },
    });
    expect(parsed?.exercises).toEqual({ ok: { completedStepIds: ["a"], updatedAt: now } });
  });
});

describe("code drafts", () => {
  const starter = [{ name: "main.py", language: "python" as const, content: "# start\n", entry: true }];

  it("falls back to starter code and keeps saved edits", () => {
    expect(resolveFiles(emptyDrafts, "ex", starter)).toEqual({ "main.py": "# start\n" });
    const state = setDraftFile(emptyDrafts, "ex", "main.py", "print(1)\n", now);
    expect(resolveFiles(state, "ex", starter)).toEqual({ "main.py": "print(1)\n" });
    expect(setDraftFile(state, "ex", "main.py", "print(1)\n", now)).toBe(state);
  });

  it("drops invalid stored drafts", () => {
    expect(parseDrafts({ version: 1, exercises: { a: { files: { "x.py": 1, "y.py": "ok" } } } })).toEqual({
      version: 1,
      exercises: { a: { files: { "y.py": "ok" }, updatedAt: "" } },
    });
  });
});

describe("persistent store", () => {
  function memoryAdapter<T>(initial: T | null) {
    let stored = initial;
    const saves: T[] = [];
    const adapter: PersistenceAdapter<T> = {
      load: async () => stored,
      save: async (value) => {
        stored = value;
        saves.push(value);
      },
    };
    return { adapter, saves };
  }

  it("serves the initial value until loaded, then the stored value", async () => {
    const { adapter } = memoryAdapter({ count: 5 });
    const store = createPersistentStore({ adapter, initial: { count: 0 } });
    expect(store.getServerSnapshot()).toEqual({ value: { count: 0 }, hydrated: false });
    expect(store.getSnapshot().hydrated).toBe(false);
    const unsubscribe = store.subscribe(() => {});
    await store.whenHydrated();
    expect(store.getSnapshot()).toEqual({ value: { count: 5 }, hydrated: true });
    expect(store.getServerSnapshot().hydrated).toBe(false);
    unsubscribe();
  });

  it("replays updates made before hydration and persists them", async () => {
    const { adapter, saves } = memoryAdapter({ count: 5 });
    const store = createPersistentStore({ adapter, initial: { count: 0 } });
    store.update((value) => ({ count: value.count + 1 }));
    await store.whenHydrated();
    await store.flush();
    expect(store.getSnapshot().value).toEqual({ count: 6 });
    expect(saves.at(-1)).toEqual({ count: 6 });
  });

  it("debounces saves and supports silent updates", async () => {
    const { adapter, saves } = memoryAdapter<{ text: string }>(null);
    const store = createPersistentStore({ adapter, initial: { text: "" } });
    await store.whenHydrated();
    let notified = 0;
    store.subscribe(() => notified++);
    store.update(() => ({ text: "a" }), { debounceMs: 50, silent: true });
    store.update(() => ({ text: "ab" }), { debounceMs: 50, silent: true });
    expect(saves).toHaveLength(0);
    expect(notified).toBe(0);
    await store.flush();
    expect(saves).toEqual([{ text: "ab" }]);
  });
});
