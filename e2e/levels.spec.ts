import { expect, test, type Page } from "@playwright/test";
import { readStorage, seedLearner, watchConsole } from "./helpers";

type Track = {
  selfReportedLevel: string | null;
  userOverride: string | null;
  placementResult: { level: string; correct: number; answered: number } | null;
  recommendedNext: { chapterId: string; exerciseId: string; reason: string } | null;
};
type Competency = {
  onboarding: string;
  tracks: Record<string, Track>;
  dismissedPrompts: string[];
  migrated: boolean;
};
const competency = (page: Page) => readStorage<Competency>(page, "koodaamo:v1:competency");
const totalXp = async (page: Page) => {
  const state = await readStorage<{ awards: Record<string, { xp: number }> }>(page, "koodaamo:v1:gamification");
  return Object.values(state?.awards ?? {}).reduce((sum, award) => sum + award.xp, 0);
};

const levelGroup = (page: Page) => page.getByRole("group", { name: /have you written|olet ohjelmoinut/ });
const chooseLevel = (page: Page, name: string) => levelGroup(page).getByText(name, { exact: true }).click();

/** Answer the three beginner items of the JavaScript placement correctly. */
async function passJavaScriptBeginnerItems(page: Page) {
  await page.getByLabel("10", { exact: true }).check();
  await page.getByRole("button", { name: "Answer" }).click();
  await expect(page.getByText("Correct!")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();

  await page.locator("label", { hasText: "age >= 18" }).click();
  await page.getByRole("button", { name: "Answer" }).click();
  await expect(page.getByText("Correct!")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();

  // A first attempt that fails one check gives specific feedback, then a fix passes.
  await page.getByLabel("Your code").fill('function isWeekend(day) {\n  return day === "Saturday";\n}\n');
  await page.getByRole("button", { name: "Check my code" }).click();
  await expect(page.getByText("1 of 2 checks passed")).toBeVisible();
  await expect(page.locator('[data-test-id="weekend"]')).toHaveAttribute("data-status", "fail");
  await page.getByLabel("Your code").fill('const isWeekend = (day) => ["Saturday", "Sunday"].includes(day);\n');
  await page.getByRole("button", { name: "Check my code" }).click();
  await expect(page.getByText("All checks passed!")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
}

/** "I don't know" for two choice items and skip the coding item: the check stops after that level. */
async function giveUpOnLevel(page: Page) {
  for (let i = 0; i < 2; i++) {
    await page.getByLabel("I don't know yet").check();
    await page.getByRole("button", { name: "Answer" }).click();
    await page.getByRole("button", { name: /Next question|See my result/ }).click();
  }
  await page.getByRole("button", { name: "Skip this question" }).click();
}

test("a newcomer picks a level and starts at a suitable chapter without grinding beginner XP", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/en");
  await page.getByRole("radio", { name: /JavaScript/ }).click();
  await chooseLevel(page, "Familiar with basics");
  await expect(page.getByText("I know variables, conditions and loops")).toBeVisible();
  await page.getByRole("link", { name: "Start at chapter 6" }).click();
  await page.waitForURL(/\/en\/courses\/javascript\/js-for-loop$/);

  const state = await competency(page);
  expect(state?.onboarding).toBe("completed");
  expect(state?.tracks.javascript).toMatchObject({
    selfReportedLevel: "intermediate",
    recommendedNext: { chapterId: "js-loops", exerciseId: "js-for-loop", reason: "self-report" },
  });
  // The XP level is separate: nothing was awarded for skipping ahead.
  expect(await totalXp(page)).toBe(0);

  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  // The learner already opened the suggested exercise, so home offers to resume it.
  await expect(page.getByTestId("continue-reason")).toHaveText("Pick up where you left off");
  await expect(page.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/en/courses/javascript/js-for-loop");
  await expect(page.getByRole("link", { name: "Level 1, 0 XP. Open your progress." })).toBeVisible();

  // The path marks the suggestion but keeps every chapter open.
  await page.goto("/en/courses/javascript");
  await expect(page.getByTestId("level-banner")).toContainText("Familiar with basics");
  await expect(page.locator("#chapter-js-loops")).toHaveAttribute("data-suggested", "true");
  await expect(page.getByRole("link", { name: "Your first program — Not started" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Counting with for — Up next" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("skip for now starts at the beginning without storing a level", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Skip for now" }).click();
  await page.waitForURL(/\/en\/courses\/python\/py-hello-world$/);
  const state = await competency(page);
  expect(state?.onboarding).toBe("skipped");
  expect(state?.tracks).toEqual({});
});

test("not sure leads to a placement check whose result is a recommendation, and it can be retaken", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("radio", { name: /JavaScript/ }).click();
  await chooseLevel(page, "Not sure");
  await page.getByRole("link", { name: "Take the placement check" }).click();
  await page.waitForURL(/\/en\/placement\/javascript$/);
  await expect(page.getByText("not a grade or a certificate")).toBeVisible();

  await page.getByRole("button", { name: "Start the check" }).click();
  await expect(page.getByText("Question 1 of 9")).toBeVisible();
  await passJavaScriptBeginnerItems(page);
  await giveUpOnLevel(page);

  await expect(page.getByTestId("placement-level")).toHaveText("Suggested level: Familiar with basics");
  await expect(page.getByText("3 of 6 answered correctly")).toBeVisible();
  await expect(page.getByText(/stopped early/)).toBeVisible();
  let state = await competency(page);
  expect(state?.tracks.javascript.placementResult).toMatchObject({ level: "intermediate", correct: 3, answered: 6 });
  expect(state?.tracks.javascript.recommendedNext).toMatchObject({ chapterId: "js-loops", reason: "placement" });

  // Home now shows only the next meaningful task: the suggested start.
  await page.goto("/en");
  await expect(page.getByTestId("continue-reason")).toHaveText("Suggested start for your level (Familiar with basics)");
  await expect(page.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/en/courses/javascript/js-for-loop");
  await expect(page.getByTestId("level-javascript")).toHaveText("Familiar with basics · placement check");

  // Reassessment: a weaker run moves the suggestion back to the beginning.
  await page.goto("/en/placement/javascript");
  await page.getByRole("button", { name: "Start the check" }).click();
  await passJavaScriptBeginnerItems(page);
  await giveUpOnLevel(page);
  await page.getByRole("button", { name: "Take the check again" }).click();
  await page.getByRole("button", { name: "Start the check" }).click();
  await giveUpOnLevel(page);
  await expect(page.getByTestId("placement-level")).toHaveText("Suggested level: Beginner");
  state = await competency(page);
  expect(state?.tracks.javascript.placementResult?.level).toBe("beginner");
  expect(state?.tracks.javascript.recommendedNext).toMatchObject({ chapterId: "js-intro" });
  await page.getByRole("link", { name: "Start at chapter 1: Hello, JavaScript" }).click();
  await page.waitForURL(/js-hello-console$/);
});

test("the learner's own level wins over a placement result until they choose otherwise", async ({ page }) => {
  await page.goto("/en/progress");
  const select = page.getByLabel("Level for JavaScript");
  await select.selectOption("advanced");
  const card = page.locator('[data-track="javascript"]');
  await expect(card).toContainText("your choice");
  await expect(card.getByRole("link", { name: /Suggested start: Chapter 11: map, reduce and sort/ })).toBeVisible();

  await page.goto("/en/placement/javascript");
  await page.getByRole("button", { name: "Start the check" }).click();
  await giveUpOnLevel(page);
  await expect(page.getByText("Your own choice, Advanced, still applies.")).toBeVisible();
  let state = await competency(page);
  expect(state?.tracks.javascript).toMatchObject({ userOverride: "advanced", placementResult: { level: "beginner" } });
  expect(state?.tracks.javascript.recommendedNext).toMatchObject({ chapterId: "js-array-methods", reason: "override" });

  await page.getByRole("button", { name: "Use the suggestion" }).click();
  await expect(page.getByText("Your own choice, Advanced, still applies.")).toBeHidden();
  state = await competency(page);
  expect(state?.tracks.javascript.userOverride).toBeNull();
  expect(state?.tracks.javascript.recommendedNext).toMatchObject({ chapterId: "js-intro", reason: "placement" });

  // Persisted locally across a reload.
  await page.goto("/en/progress");
  await expect(page.locator('[data-track="javascript"]')).toContainText("placement check");
});

test("Python placement uses the Pyodide runner and recommends a starting chapter", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/en/placement/python");
  await page.getByRole("button", { name: "Start the check" }).click();
  await page.getByLabel("Total: 12 €", { exact: true }).check();
  await page.getByRole("button", { name: "Answer" }).click();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.locator("label", { hasText: "str(age)" }).click();
  await page.getByRole("button", { name: "Answer" }).click();
  await expect(page.getByText("Correct!")).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await page
    .getByLabel("Your code")
    .fill('def water_state(celsius):\n    if celsius <= 0:\n        return "ice"\n    if celsius >= 100:\n        return "steam"\n    return "water"\n');
  await page.getByRole("button", { name: "Check my code" }).click();
  await expect(page.getByText("All checks passed!")).toBeVisible({ timeout: 90_000 });
  await page.getByRole("button", { name: "Next question" }).click();
  await giveUpOnLevel(page);

  await expect(page.getByTestId("placement-level")).toHaveText("Suggested level: Familiar with basics");
  await page.getByRole("link", { name: "Start at chapter 6: Functions" }).click();
  await page.waitForURL(/\/en\/courses\/python\/py-greet-function$/);
});

test("onboarding works in Finnish and the path explains the suggestion", async ({ page }) => {
  await page.goto("/fi");
  await expect(levelGroup(page)).toBeVisible();
  await chooseLevel(page, "Edistynyt");
  await expect(page.getByText("Kirjoitan funktioita")).toBeVisible();
  await page.getByRole("link", { name: "Aloita luvusta 11" }).click();
  await page.waitForURL(/\/fi\/courses\/python\/py-clean-tags$/);
  await page.goto("/fi/courses/python");
  await expect(page.getByTestId("level-banner")).toContainText("Tasosi: Edistynyt");
  await expect(page.getByRole("heading", { name: "Edistyneet luvut" })).toBeVisible();
  await expect(page.getByText("Hyvä osata ensin: Silmukat · Listat ja sanakirjat · Funktiot")).toBeVisible();
});

test("progress saved before levels existed survives, and the placement prompt is optional", async ({ page }) => {
  await page.goto("/en");
  await seedLearner(page, { completed: [{ exerciseId: "py-hello-world" }], activeDays: [new Date().toISOString().slice(0, 10)] });
  await page.evaluate(() => localStorage.removeItem("koodaamo:v1:competency"));
  await page.goto("/en");

  // Treated as a returning learner: no onboarding forced, XP untouched.
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Level 1, 30 XP. Open your progress." })).toBeVisible();
  expect(await totalXp(page)).toBe(30);
  await expect.poll(async () => (await competency(page))?.onboarding).toBe("legacy");

  const prompt = page.getByRole("heading", { name: "Not sure where to start in Python?" });
  await expect(prompt).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(prompt).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await expect(prompt).toBeHidden();
  expect((await competency(page))?.dismissedPrompts).toEqual(["python"]);
  expect(await totalXp(page)).toBe(30);
});

test("the level choice works with the keyboard alone", async ({ page }) => {
  await page.goto("/en");
  const beginner = levelGroup(page).getByRole("radio", { name: "Beginner" });
  await beginner.focus();
  await page.keyboard.press("Space");
  await expect(beginner).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(levelGroup(page).getByRole("radio", { name: "Advanced" })).toBeChecked();
  const start = page.getByRole("link", { name: "Start at chapter 11" });
  await start.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/en\/courses\/python\/py-clean-tags$/);
});
