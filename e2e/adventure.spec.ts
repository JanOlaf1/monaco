import { expect, test } from "@playwright/test";
import { checkAnswer, readStorage, seedLearner, setCode, watchConsole } from "./helpers";

const ADVENTURE_KEY = "koodaamo:v1:adventure";
type SavedAdventure = {
  version: number;
  events: Record<string, { kind: string; amount?: number }>;
  equipped: Record<string, string>;
  showMessages: boolean;
};

const HELLO = 'console.log("Hello, world!");\n';
const THREE_LINES = 'console.log("Ready");\nconsole.log("Set");\nconsole.log("Code!");\n';

test("opening the collection grants no crystals and needs no account", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/en/collection");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("0 Code Crystals");
  const state = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  expect(Object.keys(state?.events ?? {})).toHaveLength(0);
  await page.reload();
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("0 Code Crystals");
  expect(Object.keys((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events ?? {})).toHaveLength(0);
  await expect(page.getByTestId("cosmetic-scarf")).toBeVisible();
  expect(problems).toEqual([]);
});

test("a future adventure schema is preserved and cannot be overwritten by this version", async ({ page }) => {
  await page.goto("/en");
  const future = JSON.stringify({ version: 99, events: { "future-event": { type: "unrecognized" } }, futureField: "keep me" });
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ADVENTURE_KEY, value: future });
  await page.goto("/en/collection");
  await expect(page.getByRole("status").filter({ hasText: /This collection was saved by a newer version of Koodaamo/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Chapter encouragement cards/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Join daily quest", exact: true })).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), ADVENTURE_KEY)).toBe(future);
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: /This collection was saved by a newer version of Koodaamo/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Chapter encouragement cards/ })).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), ADVENTURE_KEY)).toBe(future);
});

