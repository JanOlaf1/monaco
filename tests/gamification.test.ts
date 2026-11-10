import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, newlyUnlocked, type AchievementContext } from "@/lib/gamification/achievements";
import {
  applyCheckFailure,
  applyStepPass,
  backfillFromProgress,
  buildAchievementContext,
  dailyGoalProgress,
  type GamificationCatalog,
} from "@/lib/gamification/engine";
import { levelInfo, levelThreshold, xpToAdvance } from "@/lib/gamification/levels";
import { emptyGamification, parseGamification, type GamificationState } from "@/lib/gamification/state";
import { addActiveDay, currentStreak, longestStreak, recentDays, streakInfo } from "@/lib/gamification/streaks";
import { XP_REWARDS, totalXp } from "@/lib/gamification/xp";
import { emptyProgress, recordStepPassed, type ProgressState } from "@/lib/progress/progress";

const catalog: GamificationCatalog = {
  exercises: {
    a: { courseId: "python", chapterId: "c1", type: "challenge", stepIds: ["task"] },
    b: { courseId: "python", chapterId: "c1", type: "lab", stepIds: ["lab"] },
    multi: { courseId: "python", chapterId: "c2", type: "challenge", stepIds: ["s1", "s2"] },
    js: { courseId: "javascript", chapterId: "j1", type: "challenge", stepIds: ["task"] },
  },
  chapters: [
    { courseId: "python", chapterId: "c1", language: "python", exerciseIds: ["a", "b"] },
    { courseId: "python", chapterId: "c2", language: "python", exerciseIds: ["multi"] },
    { courseId: "javascript", chapterId: "j1", language: "javascript", exerciseIds: ["js"] },
  ],
};

/** Local-time Date for a calendar day and hour. */
const at = (day: string, hour = 12) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, hour, 0, 0);
};

function pass(
  state: GamificationState,
  progress: ProgressState,
  exerciseId: string,
  stepId: string,
  now: Date,
) {
  const stepIds = catalog.exercises[exerciseId].stepIds;
  const nextProgress = recordStepPassed(progress, exerciseId, stepId, stepIds, now.toISOString());
  const result = applyStepPass({ state, progress: nextProgress, catalog, exerciseId, stepId, now });
  return { ...result, progress: nextProgress };
}

describe("levels", () => {
  it("uses the documented curve", () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(levelThreshold)).toEqual([0, 100, 250, 450, 700, 1000, 2700]);
    expect([1, 2, 3].map(xpToAdvance)).toEqual([100, 150, 200]);
  });

  it("computes level and progress from total XP", () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpToNext: 100, progress: 0 });
    expect(levelInfo(99)).toMatchObject({ level: 1, xpToNext: 1 });
    expect(levelInfo(100)).toMatchObject({ level: 2, xpIntoLevel: 0, xpForLevel: 150 });
    expect(levelInfo(325)).toMatchObject({ level: 3, xpIntoLevel: 75, xpToNext: 125, progress: 75 / 200 });
    expect(levelInfo(-5).level).toBe(1);
  });

  it("requires more XP for each higher level", () => {
    for (let level = 1; level < 30; level++) {
      expect(levelThreshold(level + 2) - levelThreshold(level + 1)).toBeGreaterThan(
        levelThreshold(level + 1) - levelThreshold(level),
      );
    }
  });
});

