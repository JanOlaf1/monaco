import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against the production build.
 *
 *   npm run build && npm run test:e2e
 *
 * Uses the locally installed Google Chrome by default. To use Playwright's
 * bundled Chromium instead (e.g. in CI), run `npx playwright install chromium`
 * and set PLAYWRIGHT_CHANNEL to an empty string.
 */
const PORT = Number(process.env.E2E_PORT ?? 3210);
const channel = process.env.PLAYWRIGHT_CHANNEL === "" ? undefined : (process.env.PLAYWRIGHT_CHANNEL ?? "chrome");

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel }, testMatch: /mobile\.spec/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
