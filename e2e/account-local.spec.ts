import { expect, test } from "@playwright/test";

/**
 * Without a Firebase configuration (the default build), accounts are hidden,
 * the account page explains that everything is local, and the app never
 * contacts Firebase.
 */
test("without Firebase configured, learning is fully local and nothing is sent to Firebase", async ({ page }) => {
  const firebaseRequests: string[] = [];
  page.on("request", (request) => {
    if (/googleapis\.com|firebaseio\.com|firebaseapp\.com|identitytoolkit/.test(request.url())) firebaseRequests.push(request.url());
  });

  await page.goto("/en");
  await expect(page.getByRole("link", { name: "Account" })).toHaveCount(0);
  await page.getByRole("group", { name: /have you written/ }).getByText("Beginner", { exact: true }).click();
  await page.getByRole("link", { name: "Start learning" }).click();
  await page.waitForURL(/py-hello-world$/);

  await page.goto("/en/account");
  await expect(page.getByText("Accounts are not available in this version of Koodaamo.")).toBeVisible();
  await expect(page.getByTestId("local-domains")).toContainText("Skill levels and placement results");
  await expect(page.getByTestId("synced-domains")).toHaveCount(0);
  expect(firebaseRequests).toEqual([]);
});