test("real checks award crystals once and chapter milestones preserve XP", async ({ page }) => {
  await page.goto("/en/courses/javascript/js-hello-console");
  await setCode(page, "js-hello-console", 'console.log("Hello world");\n');
  await checkAnswer(page);
  expect(Object.keys((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events ?? {})).toHaveLength(0);
  await setCode(page, "js-hello-console", HELLO);
  await checkAnswer(page);

  await page.goto("/en/collection");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("5 Code Crystals");
  const first = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  await page.goto("/en/courses/javascript/js-hello-console");
  await checkAnswer(page);
  const repeated = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  expect(repeated?.events).toEqual(first?.events);

  await page.goto("/en/courses/javascript/js-multiple-logs");
  await setCode(page, "js-multiple-logs", THREE_LINES);
  await checkAnswer(page);
  await page.goto("/en/collection");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("30 Code Crystals");
  const xp = await readStorage<{ awards: Record<string, { xp: number }> }>(page, "koodaamo:v1:gamification");
  expect(Object.values(xp!.awards).reduce((sum, award) => sum + award.xp, 0)).toBe(110);
  const chapter = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  await page.reload();
  expect((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events).toEqual(chapter?.events);
});

test("a cosmetic can be previewed, unlocked once, equipped and removed across languages", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/en");
  await seedLearner(page, { completed: [{ exerciseId: "js-hello-console" }, { exerciseId: "js-multiple-logs" }] });
  await page.goto("/en/collection");
  const scarf = page.getByTestId("cosmetic-scarf").filter({ visible: true });
  await expect(scarf).toHaveAttribute("data-owned", "false");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("10 Code Crystals");
  await expect(page.getByTestId("cosmetic-hat").getByRole("button", { name: /Unlock/ })).toBeDisabled();
  const before = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  await scarf.getByRole("button", { name: /Preview/ }).click();
  await expect(page.getByTestId("avatar-preview")).toBeVisible();
  expect((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events).toEqual(before?.events);
  await scarf.getByRole("button", { name: /Unlock/ }).click();
  await expect(scarf).toHaveAttribute("data-owned", "true");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("0 Code Crystals");
  await expect(scarf.getByRole("button", { name: /Equip/ })).toBeVisible();
  await scarf.getByRole("button", { name: /Equip/ }).click();
  await expect.poll(async () => (await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.equipped.neck).toBe("scarf");
  const purchased = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  await page.reload();
  await expect(scarf.getByRole("button", { name: /Remove/ })).toBeVisible();
  expect((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events).toEqual(purchased?.events);
  await page.getByRole("link", { name: "Suomi" }).click();
  await page.waitForURL(/\/fi\/collection$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fi");
  await expect(scarf).toBeVisible();
  // Unequip is the only enabled non-preview action for this owned, equipped item.
  const controls = scarf.getByRole("button");
  await expect(controls).toHaveCount(2);
  await controls.last().click();
  await expect.poll(async () => (await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.equipped.neck).toBeUndefined();
  expect((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events).toEqual(purchased?.events);
  await page.getByRole("checkbox", { name: /Luvun kannustuskortit/ }).uncheck();
  await expect.poll(async () => (await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.showMessages).toBe(false);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Luvun kannustuskortit/ })).not.toBeChecked();
  expect(problems).toEqual([]);
});

test("simultaneous purchases in two tabs cannot spend the same crystals twice", async ({ page, context }) => {
  await page.goto("/en");
  await seedLearner(page, { completed: [
    { exerciseId: "js-hello-console" }, { exerciseId: "js-multiple-logs" },
    { exerciseId: "js-let-update" }, { exerciseId: "js-data-types" },
    { exerciseId: "py-hello-world" }, { exerciseId: "py-multiple-prints" },
  ] });
  await page.goto("/en/collection");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("30 Code Crystals");
  const other = await context.newPage();
  try {
    await other.goto("/en/collection");
    await expect(other.getByTestId("crystal-balance").first()).toHaveText("30 Code Crystals");
    // Hold the real shared lock until both UI purchase handlers have queued.
    await page.evaluate((key) => {
      void navigator.locks.request(key, () => new Promise<void>((release) => {
        (window as Window & { releaseAdventureTestLock?: () => void }).releaseAdventureTestLock = release;
      }));
    }, ADVENTURE_KEY);
    await expect.poll(() => page.evaluate(() =>
      typeof (window as Window & { releaseAdventureTestLock?: () => void }).releaseAdventureTestLock,
    )).toBe("function");
    await Promise.all([
      page.getByTestId("cosmetic-backpack").getByRole("button", { name: /Unlock/ }).click(),
      other.getByTestId("cosmetic-hat").getByRole("button", { name: /Unlock/ }).click(),
    ]);
    await expect.poll(() => page.evaluate(async (key) =>
      (await navigator.locks.query()).pending?.filter((lock) => lock.name === key).length ?? 0,
    ADVENTURE_KEY)).toBeGreaterThanOrEqual(2);
    await page.evaluate(() => (window as Window & { releaseAdventureTestLock?: () => void }).releaseAdventureTestLock?.());
    for (const tab of [page, other]) {
      await expect(tab.getByTestId("cosmetic-scarf").locator("..")).toHaveAttribute("aria-busy", "false");
    }
    await expect.poll(async () => Object.values((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events ?? {})
      .filter((event) => event.kind === "purchase").length).toBe(1);
    const state = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
    const balance = Object.values(state!.events).reduce((sum, event) => sum + (event.amount ?? 0), 0);
    expect([0, 5]).toContain(balance);
    for (const tab of [page, other]) {
      await expect(tab.getByTestId("crystal-balance").first()).toHaveText(`${balance} Code Crystals`);
      await expect(tab.locator('[data-testid^="cosmetic-"][data-owned="true"]')).toHaveCount(1);
    }
    await other.reload();
    await expect(other.getByTestId("crystal-balance").first()).toHaveText(`${balance} Code Crystals`);
  } finally {
    await page.evaluate(() => (window as Window & { releaseAdventureTestLock?: () => void }).releaseAdventureTestLock?.());
    await other.close();
  }
});

test("optional quests count checked learning and distinct exercises rather than clicks", async ({ page }) => {
  await page.goto("/en/collection");
  await page.getByRole("button", { name: "Join daily quest", exact: true }).click();
  await page.getByText("Weekly quest & review rules", { exact: true }).click();
  await page.getByRole("button", { name: "Join weekly quest", exact: true }).click();
  await expect(page.getByTestId("quest-daily")).toContainText("0/1");
  await expect(page.getByTestId("quest-weekly")).toContainText("0/3");
  await page.reload();
  await expect(page.getByTestId("quest-daily")).toContainText("0/1");

  await page.goto("/en/courses/javascript/js-hello-console");
  await setCode(page, "js-hello-console", 'console.log("Keep trying");\n');
  await checkAnswer(page);
  await page.goto("/en/collection");
  await expect(page.getByTestId("quest-daily")).toContainText("0/1");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("0 Code Crystals");

  await page.goto("/en/courses/javascript/js-hello-console");
  await setCode(page, "js-hello-console", HELLO);
  await checkAnswer(page);
  await checkAnswer(page);
  await page.goto("/en/collection");
  await page.getByText("Weekly quest & review rules", { exact: true }).click();
  await expect(page.getByTestId("quest-daily")).toContainText("Complete · reward recorded");
  await expect(page.getByTestId("quest-weekly")).toContainText("1/3");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("8 Code Crystals");

  for (const [id, code] of [
    ["js-multiple-logs", THREE_LINES],
    ["js-let-update", "let score = 0;\nconst bonus = 10;\nscore += bonus;\nconsole.log(score);\n"],
  ]) {
    await page.goto(`/en/courses/javascript/${id}`);
    await setCode(page, id, code);
    await checkAnswer(page);
  }
  await page.goto("/en/collection");
  await page.getByText("Weekly quest & review rules", { exact: true }).click();
  await expect(page.getByTestId("quest-weekly")).toContainText("Complete · reward recorded");
  // Three first completions, one chapter, one daily quest, one weekly quest.
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("48 Code Crystals");
  const earned = await readStorage<SavedAdventure>(page, ADVENTURE_KEY);
  await page.reload();
  expect((await readStorage<SavedAdventure>(page, ADVENTURE_KEY))?.events).toEqual(earned?.events);
});
