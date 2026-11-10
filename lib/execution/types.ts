/**
 * Language-independent contract between the learning UI and code runners.
 * A runner executes learner code in an isolated context (a Web Worker) and
 * evaluates test definitions. The UI only depends on these types.
 */

export type RunnerLanguage = "javascript" | "python" | "typescript" | "react";

export type OutputStream = "stdout" | "stderr" | "log" | "info" | "warn" | "error" | "debug";

export interface OutputEntry {
  stream: OutputStream;
  text: string;
}

export type ExecutionErrorKind =
  /** The learner's code could not be parsed. */
  | "syntax"
  /** The learner's code threw while running. */
  | "runtime"
  /** Execution exceeded the time limit and the worker was terminated. */
  | "timeout"
  /** The runner itself failed (worker crash, runtime failed to load). */
  | "internal";

export interface ExecutionError {
  kind: ExecutionErrorKind;
  /** e.g. `SyntaxError`, `NameError`, `TypeError`. */
  name: string;
  /** The raw message from the language runtime (not localized). */
  message: string;
  /** 1-based line in the learner's file, when known. */
  line?: number;
  /** 1-based column, when known. */
  column?: number;
  /** Learner-focused traceback / stack (frames outside their code removed). */
  traceback?: string;
  /** For `timeout` errors: the limit that was exceeded. */
  timeoutMs?: number;
}

export interface RunResult {
  status: "ok" | "error";
  output: OutputEntry[];
  error?: ExecutionError;
  durationMs: number;
  /** Output was cut because it exceeded the runner's limit. */
  truncated?: boolean;
  /** Timers (setTimeout/setInterval) still pending when the run ended; they were cancelled. */
  stoppedTimers?: number;
}

/**
 * - `pass` / `fail`: the test ran.
 * - `skipped`: not run, because the code has a syntax error or timed out.
 * - `error`: the test definition itself is broken (a content bug).
 */
export type TestStatus = "pass" | "fail" | "skipped" | "error";

export interface TestResult {
  id: string;
  status: TestStatus;
  /** Formatted expected value, if the assertion provided one. */
  expected?: string;
  /** Formatted actual value, if the assertion provided one. */
  actual?: string;
  /** Technical detail from the runtime (not localized). */
  message?: string;
}

export interface CheckResult {
  /** The learner's program as executed once during the check. */
  run: RunResult;
  tests: TestResult[];
  /** True only if every test passed and the program ran without errors. */
  passed: boolean;
  durationMs: number;
}

export interface ExecutionFile {
  name: string;
  content: string;
  entry?: boolean;
}

export interface TestSpec {
  id: string;
  code: string;
}

export interface RunRequest {
  files: ExecutionFile[];
}

export interface CheckRequest extends RunRequest {
  tests: TestSpec[];
}

export interface RunCallbacks {
  /** Streamed output while the program runs (Run mode only). */
  onOutput?: (entry: OutputEntry) => void;
  signal?: AbortSignal;
}

export type RunnerStatus = "idle" | "loading" | "ready" | "error";

export interface RunnerCapabilities {
  run: boolean;
  check: boolean;
  /** Renders a visual preview (e.g. React). */
  preview: boolean;
}

export interface CodeRunner {
  readonly language: RunnerLanguage;
  readonly capabilities: RunnerCapabilities;
  /** Start loading the runtime ahead of the first run (optional). */
  prepare(): Promise<void>;
  run(request: RunRequest, callbacks?: RunCallbacks): Promise<RunResult>;
  check(request: CheckRequest, callbacks?: RunCallbacks): Promise<CheckResult>;
  getStatus(): RunnerStatus;
  subscribe(listener: () => void): () => void;
  /** Terminate workers and release resources. */
  dispose(): void;
}

export const EXECUTION_LIMITS = {
  javascript: { runMs: 5_000, checkMs: 8_000 },
  python: { runMs: 8_000, checkMs: 15_000 },
} as const;

/** Combine a raw check report into a CheckResult with the `passed` flag. */
export function finalizeCheck(run: RunResult, tests: TestResult[], durationMs: number): CheckResult {
  const passed = run.status === "ok" && tests.length > 0 && tests.every((test) => test.status === "pass");
  return { run, tests, passed, durationMs };
}

export function entryFile(files: ExecutionFile[]): ExecutionFile {
  const entry = files.find((file) => file.entry) ?? files[0];
  if (!entry) throw new Error("No files to execute.");
  return entry;
}
