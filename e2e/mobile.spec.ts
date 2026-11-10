import { expect, test } from "@playwright/test";
import { setCode } from "./helpers";

test("onboarding, the path and the workspace are usable on a phone", async ({ page }) => {
  for (const path of ["/en", "/en/courses", "/en/courses/python", "/en/progress"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }

  await page.goto("/en");
  // The first action is reachable without scrolling.
  await expect(page.getByRole("link", { name: "Start learning" })).toBeInViewport({ ratio: 1 });
  await page.getByRole("link", { name: "Start learning" }).click();
  await page.waitForURL(/py-hello-world$/);

  const tabs = page.getByRole("tab");
  await expect(page.getByRole("tab", { name: "Instructions" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.locator(".monaco-editor").first()).toBeVisible({ timeout: 60_000 });
  await setCode(page, "py-hello-world", 'print("Hello, world!")\n');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Output" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#ws-panel-output pre", { hasText: "Hello, world!" })).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("tab", { name: "Instructions" })).toHaveAttribute("aria-selected", "true", { timeout: 60_000 });
  await expect(page.getByText("Challenge complete!")).toBeVisible();
  expect(await tabs.count()).toBeGreaterThanOrEqual(3);
});
