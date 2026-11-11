import { expect, test, type Page } from "@playwright/test";
import { readStorage, watchConsole } from "./helpers";

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

async function practiceXp(page: Page): Promise<Record<string, number>> {
  const state = await readStorage<{ awards: Record<string, { kind: string; xp: number }> }>(page, "koodaamo:v1:gamification");
  return Object.fromEntries(
    Object.entries(state?.awards ?? {})
      .filter(([, award]) => award.kind === "practice")
      .map(([id, award]) => [id, award.xp]),
  );
}

test("the phone bottom bar reaches every main area with large touch targets", async ({ page }) => {
  const problems = watchConsole(page);
  for (const path of ["/en", "/en/practice", "/en/settings", "/en/progress", "/en/collection", "/fi/practice", "/fi/settings"]) {
    await page.goto(path);
    expect(await overflow(page), path).toBeLessThanOrEqual(0);
    const bar = page.getByTestId("mobile-nav");
    await expect(bar, path).toBeVisible();
    const links = bar.getByRole("link");
    await expect(links).toHaveCount(5);
    for (const box of await links.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height))) {
      expect(box).toBeGreaterThanOrEqual(44);
    }
  }
  // The header links are replaced by the bottom bar on phones.
  await page.goto("/en");
  await expect(page.locator("header").getByRole("link", { name: "Practice" })).toBeHidden();
  await page.getByTestId("mobile-nav").getByRole("link", { name: "Practice" }).click();
  await page.waitForURL(/\/en\/practice$/);
  await expect(page.getByTestId("mobile-nav").getByRole("link", { name: "Practice" })).toHaveAttribute("aria-current", "page");
  await page.getByTestId("mobile-nav").getByRole("link", { name: "Settings" }).click();
  await page.waitForURL(/\/en\/settings$/);

  // The coding workspace keeps its own bottom bar instead.
  await page.goto("/en/courses/python/py-hello-world");
  await expect(page.getByRole("tab", { name: "Instructions" })).toBeVisible();
  await expect(page.getByTestId("mobile-nav")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("practice on a phone: real checking, one-time XP and keyboard reordering", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/en/practice");
  await expect(page.getByRole("button", { name: "Python", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Practice new activities" }).click();
  await expect(page.getByText("Activity 1 of 5")).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);

  // A wrong answer is reported and earns nothing.
  await page.getByRole("radio", { name: "Hi, Ada!", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByTestId("practice-feedback")).toContainText("Not quite.");
  expect(await practiceXp(page)).toEqual({});

  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("radio", { name: "HI, ADA!", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByTestId("practice-feedback")).toContainText("Correct!");
  await expect(page.getByTestId("practice-xp")).toHaveText("+5 XP");
  expect(await practiceXp(page)).toEqual({ "practice:pr-py-upper-greeting": 5 });

  // "Show answer" reveals the key without rewarding it.
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Activity 2 of 5")).toBeVisible();
  await page.getByRole("radio", { name: "5.5", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(page.getByTestId("practice-feedback")).toContainText("Here is the answer");
  expect(Object.keys(await practiceXp(page))).toEqual(["practice:pr-py-upper-greeting"]);
  await page.getByRole("button", { name: "End session" }).click();

  // Answering an already-passed activity again keeps the streak going but adds no XP.
  await page.getByTestId("practice-item").filter({ hasText: "Done" }).first().click();
  await page.getByRole("radio", { name: "HI, ADA!", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByTestId("practice-no-xp")).toBeVisible();
  expect(await practiceXp(page)).toEqual({ "practice:pr-py-upper-greeting": 5 });
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByTestId("practice-summary")).toBeVisible();
  await page.getByRole("button", { name: "Back to practice" }).click();

  // Reorder lines with the keyboard only (no drag and drop).
  await page.getByTestId("practice-item").filter({ hasText: "Put the lines in order" }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByTestId("practice-feedback")).toContainText("Not quite.");
  await page.getByRole("button", { name: "Try again" }).click();
  const press = async (direction: "up" | "down", line: string, times: number) => {
    await page.getByRole("button", { name: `Move line ${direction}: ${line}`, exact: true }).focus();
    for (let i = 0; i < times; i++) {
      await page.keyboard.press("Enter");
      await expect(page.getByText(`Moved to position`)).toBeAttached();
      // Focus stays with the moved line, so repeated presses keep moving it.
      await page.waitForFunction((text) => document.activeElement?.getAttribute("aria-label")?.endsWith(`: ${text}`), line);
    }
  };
  await press("down", "print(count)", 4);
  await press("up", 'words = ["sun", "sea", "sky"]', 3);
  await press("down", "count += 1", 2);
  await expect(page.getByRole("button", { name: "Move line up: count += 1", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByTestId("practice-feedback")).toContainText("Correct!");
  expect(await practiceXp(page)).toMatchObject({ "practice:pr-py-count-words": 5 });
  expect(problems).toEqual([]);
});

test("practice and settings work in Finnish, dark theme and with reduced motion on a phone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/fi/practice");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: "Harjoittele", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "JavaScript", exact: true }).click();
  await page.getByRole("button", { name: "Harjoittele uusia" }).click();
  await expect(page.getByText("Harjoitus 1/5")).toBeVisible();
  await expect(page.getByText("Ennusta tuloste")).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);

  await page.goto("/fi/settings");
  await expect(page.getByRole("heading", { name: "Asetukset", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Varmuuskopio ja palautus" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lataa varmuuskopio" })).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});
