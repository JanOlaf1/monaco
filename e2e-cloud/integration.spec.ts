import { devices, expect, test, type Page } from "@playwright/test";
import { checkAnswer, readStorage, setCode } from "../e2e/helpers";

/**
 * Regression tests for the integrated app: optional accounts and competency
 * sync (Firebase emulators) together with the local Code Archipelago
 * (crystals, quests, cosmetics) and XP.
 */
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9095"}`;
const FIRESTORE = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8085"}`;
const PROJECT = "demo-koodaamo";
const PASSWORD = "correct horse battery";
const ADVENTURE_KEY = "koodaamo:v1:adventure";
const GAMIFICATION_KEY = "koodaamo:v1:gamification";

type Adventure = { events: Record<string, unknown>; equipped: Record<string, string> };
type Gamification = { awards: Record<string, { xp: number }> };

const totalXp = (state: Gamification | null) => Object.values(state?.awards ?? {}).reduce((sum, award) => sum + award.xp, 0);
const owner = { Authorization: "Bearer owner" };

test.beforeEach(async ({ request }) => {
  await request.delete(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`);
  await request.delete(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`);
});

async function signUpAndVerify(page: Page, email: string) {
  await page.goto("/en/account");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByRole("heading", { name: "Verify your email to turn on sync" })).toBeVisible();
  const codes = await (await page.request.get(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`)).json();
  const code = (codes.oobCodes as { email: string; oobCode: string; requestType: string }[])
    .filter((entry) => entry.email === email && entry.requestType === "VERIFY_EMAIL")
    .at(-1);
  const applied = await page.request.post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key`, {
    data: { oobCode: code!.oobCode },
  });
  expect(applied.ok()).toBe(true);
  await page.getByRole("button", { name: "I have verified my email" }).click();
  await expect(page.getByTestId("sync-status")).toHaveAttribute("data-state", "synced");
}

/** Collections the app created under the user's document (admin view of the emulator). */
async function cloudCollections(page: Page, email: string): Promise<string[]> {
  const users = await (
    await page.request.get(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:batchGet?maxResults=10`, {
      headers: owner,
    })
  ).json();
  const uid = (users.users as { localId: string; email: string }[]).find((user) => user.email === email)!.localId;
  const response = await page.request.post(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}:listCollectionIds`,
    { headers: owner, data: {} },
  );
  return ((await response.json()).collectionIds as string[] | undefined) ?? [];
}

test("signing up after learning keeps XP, crystals and cosmetics, and never grants rewards twice", async ({ page }) => {
  const email = "integration@example.com";

  // 1. Learn anonymously: two real checks complete the first JavaScript chapter.
  await page.goto("/en/courses/javascript/js-hello-console");
  await setCode(page, "js-hello-console", 'console.log("Hello, world!");\n');
  await checkAnswer(page);
  await page.goto("/en/courses/javascript/js-multiple-logs");
  await setCode(page, "js-multiple-logs", 'console.log("Ready");\nconsole.log("Set");\nconsole.log("Code!");\n');
  await checkAnswer(page);
  expect(totalXp(await readStorage<Gamification>(page, GAMIFICATION_KEY))).toBe(110);

  // 2. Spend crystals on a cosmetic and equip it.
  await page.goto("/en/collection");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("30 Code Crystals");
  const scarf = page.getByTestId("cosmetic-scarf").filter({ visible: true });
  await scarf.getByRole("button", { name: /Unlock/ }).click();
  await expect(scarf).toHaveAttribute("data-owned", "true");
  await scarf.getByRole("button", { name: /Equip/ }).click();
  await expect.poll(async () => (await readStorage<Adventure>(page, ADVENTURE_KEY))?.equipped.neck).toBe("scarf");
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("20 Code Crystals");

  // A skill level so there is competency data to sync.
  await page.goto("/en/progress");
  await page.getByLabel("Level for Python").selectOption("advanced");
  const adventureBefore = await readStorage<Adventure>(page, ADVENTURE_KEY);
  const gamificationBefore = await readStorage<Gamification>(page, GAMIFICATION_KEY);

  // 3. Optional sign-up: local Archipelago data and XP are untouched.
  await signUpAndVerify(page, email);
  await expect(page.getByTestId("local-domains")).toContainText("Crystals, quests and avatar items");
  await expect(page.getByTestId("synced-domains")).toHaveText("Skill levels and placement results");
  expect(await readStorage<Adventure>(page, ADVENTURE_KEY)).toEqual(adventureBefore);
  expect(await readStorage<Gamification>(page, GAMIFICATION_KEY)).toEqual(gamificationBefore);
  // Only competency documents reach the cloud.
  expect(await cloudCollections(page, email)).toEqual(["competency"]);

  // 4. Re-checking a finished exercise while signed in grants nothing new.
  await page.goto("/en/courses/javascript/js-hello-console");
  await setCode(page, "js-hello-console", 'console.log("Hello, world!");\n');
  await checkAnswer(page);
  expect((await readStorage<Adventure>(page, ADVENTURE_KEY))?.events).toEqual(adventureBefore?.events);
  expect(totalXp(await readStorage<Gamification>(page, GAMIFICATION_KEY))).toBe(110);

  // 5. Refresh and switch language: everything is still there.
  await page.goto("/en/collection");
  await page.reload();
  await expect(page.getByTestId("crystal-balance").first()).toHaveText("20 Code Crystals");
  await page.getByRole("link", { name: "Suomi" }).click();
  await page.waitForURL(/\/fi\/collection$/);
  await expect(page.getByTestId("crystal-balance").first()).toContainText("20");
  await expect(page.getByRole("link", { name: "Tili: integration@example.com" })).toBeVisible();

  // 6. Sign out: local progress, crystals and cosmetics stay.
  await page.goto("/fi/account");
  await page.getByRole("button", { name: "Kirjaudu ulos" }).click();
  await expect(page.getByText("Kirjauduit ulos. Kaikki tekemäsi pysyy tässä selaimessa.")).toBeVisible();
  expect(await readStorage<Adventure>(page, ADVENTURE_KEY)).toEqual(adventureBefore);
  expect(totalXp(await readStorage<Gamification>(page, GAMIFICATION_KEY))).toBe(110);
  await page.goto("/fi/progress");
  await expect(page.getByLabel("Taso: Python")).toHaveValue("advanced");
});

// Phone viewport, touch and user agent (the browser itself is set in the config).
const { defaultBrowserType: _browserType, ...pixel7 } = devices["Pixel 7"];
void _browserType;

test.describe("on a phone", () => {
  test.use(pixel7);

  test("the account entry, collection and account page work without horizontal scrolling", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Account" }).click();
    await page.waitForURL(/\/en\/account$/);
    await expect(page.getByRole("button", { name: "Sign in" }).last()).toBeVisible();
    for (const path of ["/en/account", "/en/collection", "/fi/account"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
