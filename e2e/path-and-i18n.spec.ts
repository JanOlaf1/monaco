import { expect, test } from "@playwright/test";
import { seedLearner, watchConsole } from "./helpers";

test("the learning path shows chapters, node states and works with the keyboard", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/en");
  await seedLearner(page, { completed: [{ exerciseId: "py-hello-world" }] });
  await page.goto("/en/courses/python");

  await expect(page.getByRole("heading", { name: "Python Fundamentals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hello, Python" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mini-projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Your first program — Completed" })).toBeVisible();
  const current = page.getByRole("link", { name: "Line by line — Up next" });
  await expect(current).toBeVisible();
  // Nothing is locked: a later challenge is still a normal link.
  await expect(page.getByRole("link", { name: "Lab: Word counter — Not started" })).toBeVisible();

  await current.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/py-multiple-prints$/);
  expect(problems).toEqual([]);
});

test("the course catalog lists every course and labels unfinished ones", async ({ page }) => {
  await page.goto("/en/courses");
  await expect(page.getByRole("heading", { name: "All courses" })).toBeVisible();
  for (const title of ["Python Fundamentals", "JavaScript Foundations", "TypeScript Essentials", "React Basics"]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(page.getByText("Coming soon")).toHaveCount(2);
});

test("switching between Finnish and English keeps the page and translates content", async ({ page }) => {
  await page.goto("/en/courses/python");
  await page.getByRole("link", { name: "Suomi" }).click();
  await page.waitForURL(/\/fi\/courses\/python$/);
  await expect(page.getByRole("heading", { name: "Pythonin perusteet" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hei, Python" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fi");

  await page.goto("/fi/courses/python/py-hello-world");
  await expect(page.getByRole("button", { name: "Tarkista vastaus" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ensimmäinen ohjelmasi" })).toBeVisible();

  await page.getByRole("link", { name: "English" }).click();
  await page.waitForURL(/\/en\/courses\/python\/py-hello-world$/);
  await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
});

test("dark mode can be chosen and persists", async ({ page }) => {
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: /^Theme:/ });
  await toggle.click(); // system -> light
  await toggle.click(); // light -> dark
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await toggle.click(); // dark -> system
  await toggle.click(); // system -> light
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
