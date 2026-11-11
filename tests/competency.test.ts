import { describe, expect, it } from "vitest";
import { toGamificationCatalog } from "@/lib/content/catalog";
import { getCatalog, getSkillCatalog } from "@/lib/content/localize";
import { applyStepPass } from "@/lib/gamification/engine";
import { emptyGamification, type GamificationState } from "@/lib/gamification/state";
import { exerciseXp, XP_REWARDS } from "@/lib/gamification/xp";
import {
  applyPlacementResult,
  dismissPlacementPrompt,
  effectiveLevel,
  emptyCompetency,
  hasCompetencyChoices,
  migrateCompetency,
  parseCompetency,
  setOnboarding,
  setRecommendation,
  setSelfReportedLevel,
  setUserOverride,
  type CompetencyState,
  type PlacementResult,
} from "@/lib/learning/competency";
import { checkpointBefore, entryChapter, nextTask, recommendStart, skillStandings } from "@/lib/learning/recommend";
import { summarizeLearner } from "@/lib/learner/summary";
import { emptyProgress, recordStepPassed, recordVisit, type ProgressState } from "@/lib/progress/progress";

const NOW = "2026-11-11T09:00:00.000Z";
const courses = getCatalog("en");
const catalog = toGamificationCatalog(courses);
const python = courses.find((course) => course.id === "python")!;
const javascript = courses.find((course) => course.id === "javascript")!;

function complete(progress: ProgressState, exerciseId: string): ProgressState {
  const steps = catalog.exercises[exerciseId].stepIds;
  return steps.reduce((state, stepId) => recordStepPassed(state, exerciseId, stepId, steps, NOW), progress);
}

const placement = (level: PlacementResult["level"]): PlacementResult => ({
  assessmentId: "placement-python",
  version: 1,
  level,
  correct: 6,
  answered: 7,
  total: 9,
  stoppedEarly: true,
  completedAt: NOW,
});

