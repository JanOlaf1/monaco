import { expect, test } from "@playwright/test";
import { checkAnswer, readStorage, setCode, watchConsole } from "./helpers";

type Gamification = { awards: Record<string, { xp: number }>; achievements: Record<string, unknown>; activeDays: string[] };
const totalXp = (state: Gamification | null) => Object.values(state?.awards ?? {}).reduce((sum, award) => sum + award.xp, 0);

test("a first-time learner starts a challenge in two clicks, earns XP once and returns to a dashboard", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);

  // First-time home: welcome, mascot, one choice, one button.
  await expect(page.getByRole("heading", { name: "Learn to code, one small win at a time." })).toBeVisible();
  await expect(page.getByRole("img", { name: "Saku the otter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeHidden();
  await page.getByRole("radio", { name: /JavaScript/ }).click();
  await page.getByRole("link", { name: "Start learning" }).click();
  await page.waitForURL(/\/en\/courses\/javascript\/js-hello-console$/);

  // Simplified workspace: the task is visible, the checks are summarised, not listed.
  await expect(page.getByRole("heading", { name: "Your first program" })).toBeVisible();
  await expect(page.getByText("2 checks run when you press Check answer.")).toBeVisible();

  // A wrong answer first: specific feedback, no XP.
  await setCode(page, "js-hello-console", 'console.log("hello world");\n');
  await checkAnswer(page);
  await expect(page.getByText("Not quite yet")).toBeVisible();
  await expect(page.getByText("What to fix")).toBeVisible();
  expect(totalXp(await readStorage<Gamification>(page, "koodaamo:v1:gamification"))).toBe(0);

  // Correct answer: success, XP chips, Continue — and no navigation away.
  await setCode(page, "js-hello-console", 'console.log("Hello, world!");\n');
  await checkAnswer(page);
  await expect(page.getByText("Challenge complete!")).toBeVisible();
  await expect(page.getByText("+5 XP · Step passed")).toBeVisible();
  await expect(page.getByText("+25 XP · Challenge complete")).toBeVisible();
  await expect(page).toHaveURL(/js-hello-console$/);
  expect(totalXp(await readStorage<Gamification>(page, "koodaamo:v1:gamification"))).toBe(30);
  await expect(page.getByRole("link", { name: "Level 1, 30 XP. Open your progress." })).toBeVisible();

  // Checking the same solution again never awards XP twice.
  await checkAnswer(page);
  await expect(page.getByText("You've already earned the XP for this one.", { exact: false })).toBeVisible();
  expect(totalXp(await readStorage<Gamification>(page, "koodaamo:v1:gamification"))).toBe(30);

  // Continue to the next challenge.
  await page.getByRole("link", { name: "Next challenge" }).click();
  await page.waitForURL(/js-multiple-logs$/);

  // Returning learner home: continue first, level and streak visible.
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learn to code, one small win at a time." })).toBeHidden();
  await expect(page.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/en/courses/javascript/js-multiple-logs");
  await expect(page.getByText("1-day streak").filter({ visible: true }).first()).toBeVisible();

  // Everything persists after a refresh.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  expect(totalXp(await readStorage<Gamification>(page, "koodaamo:v1:gamification"))).toBe(30);
  expect(problems).toEqual([]);
});
