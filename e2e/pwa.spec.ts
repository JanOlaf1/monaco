import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type Page } from "@playwright/test";
import { readStorage, seedLearner, watchConsole } from "./helpers";

/** Wait until the service worker is active and controls this page. */
async function waitForServiceWorker(page: Page) {
  // A synchronous predicate: an async one would return a (truthy) promise immediately.
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 30_000 });
}

test.describe("installable app", () => {
  test("serves a valid manifest, icons and service worker", async ({ page, request }) => {
    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest).toMatchObject({ name: "Koodaamo", short_name: "Koodaamo", display: "standalone", start_url: "/" });
    for (const icon of manifest.icons as { src: string; type: string }[]) {
      const response = await request.get(icon.src);
      expect(response.status(), icon.src).toBe(200);
      expect(response.headers()["content-type"], icon.src).toContain(icon.type);
    }

    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBe(true);
    expect(sw.headers()["content-type"]).toContain("javascript");
    expect(sw.headers()["cache-control"]).toContain("no-cache");

    await page.goto("/en");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/icons/apple-touch-icon.png");
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", /#/);
    await waitForServiceWorker(page);

    // Chrome's own installability check (manifest, icons, service worker, HTTPS/localhost).
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
    // Automated browser contexts are always incognito, which Chrome reports on its own;
    // any manifest, icon or service worker problem would be listed as well.
    expect(installabilityErrors.filter((error) => error.errorId !== "in-incognito")).toEqual([]);
  });

  test("offers installation only on request and explains iOS steps", async ({ page, browser }) => {
    await page.goto("/en/settings");
    await expect(page.getByRole("heading", { name: "Install Koodaamo" })).toBeVisible();
    // No popup or dialog is shown by itself.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Simulate the browser offering installation (Chromium's beforeinstallprompt).
    await page.evaluate(() => {
      const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: async () => undefined,
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      window.dispatchEvent(event);
    });
    await page.getByRole("button", { name: "Install app" }).click();
    await expect(page.getByText("Thanks! Koodaamo is being added to your device.")).toBeVisible();

    const iphone = await browser.newContext({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      viewport: { width: 390, height: 844 },
    });
    const ios = await iphone.newPage();
    await ios.goto("/fi/settings");
    await expect(ios.getByTestId("install-ios")).toContainText("Lisää Koti-valikkoon");
    await iphone.close();
  });
});

test.describe("offline support", () => {
  test("keeps visited pages and practice working offline, and reports reconnection", async ({ page, context }) => {
    const problems = watchConsole(page);
    await page.goto("/en");
    await waitForServiceWorker(page);
    // Pages opened while the service worker is in control are kept for offline use.
    await page.goto("/en/practice");
    await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();
    await page.goto("/en/progress");
    await expect(page.locator("main")).toBeVisible();

    await context.setOffline(true);
    await expect(page.getByTestId("offline-indicator")).toBeVisible();
    await expect(page.getByTestId("offline-notice")).toContainText("Python, account sync and new pages need a connection");

    await page.goto("/en/practice");
    await expect(page.getByRole("heading", { name: "Practice", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Practice new activities" }).click();
    await page.getByRole("radio", { name: "HI, ADA!", exact: true }).check();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByTestId("practice-xp")).toHaveText("+5 XP");
    const gamification = await readStorage<{ awards: Record<string, { xp: number }> }>(page, "koodaamo:v1:gamification");
    expect(gamification?.awards["practice:pr-py-upper-greeting"]?.xp).toBe(5);

    // A page that was never opened shows the offline page instead of a browser error.
    await page.goto("/en/plan");
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByText("Python lessons: the Python runtime is downloaded when needed")).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByTestId("online-notice")).toHaveText("You're back online.");
    await expect(page.getByTestId("offline-indicator")).toHaveCount(0);

    // Nothing private or runtime-sized is cached: only same-origin app files.
    const cached = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        for (const request of await (await caches.open(name)).keys()) urls.push(request.url);
      }
      return urls;
    });
    expect(cached.length).toBeGreaterThan(0);
    for (const url of cached) {
      expect(new URL(url).origin, url).toBe(new URL(page.url()).origin);
      expect(url).not.toMatch(/\/vendor\/pyodide\/|\/api\/|_rsc=/);
    }
    expect(problems.filter((problem) => !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(problem))).toEqual([]);
  });

  test("an update waits for the learner and then switches cleanly", async ({ page, baseURL }) => {
    // Browsers fetch the service worker script themselves, outside Playwright's routing,
    // so a small proxy in front of the app serves the "next version" of sw.js on demand.
    const upstream = new URL(baseURL!);
    const current = readFileSync("public/sw.js", "utf8");
    let nextVersion: string | null = null;
    const proxy = createServer((request, response) => {
      if (request.url === "/sw.js" && nextVersion) {
        response.writeHead(200, { "Content-Type": "application/javascript", "Cache-Control": "no-cache" });
        response.end(nextVersion);
        return;
      }
      const forwarded = httpRequest(
        { host: upstream.hostname, port: upstream.port, path: request.url, method: request.method, headers: { ...request.headers, host: upstream.host } },
        (reply) => {
          response.writeHead(reply.statusCode ?? 502, reply.headers);
          reply.pipe(response);
        },
      );
      forwarded.on("error", () => response.destroy());
      request.pipe(forwarded);
    });
    await new Promise<void>((resolve) => proxy.listen(0, resolve));
    const origin = `http://localhost:${(proxy.address() as AddressInfo).port}`;
    try {
      await page.goto(`${origin}/en`);
      await waitForServiceWorker(page);
      // The first installation never shows an update notice.
      await expect(page.getByTestId("update-notice")).toHaveCount(0);

      nextVersion = `${current}\n// next version\n`;
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
      await expect(page.getByTestId("update-notice")).toBeVisible({ timeout: 30_000 });
      // Nothing happens until the learner chooses to update: the page is not reloaded.
      await page.evaluate(() => ((window as unknown as { __stillHere: boolean }).__stillHere = true));
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => (window as unknown as { __stillHere?: boolean }).__stillHere)).toBe(true);
      // "Later" hides the notice for now; the waiting version stays ready.
      await page.getByRole("button", { name: "Later" }).click();
      await expect(page.getByTestId("update-notice")).toHaveCount(0);
      await page.reload();
      await expect(page.getByTestId("update-notice")).toBeVisible({ timeout: 30_000 });

      const reloaded = page.waitForEvent("load");
      await page.getByRole("button", { name: "Update now" }).click();
      await reloaded;
      await waitForServiceWorker(page);
      await expect(page.getByRole("link", { name: "Start learning" })).toBeVisible();
      await expect(page.getByTestId("update-notice")).toHaveCount(0);
      const state = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return { waiting: Boolean(registration?.waiting), caches: await caches.keys() };
      });
      expect(state.waiting).toBe(false);
      expect(state.caches.every((name) => name.startsWith("koodaamo-sw-v1-"))).toBe(true);
    } finally {
      await new Promise((resolve) => proxy.close(resolve));
    }
  });
});

