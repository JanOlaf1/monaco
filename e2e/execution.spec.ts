import { expect, test } from "@playwright/test";
import { checkAnswer, setCode, watchConsole } from "./helpers";

test("JavaScript runs in a worker, shows output and stops infinite loops", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/en/courses/javascript/js-for-loop");
  await setCode(page, "js-for-loop", "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator("#ws-panel-output pre", { hasText: "5" })).toBeVisible();
  await checkAnswer(page);
  await expect(page.getByText("Challenge complete!")).toBeVisible();

  await setCode(page, "js-for-loop", "while (true) {}\n");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText(/ran for more than 5 seconds/)).toBeVisible({ timeout: 20_000 });
  await setCode(page, "js-for-loop", 'console.log("recovered");\n');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator("#ws-panel-output pre", { hasText: "recovered" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("Python runs in Pyodide and its checks give specific feedback", async ({ page }) => {
  await page.goto("/en/courses/python/py-time-converter");
  await setCode(page, "py-time-converter", 'total_minutes = 135\nhours = total_minutes / 60\nminutes = total_minutes % 60\nprint(f"{hours} h {minutes} min")\n');
  await checkAnswer(page);
  await expect(page.getByText("Not quite yet")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-test-id="hours"]')).toHaveAttribute("data-status", "fail");

  await setCode(page, "py-time-converter", 'total_minutes = 135\nhours = total_minutes // 60\nminutes = total_minutes % 60\nprint(f"{hours} h {minutes} min")\n');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator("#ws-panel-output pre", { hasText: "2 h 15 min" })).toBeVisible({ timeout: 60_000 });
  await checkAnswer(page);
  await expect(page.getByText("Challenge complete!")).toBeVisible();
});

test("the JavaScript runWith checks work in the browser worker", async ({ page }) => {
  await page.goto("/en/courses/javascript/js-comparisons");
  await setCode(page, "js-comparisons", "const age = 17;\nconst isAdult = age > 18;\n");
  await checkAnswer(page);
  await expect(page.locator('[data-test-id="boundary"]')).toHaveAttribute("data-status", "fail");
  await setCode(page, "js-comparisons", "const age = 17;\nconst isAdult = age >= 18;\n");
  await checkAnswer(page);
  await expect(page.getByText("Challenge complete!")).toBeVisible();
});
