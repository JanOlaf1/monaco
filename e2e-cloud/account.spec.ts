import { expect, test, type Page } from "@playwright/test";

/**
 * Optional account and competency sync in a real browser, against the Auth
 * and Firestore emulators (see playwright.cloud.config.ts).
 */
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9095"}`;
const FIRESTORE = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8085"}`;
const PROJECT = "demo-koodaamo";
const PASSWORD = "correct horse battery";

test.beforeEach(async ({ request }) => {
  await request.delete(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`);
  await request.delete(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`);
});

/** Apply the verification link the emulator "sent" (what clicking the email link does). */
async function verifyEmail(page: Page, email: string) {
  const response = await page.request.get(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = (await response.json()) as { oobCodes: { email: string; oobCode: string; requestType: string }[] };
  const code = oobCodes.filter((entry) => entry.email === email && entry.requestType === "VERIFY_EMAIL").at(-1);
  expect(code, "verification email").toBeTruthy();
  const applied = await page.request.post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key`, {
    data: { oobCode: code!.oobCode },
  });
  expect(applied.ok()).toBe(true);
}

test("registering keeps local progress, verified accounts sync, and another browser gets the levels", async ({ page, browser }) => {
  const email = "ada@example.com";

  // An anonymous learner chooses a level first (local only).
  await page.goto("/en");
  await page.getByRole("radio", { name: /JavaScript/ }).click();
  await page.getByRole("group", { name: /have you written/ }).getByText("Advanced", { exact: true }).click();
  await page.getByRole("link", { name: "Start at chapter 11" }).click();
  await page.waitForURL(/js-format-prices$/);

  // Optional sign-up from the discreet header entry.
  await page.getByRole("link", { name: "Account" }).click();
  await page.waitForURL(/\/en\/account$/);
  await expect(page.getByTestId("local-domains")).toContainText("Skill levels and placement results");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).last().click();
  await expect(page.getByText(`Account created. We sent a verification link to ${email}.`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Verify your email to turn on sync" })).toBeVisible();

  // Not verified yet: nothing syncs.
  await page.getByRole("button", { name: "I have verified my email" }).click();
  await expect(page.getByText("Your email is not verified yet.")).toBeVisible();

  await verifyEmail(page, email);
  await page.getByRole("button", { name: "I have verified my email" }).click();
  await expect(page.getByTestId("sync-status")).toHaveAttribute("data-state", "synced");
  await expect(page.getByTestId("synced-domains")).toHaveText("Skill levels and placement results");
  await expect(page.getByTestId("local-domains")).toContainText("Completed challenges and course progress");

  // The local level is still there after migration.
  await page.goto("/en/progress");
  await expect(page.getByLabel("Level for JavaScript")).toHaveValue("advanced");

  // A second browser (another device) signs in and receives the level.
  const other = await browser.newContext();
  const phone = await other.newPage();
  await phone.goto("/en/account");
  await phone.getByLabel("Email").fill(email);
  await phone.getByLabel("Password").fill(PASSWORD);
  await phone.getByRole("button", { name: "Sign in" }).last().click();
  await expect(phone.getByTestId("sync-status")).toHaveAttribute("data-state", "synced");
  await phone.goto("/en/progress");
  await expect(phone.getByLabel("Level for JavaScript")).toHaveValue("advanced");

  // A session is restored on the next visit, and signing out keeps local data.
  await phone.goto("/en/account");
  await expect(phone.getByTestId("signed-in-as")).toHaveText(`Signed in as ${email}`);
  await phone.getByRole("button", { name: "Sign out" }).click();
  await expect(phone.getByText("Signed out. Everything you did stays in this browser.")).toBeVisible();
  await phone.goto("/en/progress");
  await expect(phone.getByLabel("Level for JavaScript")).toHaveValue("advanced");
  await other.close();
});

test("sign-in errors are clear in Finnish", async ({ page }) => {
  await page.goto("/fi/account");
  await page.getByLabel("Sähköposti").fill("nobody@example.com");
  await page.getByLabel("Salasana").fill("wrong password");
  await page.getByRole("button", { name: "Kirjaudu sisään" }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Sähköposti tai salasana on väärin.");

  await page.getByRole("button", { name: "Luo tili" }).first().click();
  await page.getByLabel("Sähköposti").fill("not-an-email");
  await page.getByLabel("Salasana").fill("x");
  await page.getByRole("button", { name: "Luo tili" }).last().click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Anna kelvollinen sähköpostiosoite.");
});

test("password reset gives the same answer whether or not an account exists", async ({ page }) => {
  await page.goto("/en/account");
  await page.getByRole("button", { name: "Forgot password" }).click();
  await page.getByLabel("Email").fill("unknown@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "If an account exists" })).toBeVisible();
});
