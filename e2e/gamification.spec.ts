import { expect, test } from "@playwright/test";
import { checkAnswer, dayKey, readStorage, seedLearner, setCode } from "./helpers";

type Gamification = {
  awards: Record<string, { xp: number }>;
  achievements: Record<string, unknown>;
  activeDays: string[];
  bestStreak: number;
};
const totalXp = (state: Gamification | null) => Object.values(state?.awards ?? {}).reduce((sum, award) => sum + award.xp, 0);
const toast = (page: import("@playwright/test").Page, text: string) =>
  page.getByRole("status", { name: "Notifications" }).getByText(text);

const THREE_LINES = 'console.log("Ready");\nconsole.log("Set");\nconsole.log("Code!");\n';

test("finishing a chapter levels up and unlocks achievements exactly once", async ({ page }) => {
  await page.goto("/en");
  // 60 XP from two genuinely completed challenges.
  await seedLearner(page, { completed: [{ exerciseId: "js-hello-console" }, { exerciseId: "py-hello-world" }] });
  await page.goto("/en/courses/javascript/js-multiple-logs");
  await setCode(page, "js-multiple-logs", THREE_LINES);
  await checkAnswer(page);

  await expect(page.getByText("Chapter complete!").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("+50 XP · Chapter bonus")).toBeVisible();
  await expect(toast(page, "Level up! You're now level 2.")).toBeVisible();
  await expect(toast(page, "JavaScript Explorer")).toBeVisible();
  const state = await readStorage<Gamification>(page, "koodaamo:v1:gamification");
  expect(totalXp(state)).toBe(60 + 30 + 50);
  expect(Object.keys(state!.achievements).sort()).toEqual(["first-steps", "javascript-explorer"]);

  // Checking again: no new XP, no repeated achievements.
  await checkAnswer(page);
  const again = await readStorage<Gamification>(page, "koodaamo:v1:gamification");
  expect(totalXp(again)).toBe(140);
  expect(again!.achievements).toEqual(state!.achievements);
});

test("fixing a failing solution unlocks Bug Hunter", async ({ page }) => {
  await page.goto("/en/courses/javascript/js-hello-console");
  await setCode(page, "js-hello-console", 'console.log("Hello world");\n');
  await checkAnswer(page);
  await expect(page.getByText("Not quite yet")).toBeVisible();
  await setCode(page, "js-hello-console", 'console.log("Hello, world!");\n');
  await checkAnswer(page);
  await expect(toast(page, "Bug Hunter")).toBeVisible();
  await expect(toast(page, "First Steps")).toBeVisible();
});

test("a streak grows across consecutive days and unlocks On a Roll", async ({ page }) => {
  await page.goto("/en");
  await seedLearner(page, {
    completed: [{ exerciseId: "js-hello-console" }],
    activeDays: [dayKey(-2), dayKey(-1)],
    extra: { bestStreak: 2, achievements: { "first-steps": { at: new Date().toISOString() } } },
  });
  await page.goto("/en/courses/javascript/js-multiple-logs");
  await setCode(page, "js-multiple-logs", THREE_LINES);
  await checkAnswer(page);
  await expect(toast(page, "On a Roll")).toBeVisible();
  const state = await readStorage<Gamification>(page, "koodaamo:v1:gamification");
  expect(state!.activeDays).toEqual([dayKey(-2), dayKey(-1), dayKey(0)]);

  await page.goto("/en");
  await expect(page.getByText("3-day streak").filter({ visible: true }).first()).toBeVisible();
});

test("a missed day resets only the streak counter", async ({ page }) => {
  await page.goto("/en");
  await seedLearner(page, { completed: [{ exerciseId: "js-hello-console" }], activeDays: [dayKey(-5), dayKey(-4)], extra: { bestStreak: 2 } });
  await page.goto("/en/progress");
  await expect(page.getByText("Start a streak today").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Best: 2 days")).toBeVisible();
  // XP and completed work are untouched.
  await expect(page.getByText("30 XP", { exact: true })).toBeVisible();
});

test("the optional daily goal can be set and is celebrated when reached", async ({ page }) => {
  await page.goto("/en");
  await seedLearner(page, { completed: [], extra: { preferredCourse: "javascript" } });
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await page.getByRole("radio", { name: "1 challenge a day" }).click();
  await expect(page.getByText("0/1 today")).toBeVisible();

  await page.getByRole("link", { name: "Continue" }).click();
  await page.waitForURL(/js-hello-console$/);
  await setCode(page, "js-hello-console", 'console.log("Hello, world!");\n');
  await checkAnswer(page);
  await expect(toast(page, "Daily goal reached!")).toBeVisible();
});

test("progress saved before gamification existed is migrated, not lost", async ({ page }) => {
  await page.goto("/en");
  const now = new Date().toISOString();
  await page.evaluate((completedAt) => {
    localStorage.removeItem("koodaamo:v1:gamification");
    localStorage.setItem(
      "koodaamo:v1:progress",
      JSON.stringify({
        version: 1,
        exercises: {
          "variables-and-strings": {
            completedStepIds: ["create-variable", "build-greeting", "print-greeting", "string-method"],
            completedAt,
            updatedAt: completedAt,
          },
        },
      }),
    );
  }, now);
  await page.goto("/en/progress");
  // 4 steps × 5 + 25 = 45 XP, backfilled from the saved progress.
  await expect(page.getByText("45 / 100 XP")).toBeVisible();
  await expect(page.locator('[data-achievement="first-steps"]')).toHaveAttribute("data-earned", "true");
  await page.reload();
  await expect(page.getByText("45 / 100 XP")).toBeVisible();
  expect(totalXp(await readStorage<Gamification>(page, "koodaamo:v1:gamification"))).toBe(45);
});

test("malformed stored data is ignored safely", async ({ page }) => {
  await page.goto("/en");
  await page.evaluate(() => {
    localStorage.setItem("koodaamo:v1:gamification", "{not json");
    localStorage.setItem("koodaamo:v1:progress", JSON.stringify({ version: 99 }));
  });
  await page.goto("/en/progress");
  await expect(page.getByText("0 / 100 XP")).toBeVisible();
});
