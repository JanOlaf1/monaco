import { describe, expect, it } from "vitest";
import { applyPracticePass, buildAchievementContext, dailyGoalProgress, type GamificationCatalog } from "@/lib/gamification/engine";
import { emptyGamification, parseGamification } from "@/lib/gamification/state";
import { XP_REWARDS, accomplishmentId, totalXp } from "@/lib/gamification/xp";
import { emptyProgress } from "@/lib/progress/progress";
import { toDateKey } from "@/lib/schedule/dates";

const catalog: GamificationCatalog = {
  exercises: { a: { courseId: "python", chapterId: "c1", type: "challenge", stepIds: ["task"] } },
  chapters: [{ courseId: "python", chapterId: "c1", language: "python", exerciseIds: ["a"] }],
};

const day = (date: string, hour = 12) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, hour);
};

describe("practice rewards", () => {
  it("awards practice XP once per activity", () => {
    const first = applyPracticePass({
      state: emptyGamification,
      progress: emptyProgress,
      catalog,
      activityId: "pr-py-average",
      now: day("2026-11-10"),
    });
    expect(first.rewards.xpGained).toBe(XP_REWARDS.practice);
    expect(first.rewards.awards.map((award) => award.id)).toEqual([accomplishmentId.practice("pr-py-average")]);
    expect(first.state.awards["practice:pr-py-average"]).toMatchObject({ kind: "practice", xp: 5 });

    // Answering correctly again (even on later days or by repeated clicks) adds nothing.
    let state = first.state;
    for (const date of ["2026-11-10", "2026-11-10", "2026-11-11"]) {
      const again = applyPracticePass({ state, progress: emptyProgress, catalog, activityId: "pr-py-average", now: day(date) });
      expect(again.rewards.xpGained).toBe(0);
      expect(again.rewards.awards).toEqual([]);
      state = again.state;
    }
    expect(totalXp(state.awards)).toBe(XP_REWARDS.practice);
  });

  it("counts as learning activity for the streak", () => {
    let state = emptyGamification;
    for (const [index, date] of ["2026-11-08", "2026-11-09", "2026-11-10"].entries()) {
      const result = applyPracticePass({ state, progress: emptyProgress, catalog, activityId: `pr-py-${index}`, now: day(date) });
      expect(result.rewards.firstActivityToday).toBe(true);
      state = result.state;
    }
    expect(state.activeDays).toEqual(["2026-11-08", "2026-11-09", "2026-11-10"]);
    expect(state.bestStreak).toBe(3);
    // Three days in a row genuinely meets "On a Roll".
    expect(state.achievements["on-a-roll"]).toBeDefined();
  });

  it("does not complete exercises, the daily goal or exercise achievements", () => {
    const { state, rewards } = applyPracticePass({
      state: { ...emptyGamification, dailyGoal: 1 },
      progress: emptyProgress,
      catalog,
      activityId: "pr-py-average",
      now: day("2026-11-10"),
    });
    expect(rewards.exerciseCompleted).toBe(false);
    expect(rewards.dailyGoal).toBeUndefined();
    expect(dailyGoalProgress(state, toDateKey(day("2026-11-10")))).toEqual({ done: 0, target: 1 });
    expect(buildAchievementContext(state, emptyProgress, catalog).completedExercises).toBe(0);
    expect(state.achievements["first-steps"]).toBeUndefined();
  });

  it("keeps practice awards when stored data is parsed again", () => {
    const { state } = applyPracticePass({
      state: emptyGamification,
      progress: emptyProgress,
      catalog,
      activityId: "pr-js-loop-bound",
      now: day("2026-11-10"),
    });
    const parsed = parseGamification(JSON.parse(JSON.stringify(state)));
    expect(parsed?.awards["practice:pr-js-loop-bound"]?.xp).toBe(5);
  });
});
