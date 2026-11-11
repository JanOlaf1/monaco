import { expect, test } from "@playwright/test";
import { watchConsole } from "./helpers";

test("the collection is usable on a phone in both languages and themes with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const problems = watchConsole(page);
  for (const locale of ["en", "fi"]) {
    for (const theme of ["light", "dark"]) {
      await page.goto(`/${locale}/collection`);
      await page.evaluate((preference) => localStorage.setItem("koodaamo:theme", preference), theme);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByTestId("cosmetic-scarf")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      const preview = page.getByTestId("cosmetic-scarf").getByRole("button").first();
      await preview.scrollIntoViewIfNeeded();
      await preview.focus();
      await expect(preview).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("avatar-preview")).toBeVisible();
      expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
      const animation = await page.getByTestId("avatar-preview").evaluate((element) => {
        const svg = element.querySelector("svg") ?? element;
        return { name: getComputedStyle(svg).animationName, duration: getComputedStyle(svg).animationDuration };
      });
      expect(animation.name === "none" || animation.duration.split(",").every((duration) => parseFloat(duration) <= 0.01)).toBe(true);
    }
  }
  expect(problems).toEqual([]);
});
