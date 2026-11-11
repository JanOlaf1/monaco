import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Tests that need the Firebase Emulator Suite. Run through `npm run test:rules`. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/emulators/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // The tests share one emulator; run files one after another.
    fileParallelism: false,
  },
});
