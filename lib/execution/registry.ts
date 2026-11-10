import type { CodeRunner, RunnerLanguage } from "./types";

/**
 * Which languages can actually execute code today. The UI reads this to
 * label unfinished languages honestly instead of faking results.
 *
 * To add a runner: implement `CodeRunner`, add a loader below and flip its
 * support entry to "available". The learning interface needs no changes.
 */
export const runnerSupport: Record<RunnerLanguage, "available" | "planned"> = {
  javascript: "available",
  python: "available",
  typescript: "planned",
  react: "planned",
};

const loaders: Partial<Record<RunnerLanguage, () => Promise<CodeRunner>>> = {
  javascript: () => import("./javascript/runner").then((module) => new module.JavaScriptRunner()),
  python: () => import("./python/runner").then((module) => new module.PythonRunner()),
};

const instances = new Map<RunnerLanguage, Promise<CodeRunner>>();

export function isRunnerAvailable(language: RunnerLanguage): boolean {
  return runnerSupport[language] === "available" && Boolean(loaders[language]);
}

/**
 * Lazily load the shared runner for a language. Runners are singletons per
 * page session so expensive runtimes (Pyodide) are loaded only once.
 * Returns `null` for languages whose runner is not implemented yet.
 */
export function getRunner(language: RunnerLanguage): Promise<CodeRunner> | null {
  const load = loaders[language];
  if (!isRunnerAvailable(language) || !load) return null;
  let instance = instances.get(language);
  if (!instance) {
    instance = load();
    instances.set(language, instance);
    instance.catch(() => instances.delete(language));
  }
  return instance;
}
