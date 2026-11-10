import { expect, type Page } from "@playwright/test";

/** Collects console errors and hydration warnings for a page. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" || /hydrat|did not match/i.test(text)) problems.push(`[${message.type()}] ${text}`);
  });
  page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));
  return problems;
}

/** Replace the editor content of an exercise (through Monaco's model API). */
export async function setCode(page: Page, exerciseId: string, code: string) {
  await page.waitForFunction(
    (id) =>
      (window as unknown as { monaco?: { editor: { getModels(): { uri: { path: string } }[] } } }).monaco?.editor
        .getModels()
        .some((model) => model.uri.path.includes(`/${id}/`)),
    exerciseId,
    { timeout: 60_000 },
  );
  await page.evaluate(
    ({ id, value }) => {
      const monaco = (window as unknown as {
        monaco: { editor: { getModels(): { uri: { path: string }; setValue(value: string): void }[] } };
      }).monaco;
      monaco.editor.getModels().find((model) => model.uri.path.includes(`/${id}/`))!.setValue(value);
    },
    { id: exerciseId, value: code },
  );
}

export async function checkAnswer(page: Page, label = "Check answer") {
  const button = page.getByRole("button", { name: label });
  await button.click();
  await expect(button).toBeEnabled({ timeout: 60_000 });
}

export async function readStorage<T>(page: Page, key: string): Promise<T | null> {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), key);
}

type Award = { id: string; kind: "step" | "exercise" | "chapter"; xp: number; at: string; day: string };

/** Local date key, as the app computes it. */
export function dayKey(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Seed local storage with genuinely consistent learner data: the progress
 * entries and the XP awards for the same completed one-step challenges.
 */
export async function seedLearner(
  page: Page,
  options: { completed: { exerciseId: string; stepId?: string; xp?: number }[]; activeDays?: string[]; extra?: object },
) {
  const now = new Date().toISOString();
  const exercises: Record<string, unknown> = {};
  const awards: Record<string, Award> = {};
  const day = options.activeDays?.[0] ?? dayKey(-1);
  for (const { exerciseId, stepId = "task", xp = 25 } of options.completed) {
    exercises[exerciseId] = { completedStepIds: [stepId], completedAt: now, updatedAt: now };
    awards[`step:${exerciseId}:${stepId}`] = { id: `step:${exerciseId}:${stepId}`, kind: "step", xp: 5, at: now, day };
    awards[`exercise:${exerciseId}`] = { id: `exercise:${exerciseId}`, kind: "exercise", xp, at: now, day };
  }
  await page.evaluate(
    ({ progress, gamification }) => {
      localStorage.setItem("koodaamo:v1:progress", JSON.stringify(progress));
      localStorage.setItem("koodaamo:v1:gamification", JSON.stringify(gamification));
    },
    {
      progress: { version: 1, exercises },
      gamification: {
        version: 1,
        awards,
        activeDays: options.activeDays ?? [],
        bestStreak: 0,
        achievements: {},
        failedSteps: [],
        fixedFailingSolution: false,
        dailyGoal: null,
        migratedProgress: true,
        ...options.extra,
      },
    },
  );
}