test.describe("settings and backup", () => {
  test("settings work in both languages and themes", async ({ page }) => {
    for (const [locale, heading, install] of [
      ["en", "Settings", "Install Koodaamo"],
      ["fi", "Asetukset", "Asenna Koodaamo"],
    ] as const) {
      await page.goto(`/${locale}/settings`);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: install })).toBeVisible();
    }
    await page.goto("/en/settings");
    await expect(page.getByText("only your skill levels sync between devices")).toBeVisible();
    await expect(page.getByText("on iPhone and iPad, the home-screen app doesn't see progress saved in Safari")).toBeVisible();
    await page.getByText("Dark", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => localStorage.getItem("koodaamo:theme"))).toBe("dark");
    await page.getByText("Light", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    // The header offers Practice and Settings on larger screens; the phone bar is hidden.
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Practice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(page.getByTestId("mobile-nav")).toBeHidden();
  });

  test("exports a backup and restores it in another browser without duplicate rewards", async ({ page, browser }, testInfo) => {
    await page.goto("/en");
    await seedLearner(page, { completed: [{ exerciseId: "py-hello-world" }] });
    await page.goto("/en/settings");
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download backup" }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^koodaamo-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const file = testInfo.outputPath("backup.json");
    await download.saveAs(file);
    const backup = JSON.parse(readFileSync(file, "utf8"));
    expect(backup.format).toBe("koodaamo-backup");
    expect(backup.data.progress.exercises["py-hello-world"].completedAt).toBeTruthy();
    expect(readFileSync(file, "utf8")).not.toMatch(/account-session|password|token/i);
    await expect(page.getByTestId("backup-status")).toContainText("Backup saved as");

    // A different browser profile (e.g. the installed app on another device).
    const other = await browser.newContext();
    const fresh = await other.newPage();
    await fresh.goto("/en/settings");
    await fresh.getByTestId("backup-file").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("not json") });
    await expect(fresh.locator("main").getByRole("alert")).toHaveText(/can't be read as a backup/);

    await fresh.getByTestId("backup-file").setInputFiles(file);
    const dialog = fresh.getByRole("dialog", { name: "Restore this backup?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("backup-summary")).toContainText("1 completed exercise");
    await expect(dialog.getByTestId("backup-summary")).toContainText("+30 XP");
    // Cancelling changes nothing.
    await dialog.getByRole("button", { name: "Cancel" }).click();
    expect(await readStorage(fresh, "koodaamo:v1:progress")).toBeNull();

    await fresh.getByTestId("backup-file").setInputFiles(file);
    await dialog.getByRole("button", { name: "Restore" }).click();
    await expect(fresh.getByTestId("backup-status")).toHaveText("Backup restored.");
    const xp = async () => {
      const state = await readStorage<{ awards: Record<string, { xp: number }> }>(fresh, "koodaamo:v1:gamification");
      return Object.values(state?.awards ?? {}).reduce((sum, award) => sum + award.xp, 0);
    };
    expect(await xp()).toBe(30);

    // Restoring the same file again adds nothing.
    await fresh.getByTestId("backup-file").setInputFiles(file);
    await expect(dialog.getByText("Everything in this backup is already here")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Restore" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close" }).first().click();
    expect(await xp()).toBe(30);
    await fresh.goto("/en/progress");
    await expect(fresh.locator("main")).toContainText("30");
    await other.close();
  });
});