describe("XP awards", () => {
  it("awards step + challenge XP once for a completed micro-challenge", () => {
    const { state, rewards } = pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-10"));
    expect(rewards.awards.map((award) => award.id)).toEqual(["step:a:task", "exercise:a"]);
    expect(rewards.xpGained).toBe(XP_REWARDS.step + XP_REWARDS.challenge);
    expect(totalXp(state.awards)).toBe(30);
    expect(rewards.exerciseCompleted).toBe(true);
  });

  it("never awards XP twice for the same accomplishment", () => {
    const first = pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-10"));
    const again = pass(first.state, first.progress, "a", "task", at("2026-11-10", 15));
    const nextDay = pass(again.state, again.progress, "a", "task", at("2026-11-11"));
    expect(again.rewards.awards).toEqual([]);
    expect(again.rewards.xpGained).toBe(0);
    expect(nextDay.rewards.xpGained).toBe(0);
    expect(totalXp(nextDay.state.awards)).toBe(30);
  });

  it("awards per step, then the exercise once all steps pass", () => {
    const one = pass(emptyGamification, emptyProgress, "multi", "s1", at("2026-11-10"));
    expect(one.rewards.xpGained).toBe(5);
    expect(one.rewards.exerciseCompleted).toBe(false);
    const two = pass(one.state, one.progress, "multi", "s2", at("2026-11-10"));
    // step + challenge + chapter bonus (c2 has a single exercise)
    expect(two.rewards.xpGained).toBe(5 + 25 + 50);
    expect(two.rewards.chapterCompleted).toEqual({ courseId: "python", chapterId: "c2" });
  });

  it("gives labs more XP and the chapter bonus only when the whole chapter is done", () => {
    const lab = pass(emptyGamification, emptyProgress, "b", "lab", at("2026-11-10"));
    expect(lab.rewards.xpGained).toBe(5 + XP_REWARDS.lab);
    expect(lab.rewards.chapterCompleted).toBeUndefined();
    const challenge = pass(lab.state, lab.progress, "a", "task", at("2026-11-10"));
    expect(challenge.rewards.xpGained).toBe(5 + 25 + XP_REWARDS.chapter);
    expect(challenge.rewards.chapterCompleted).toEqual({ courseId: "python", chapterId: "c1" });
  });

  it("reports level-ups", () => {
    let state = emptyGamification;
    let progress = emptyProgress;
    const result1 = pass(state, progress, "b", "lab", at("2026-11-10")); // 55
    expect(result1.rewards.levelAfter).toBe(1);
    ({ state, progress } = result1);
    const result2 = pass(state, progress, "a", "task", at("2026-11-10")); // +80 = 135
    expect(result2.rewards).toMatchObject({ levelBefore: 1, levelAfter: 2, totalXp: 135 });
  });
});

