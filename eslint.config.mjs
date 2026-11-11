import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Emulator-backed e2e build output (npm run build:e2e-cloud).
    ".next-cloud-e2e/**",
    // Generated copies of Monaco/Pyodide (scripts/copy-runtime-assets.mjs).
    "public/vendor/**",
    // Playwright traces contain captured third-party/minified runtime sources.
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
