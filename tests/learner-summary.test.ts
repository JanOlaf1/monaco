import { describe, expect, it } from "vitest";
import { toGamificationCatalog } from "@/lib/content/catalog";
import { getCatalog } from "@/lib/content/localize";
import { applyStepPass } from "@/lib/gamification/engine";
import { emptyGamification, type GamificationState } from "@/lib/gamification/state";
import { summarizeLearner } from "@/lib/learner/summary";
import { emptyProgress, recordStepPassed, recordVisit, type ProgressState } from "@/lib/progress/progress";

const courses = getCatalog("en");
const catalog = toGamificationCatalog(courses);
const python = courses.find((course) => course.id === "python")!;
const today = "2026-11-10";

function complete(progress: ProgressState, gamification: GamificationState, exerciseId: string) {
  const info = catalog.exercises[exerciseId];
  let p = progress;
  let g = gamification;
  for (const stepId of info.stepIds) {
    p = recordStepPassed(p, exerciseId, stepId, info.stepIds, "2026-11-10T10:00:00.000Z");
    g = applyStepPass({ state: g, progress: p, catalog, exerciseId, stepId, now: new Date(2026, 10, 10, 10) }).state;
  }
  return { progress: p, gamification: g };
}

const summarize = (progress: ProgressState, gamification: GamificationState) =>
  summarizeLearner({ progress, gamification, courses, catalog, today });

describe("learner summary", () => {
  it("treats an empty browser as a first-time learner", () => {
    const summary = summarize(emptyProgress, emptyGamification);
    expect(summary.isReturning).toBe(false);
    expect(summary.continueAt).toBeUndefined();
    expect(summary.level.level).toBe(1);
    expect(summary.milestone).toEqual({ kind: "level", level: 2, xpToNext: 100 });
    expect(summary.courses.map((entry) => entry.course.id)).toEqual(["python", "javascript"]);
  });

  it("continues the course chosen during onboarding", () => {
    const summary = summarize(emptyProgress, { ...emptyGamification, preferredCourse: "javascript" });
    expect(summary.isReturning).toBe(true);
    expect(summary.continueAt?.course.id).toBe("javascript");
    expect(summary.continueAt?.exercise.id).toBe("js-hello-console");
  });

  it("continues after the last visited exercise once it is complete", () => {
    let state = complete(emptyProgress, emptyGamification, "py-hello-world");
    state.progress = recordVisit(state.progress, "python", "py-hello-world", "2026-11-10T10:00:00.000Z");
    const summary = summarize(state.progress, state.gamification);
    expect(summary.continueAt?.exercise.id).toBe("py-multiple-prints");
    expect(summary.completedExercises).toBe(1);
    expect(summary.level.totalXp).toBe(30);
    // One challenge left in chapter 1 → chapter milestone.
    expect(summary.milestone).toMatchObject({ kind: "chapter", remaining: 1 });
    state = complete(state.progress, state.gamification, "py-multiple-prints");
    const after = summarize(state.progress, state.gamification);
    expect(after.completedChapters.map((entry) => entry.chapter.id)).toEqual(["py-intro"]);
    expect(after.level.totalXp).toBe(30 + 30 + 50);
  });

  it("resumes an unfinished exercise the learner left", () => {
    const progress = recordVisit(emptyProgress, "python", "py-shopping-total", "2026-11-10T10:00:00.000Z");
    expect(summarize(progress, emptyGamification).continueAt?.exercise.id).toBe("py-shopping-total");
  });

  it("marks a course complete when every exercise is done", () => {
    let state = { progress: emptyProgress, gamification: emptyGamification };
    for (const id of python.exerciseIds) state = complete(state.progress, state.gamification, id);
    state.progress = recordVisit(state.progress, "python", python.exerciseIds.at(-1)!, "2026-11-10T10:00:00.000Z");
    const summary = summarize(state.progress, state.gamification);
    expect(summary.continueAt?.courseComplete).toBe(true);
    // Checkpoints are reviews between bands, not chapters: they earn no chapter bonus and are not listed here.
    expect(summary.completedChapters).toHaveLength(python.chapters.filter((chapter) => chapter.kind === "chapter").length);
    expect(summary.courses.find((entry) => entry.course.id === "python")?.complete).toBe(true);
    expect(Object.keys(state.gamification.achievements)).toEqual(
      expect.arrayContaining(["first-steps", "curious-coder", "persistent-learner", "lab-champion", "python-explorer"]),
    );
  });
});