describe("streaks", () => {
  it("counts consecutive local days and keeps a streak alive until the next day ends", () => {
    let days: string[] = [];
    for (const day of ["2026-11-07", "2026-11-08", "2026-11-09"]) days = addActiveDay(days, day);
    expect(currentStreak(days, "2026-11-09")).toBe(3);
    expect(currentStreak(days, "2026-11-10")).toBe(3); // not studied yet today
    expect(currentStreak(days, "2026-11-11")).toBe(0); // a day was missed
    expect(longestStreak(days)).toBe(3);
  });

  it("does not double-count the same day", () => {
    let days = addActiveDay([], "2026-11-10");
    days = addActiveDay(days, "2026-11-10");
    expect(days).toEqual(["2026-11-10"]);
    const first = pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-10", 9));
    const second = pass(first.state, first.progress, "js", "task", at("2026-11-10", 23));
    expect(first.rewards.firstActivityToday).toBe(true);
    expect(second.rewards.firstActivityToday).toBe(false);
    expect(second.rewards.streak.current).toBe(1);
  });

  it("handles midnight and daylight-saving transitions by calendar day", () => {
    // EU DST ends 25 Oct 2026 and starts 29 Mar 2026.
    let days = addActiveDay([], "2026-10-24");
    days = addActiveDay(days, "2026-10-25");
    days = addActiveDay(days, "2026-10-26");
    expect(currentStreak(days, "2026-10-26")).toBe(3);
    days = addActiveDay(addActiveDay(addActiveDay([], "2026-03-28"), "2026-03-29"), "2026-03-30");
    expect(currentStreak(days, "2026-03-30")).toBe(3);
    // 23:59 and 00:01 are different calendar days.
    const late = pass(emptyGamification, emptyProgress, "a", "task", new Date(2026, 10, 9, 23, 59));
    const early = pass(late.state, late.progress, "js", "task", new Date(2026, 10, 10, 0, 1));
    expect(early.rewards.streak.current).toBe(2);
  });

  it("keeps the best streak after a break and never removes progress", () => {
    let days: string[] = [];
    for (const day of ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-08"]) days = addActiveDay(days, day);
    expect(streakInfo(days, "2026-11-08", 0)).toMatchObject({ current: 1, longest: 3, activeToday: true });
    expect(streakInfo(days, "2026-11-20", 5).longest).toBe(5);
    expect(recentDays(days, "2026-11-08", 3)).toEqual([
      { day: "2026-11-06", active: false },
      { day: "2026-11-07", active: false },
      { day: "2026-11-08", active: true },
    ]);
  });

  it("unlocks On a Roll only after three consecutive days", () => {
    const d1 = pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-08"));
    const d2 = pass(d1.state, d1.progress, "a", "task", at("2026-11-09"));
    expect(d2.state.achievements["on-a-roll"]).toBeUndefined();
    const d3 = pass(d2.state, d2.progress, "a", "task", at("2026-11-10"));
    expect(d3.rewards.achievements).toContain("on-a-roll");
    expect(d3.rewards.xpGained).toBe(0); // practising a solved exercise keeps the streak, but earns no XP
  });
});

describe("daily goal", () => {
  it("counts exercises completed for the first time today", () => {
    const state = { ...emptyGamification, dailyGoal: 2 };
    const first = pass(state, emptyProgress, "a", "task", at("2026-11-10"));
    expect(first.rewards.dailyGoal).toEqual({ done: 1, target: 2, reachedNow: false });
    const repeat = pass(first.state, first.progress, "a", "task", at("2026-11-10"));
    expect(repeat.rewards.dailyGoal).toEqual({ done: 1, target: 2, reachedNow: false });
    const second = pass(repeat.state, repeat.progress, "js", "task", at("2026-11-10"));
    expect(second.rewards.dailyGoal).toEqual({ done: 2, target: 2, reachedNow: true });
    expect(dailyGoalProgress(second.state, "2026-11-11")).toEqual({ done: 0, target: 2 });
  });

  it("is omitted when no goal is set", () => {
    expect(pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-10")).rewards.dailyGoal).toBeUndefined();
  });
});

describe("achievements", () => {
  const base: AchievementContext = {
    completedExercises: 0,
    completedLabs: 0,
    fixedFailingSolution: false,
    bestStreak: 0,
    completedChapters: { python: 0, javascript: 0 },
  };

  it("unlocks nothing for an empty learner", () => {
    expect(newlyUnlocked(base, {})).toEqual([]);
  });

  it("unlocks count-based achievements exactly at their thresholds", () => {
    expect(newlyUnlocked({ ...base, completedExercises: 4 }, {})).toEqual(["first-steps"]);
    expect(newlyUnlocked({ ...base, completedExercises: 5 }, {})).toEqual(["first-steps", "curious-coder"]);
    expect(newlyUnlocked({ ...base, completedExercises: 10 }, { "first-steps": {} })).toEqual([
      "curious-coder",
      "persistent-learner",
    ]);
  });

  it("unlocks Bug Hunter only after fixing a failed check", () => {
    const failed = applyCheckFailure(emptyGamification, "a", "task");
    expect(applyCheckFailure(failed, "a", "task")).toBe(failed);
    const fixed = pass(failed, emptyProgress, "a", "task", at("2026-11-10"));
    expect(fixed.rewards.achievements).toEqual(expect.arrayContaining(["first-steps", "bug-hunter"]));
    const clean = pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-10"));
    expect(clean.rewards.achievements).not.toContain("bug-hunter");
  });

  it("unlocks language explorers and Lab Champion from real progress", () => {
    const lab = pass(emptyGamification, emptyProgress, "b", "lab", at("2026-11-10"));
    expect(lab.rewards.achievements).toContain("lab-champion");
    expect(lab.rewards.achievements).not.toContain("python-explorer");
    const chapter = pass(lab.state, lab.progress, "a", "task", at("2026-11-10"));
    expect(chapter.rewards.achievements).toContain("python-explorer");
    const js = pass(chapter.state, chapter.progress, "js", "task", at("2026-11-10"));
    expect(js.rewards.achievements).toEqual(["javascript-explorer"]);
    expect(Object.keys(js.state.achievements).sort()).toEqual(
      ["first-steps", "javascript-explorer", "lab-champion", "python-explorer"].sort(),
    );
  });

  it("does not unlock an achievement twice", () => {
    const first = pass(emptyGamification, emptyProgress, "a", "task", at("2026-11-10"));
    const again = pass(first.state, first.progress, "js", "task", at("2026-11-10"));
    expect(again.rewards.achievements).not.toContain("first-steps");
    expect(again.state.achievements["first-steps"]).toEqual(first.state.achievements["first-steps"]);
  });

  it("has a definition for every achievement id", () => {
    expect(ACHIEVEMENTS.map((achievement) => achievement.id)).toHaveLength(8);
  });
});

describe("migration from earlier progress", () => {
  it("backfills XP, streak days and achievements for genuinely completed work, once", () => {
    let progress = recordStepPassed(emptyProgress, "a", "task", ["task"], "2026-11-01T10:00:00.000Z");
    progress = recordStepPassed(progress, "b", "lab", ["lab"], "2026-11-02T10:00:00.000Z");
    progress = recordStepPassed(progress, "multi", "s1", ["s1", "s2"], "2026-11-03T10:00:00.000Z");
    const migrated = backfillFromProgress(emptyGamification, progress, catalog, at("2026-11-10"));
    expect(totalXp(migrated.awards)).toBe(5 + 25 + 5 + 50 + 50 + 5);
    expect(migrated.migratedProgress).toBe(true);
    expect(migrated.activeDays).toHaveLength(2);
    expect(Object.keys(migrated.achievements).sort()).toEqual(["first-steps", "lab-champion", "python-explorer"]);
    expect(backfillFromProgress(migrated, progress, catalog, at("2026-11-11"))).toBe(migrated);
    const context = buildAchievementContext(migrated, progress, catalog);
    expect(context).toMatchObject({ completedExercises: 2, completedLabs: 1, completedChapters: { python: 1, javascript: 0 } });
  });

  it("ignores progress for unknown exercises", () => {
    const progress = recordStepPassed(emptyProgress, "removed", "x", ["x"], "2026-11-01T10:00:00.000Z");
    expect(totalXp(backfillFromProgress(emptyGamification, progress, catalog, at("2026-11-10")).awards)).toBe(0);
  });
});

describe("stored gamification data", () => {
  it("rejects unknown versions and non-objects", () => {
    expect(parseGamification(null)).toBeNull();
    expect(parseGamification("x")).toBeNull();
    expect(parseGamification({ version: 2 })).toBeNull();
  });

  it("drops malformed entries instead of discarding the whole state", () => {
    const parsed = parseGamification({
      version: 1,
      awards: {
        "exercise:a": { id: "exercise:a", kind: "exercise", xp: 25, at: "2026-11-10T10:00:00Z", day: "2026-11-10" },
        cheat: { id: "cheat", kind: "exercise", xp: 1e9, at: "x", day: "2026-11-10" },
        mismatch: { id: "other", kind: "step", xp: 5, at: "x", day: "2026-11-10" },
      },
      activeDays: ["2026-11-10", "2026-11-10", "not-a-day", 5],
      achievements: { "first-steps": { at: "2026-11-10" }, "made-up": { at: "x" } },
      dailyGoal: 7,
      bestStreak: "lots",
    });
    expect(Object.keys(parsed!.awards)).toEqual(["exercise:a"]);
    expect(parsed!.activeDays).toEqual(["2026-11-10"]);
    expect(parsed!.achievements).toEqual({ "first-steps": { at: "2026-11-10" } });
    expect(parsed!.dailyGoal).toBeNull();
    expect(parsed!.bestStreak).toBe(0);
  });

  it("round-trips a real state", () => {
    const { state } = pass({ ...emptyGamification, dailyGoal: 3 }, emptyProgress, "b", "lab", at("2026-11-10"));
    expect(parseGamification(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});
