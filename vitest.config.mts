import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Emulator tests run separately: npm run test:rules
    exclude: [...configDefaults.exclude, "tests/emulators/**"],
    // Loading Pyodide takes a few seconds.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