describe("competency state", () => {
  it("round-trips through storage and rejects unknown versions", () => {
    let state = setSelfReportedLevel(emptyCompetency, "python", "intermediate", NOW);
    state = applyPlacementResult(state, "python", placement("advanced"), { "py.loops": { correct: 1, total: 1 } }, NOW);
    state = setOnboarding(state, "completed");
    expect(parseCompetency(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseCompetency({ ...state, version: 2 })).toBeNull();
    expect(parseCompetency("nonsense")).toBeNull();
  });

  it("drops malformed entries instead of trusting them", () => {
    const parsed = parseCompetency({
      version: 1,
      onboarding: "hacked",
      tracks: {
        python: {
          selfReportedLevel: "wizard",
          userOverride: "advanced",
          placementResult: { assessmentId: "x", version: 1, level: "professional", correct: 1, answered: 1, total: 1, completedAt: NOW },
          skillEvidence: { "py.loops": { correct: 5, total: 2, at: NOW }, "py.text": { correct: 1, total: 2, at: NOW } },
        },
        cobol: { selfReportedLevel: "beginner" },
      },
      dismissedPrompts: ["python", "python", "cobol"],
    });
    expect(parsed?.onboarding).toBe("pending");
    expect(Object.keys(parsed!.tracks)).toEqual(["python"]);
    const track = parsed!.tracks.python!;
    expect(track.selfReportedLevel).toBeNull();
    expect(track.userOverride).toBe("advanced");
    // A placement can never claim "professional", and impossible scores are dropped.
    expect(track.placementResult).toBeNull();
    expect(Object.keys(track.skillEvidence)).toEqual(["py.text"]);
    expect(parsed!.dismissedPrompts).toEqual(["python"]);
  });

  it("uses the learner's own choice first, then the placement, then the self-report", () => {
    let state = setSelfReportedLevel(emptyCompetency, "python", "not-sure", NOW);
    expect(effectiveLevel(state.tracks.python)).toBeNull();
    state = setSelfReportedLevel(state, "python", "advanced", NOW);
    expect(effectiveLevel(state.tracks.python)).toEqual({ level: "advanced", source: "self" });
    state = applyPlacementResult(state, "python", placement("intermediate"), {}, NOW);
    expect(effectiveLevel(state.tracks.python)).toEqual({ level: "intermediate", source: "placement" });
    state = setUserOverride(state, "python", "beginner", NOW);
    expect(effectiveLevel(state.tracks.python)).toEqual({ level: "beginner", source: "override" });
  });

  it("keeps a manual override when a new placement result arrives", () => {
    let state = setUserOverride(emptyCompetency, "python", "professional", NOW);
    state = applyPlacementResult(state, "python", placement("intermediate"), { "py.loops": { correct: 2, total: 2 } }, NOW);
    expect(effectiveLevel(state.tracks.python)?.level).toBe("professional");
    expect(state.tracks.python?.assessmentDate).toBe(NOW);
    expect(state.tracks.python?.skillEvidence["py.loops"]).toEqual({ correct: 2, total: 2, source: "placement", at: NOW });
    // Clearing the override lets the suggestion apply.
    state = setUserOverride(state, "python", null, NOW);
    expect(effectiveLevel(state.tracks.python)).toEqual({ level: "intermediate", source: "placement" });
  });

  it("remembers dismissed prompts once", () => {
    const state = dismissPlacementPrompt(dismissPlacementPrompt(emptyCompetency, "python"), "python");
    expect(state.dismissedPrompts).toEqual(["python"]);
  });

  it("counts choices made during onboarding as returning activity", () => {
    expect(hasCompetencyChoices(emptyCompetency)).toBe(false);
    expect(hasCompetencyChoices(setOnboarding(emptyCompetency, "skipped"))).toBe(true);
    expect(hasCompetencyChoices(setSelfReportedLevel(emptyCompetency, "react", "beginner", NOW))).toBe(true);
  });
});

describe("migration from data saved before proficiency levels", () => {
  it("marks earlier learners as legacy without forcing onboarding", () => {
    const migrated = migrateCompetency(emptyCompetency, true);
    expect(migrated).toEqual({ ...emptyCompetency, onboarding: "legacy", migrated: true });
    expect(migrateCompetency(migrated, false)).toBe(migrated);
  });

  it("leaves new learners pending and keeps choices already made", () => {
    expect(migrateCompetency(emptyCompetency, false).onboarding).toBe("pending");
    const chosen = setOnboarding(emptyCompetency, "completed");
    expect(migrateCompetency(chosen, true).onboarding).toBe("completed");
  });
});

describe("recommendations", () => {
  it("starts beginners at the very beginning and others at their band", () => {
    expect(entryChapter(python, "beginner")?.id).toBe("py-intro");
    expect(entryChapter(python, "intermediate")?.id).toBe("py-functions");
    expect(entryChapter(python, "advanced")?.id).toBe("py-comprehensions");
    expect(entryChapter(javascript, "intermediate")?.id).toBe("js-loops");
    expect(entryChapter(javascript, "advanced")?.id).toBe("js-array-methods");
  });

  it("sends professionals to the deepest band available, never a checkpoint", () => {
    expect(entryChapter(python, "professional")?.id).toBe("py-comprehensions");
    expect(entryChapter(javascript, "professional")?.kind).toBe("chapter");
  });

  it("offers the checkpoint for the band being skipped", () => {
    expect(checkpointBefore(python, "py-functions")?.id).toBe("py-checkpoint-basics");
    expect(checkpointBefore(python, "py-comprehensions")?.id).toBe("py-checkpoint-intermediate");
    expect(checkpointBefore(python, "py-intro")).toBeUndefined();
  });

  it("describes a beginner start as a first success", () => {
    expect(recommendStart(python, "beginner", "self-report", NOW)).toMatchObject({
      chapterId: "py-intro",
      exerciseId: "py-hello-world",
      reason: "first-success",
    });
    expect(recommendStart(javascript, "advanced", "placement", NOW)).toMatchObject({
      chapterId: "js-array-methods",
      exerciseId: "js-format-prices",
      reason: "placement",
    });
  });

  it("picks the next unfinished task from the suggested start, then earlier gaps", () => {
    const state = setRecommendation(
      emptyCompetency,
      "python",
      recommendStart(python, "intermediate", "self-report", NOW),
      NOW,
    );
    const track = state.tracks.python;
    expect(nextTask(python, emptyProgress, track)).toMatchObject({ exercise: { id: "py-greet-function" }, fromRecommendation: true });

    let progress = complete(emptyProgress, "py-greet-function");
    expect(nextTask(python, progress, track)?.exercise.id).toBe("py-area-function");

    // Everything from the suggested start onwards is done: earlier chapters are still offered.
    const fromStart = python.exerciseIds.slice(python.exerciseIds.indexOf("py-greet-function"));
    for (const id of fromStart) progress = complete(progress, id);
    expect(nextTask(python, progress, track)).toMatchObject({ exercise: { id: "py-hello-world" }, fromRecommendation: false });

    for (const id of python.exerciseIds) progress = complete(progress, id);
    expect(nextTask(python, progress, track)).toBeUndefined();
  });

  it("never marks skipped chapters as completed", () => {
    const progress = complete(emptyProgress, "py-checkpoint-cinema");
    expect(Object.keys(progress.exercises)).toEqual(["py-checkpoint-cinema"]);
  });

  it("combines exercise completions with placement evidence per skill", () => {
    let state = applyPlacementResult(emptyCompetency, "python", placement("intermediate"), { "py.loops": { correct: 1, total: 2 } }, NOW);
    state = setRecommendation(state, "python", null, NOW);
    const progress = complete(emptyProgress, "py-count-up");
    const standings = skillStandings(python, getSkillCatalog("en"), progress, state.tracks.python);
    const loops = standings.find((standing) => standing.skill.id === "py.loops");
    expect(loops).toMatchObject({ exercises: { completed: 1, total: 3 }, placement: { correct: 1, total: 2 } });
    expect(standings.every((standing) => standing.skill.track === "python")).toBe(true);
  });
});

describe("home continue target", () => {
  const summarize = (progress: ProgressState, gamification: GamificationState, competency: CompetencyState) =>
    summarizeLearner({ progress, gamification, competency, courses, catalog, today: "2026-11-11" });

  it("goes to the suggested start for a learner who chose a level", () => {
    let competency = setSelfReportedLevel(setOnboarding(emptyCompetency, "completed"), "javascript", "advanced", NOW);
    competency = setRecommendation(competency, "javascript", recommendStart(javascript, "advanced", "self-report", NOW), NOW);
    const summary = summarize(emptyProgress, { ...emptyGamification, preferredCourse: "javascript" }, competency);
    expect(summary.isReturning).toBe(true);
    expect(summary.continueAt).toMatchObject({ exercise: { id: "js-format-prices" }, reason: "recommended" });
  });

  it("resumes an unfinished exercise before anything else", () => {
    let competency = setSelfReportedLevel(emptyCompetency, "python", "advanced", NOW);
    competency = setRecommendation(competency, "python", recommendStart(python, "advanced", "self-report", NOW), NOW);
    const progress = recordVisit(emptyProgress, "python", "py-count-up", NOW);
    const summary = summarize(progress, emptyGamification, competency);
    expect(summary.continueAt).toMatchObject({ exercise: { id: "py-count-up" }, reason: "resume" });
  });

  it("works without any competency data (older learners)", () => {
    const progress = recordVisit(complete(emptyProgress, "py-hello-world"), "python", "py-hello-world", NOW);
    const summary = summarizeLearner({ progress, gamification: emptyGamification, courses, catalog, today: "2026-11-11" });
    expect(summary.continueAt).toMatchObject({ exercise: { id: "py-multiple-prints" }, reason: "next" });
  });
});

describe("checkpoint rewards", () => {
  it("awards lab-sized XP but no chapter bonus for a checkpoint", () => {
    expect(exerciseXp("checkpoint")).toBe(50);
    expect(exerciseXp("challenge")).toBe(XP_REWARDS.challenge);
    const steps = catalog.exercises["py-checkpoint-cinema"].stepIds;
    const progress = recordStepPassed(emptyProgress, "py-checkpoint-cinema", steps[0], steps, NOW);
    const { rewards } = applyStepPass({
      state: emptyGamification,
      progress,
      catalog,
      exerciseId: "py-checkpoint-cinema",
      stepId: steps[0],
      now: new Date(NOW),
    });
    expect(rewards.awards.map((award) => [award.kind, award.xp])).toEqual([
      ["step", 5],
      ["exercise", 50],
    ]);
    expect(rewards.chapterCompleted).toBeUndefined();
  });
});
