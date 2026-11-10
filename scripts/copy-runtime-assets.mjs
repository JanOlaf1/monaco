#!/usr/bin/env node
/**
 * Copies browser runtime assets that must be served as static files:
 *
 *  - Monaco Editor (AMD "min" build)  -> public/vendor/monaco-editor/vs
 *  - Pyodide core runtime             -> public/vendor/pyodide
 *
 * Both are loaded lazily, only on pages that need them, so they never enter
 * the main JavaScript bundle. The output directory is git-ignored and is
 * regenerated automatically by `npm run dev` / `npm run build`
 * (via the `predev` / `prebuild` npm hooks).
 *
 * The copy is skipped when the destination already contains the same version.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = join(root, "public", "vendor");

function readVersion(pkgDir) {
  return JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version;
}

function isUpToDate(dest, version) {
  const marker = join(dest, ".version");
  return existsSync(marker) && readFileSync(marker, "utf8").trim() === version;
}

function writeMarker(dest, version) {
  writeFileSync(join(dest, ".version"), `${version}\n`);
}

function copyMonaco() {
  const pkgDir = join(root, "node_modules", "monaco-editor");
  const version = readVersion(pkgDir);
  const dest = join(vendorDir, "monaco-editor");
  if (isUpToDate(dest, version)) return `monaco-editor ${version} (cached)`;

  rmSync(dest, { recursive: true, force: true });
  const src = join(pkgDir, "min", "vs");
  cpSync(src, join(dest, "vs"), {
    recursive: true,
    filter: (file) => {
      const rel = relative(src, file).split(sep).join("/");
      // Monaco ships UI translations for other languages (no Finnish); the
      // editor falls back to English, so these are not needed.
      if (rel.startsWith("nls/lang")) return false;
      // Legacy AMD entry points that duplicate the workers in `assets/`.
      // `editor/editor.main.js` only references `assets/*`.
      if (rel === "language" || rel.startsWith("language/")) return false;
      if (rel.endsWith(".map") || rel.endsWith(".d.ts")) return false;
      return true;
    },
  });
  cpSync(join(pkgDir, "LICENSE"), join(dest, "LICENSE"));
  writeMarker(dest, version);
  return `monaco-editor ${version}`;
}

function copyPyodide() {
  const pkgDir = join(root, "node_modules", "pyodide");
  const version = readVersion(pkgDir);
  const dest = join(vendorDir, "pyodide");
  if (isUpToDate(dest, version)) return `pyodide ${version} (cached)`;

  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const files = [
    "pyodide.mjs",
    "pyodide.asm.mjs",
    "pyodide.asm.wasm",
    "python_stdlib.zip",
    "pyodide-lock.json",
  ];
  for (const file of files) {
    const from = join(pkgDir, file);
    if (!existsSync(from)) {
      throw new Error(
        `Pyodide file "${file}" was not found in node_modules/pyodide. ` +
          "The package layout may have changed; update scripts/copy-runtime-assets.mjs.",
      );
    }
    cpSync(from, join(dest, file));
  }
  writeMarker(dest, version);
  return `pyodide ${version}`;
}

try {
  mkdirSync(vendorDir, { recursive: true });
  const results = [copyMonaco(), copyPyodide()];
  console.log(`[runtime-assets] ${results.join(", ")} -> public/vendor`);
} catch (error) {
  console.error("[runtime-assets] Failed to copy runtime assets:", error);
  process.exit(1);
}
