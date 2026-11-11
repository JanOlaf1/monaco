import { defineConfig } from "@playwright/test";

/**
 * Browser tests for the optional account and cloud sync, against the Firebase
 * Emulator Suite (demo project; no real Firebase project is contacted).
 *
 *   npm run build:e2e-cloud && npm run test:e2e:cloud
 */
const PORT = Number(process.env.E2E_CLOUD_PORT ?? 3230);
const channel = process.env.PLAYWRIGHT_CHANNEL === "" ? undefined : (process.env.PLAYWRIGHT_CHANNEL ?? "chrome");

export default defineConfig({
  testDir: "e2e-cloud",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel,
    viewport: { width: 1280, height: 860 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    env: { NEXT_DIST_DIR: ".next-cloud-e2e" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
