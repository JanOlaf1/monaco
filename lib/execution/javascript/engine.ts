import { parse, type Program } from "acorn";
import type {
  ExecutionError,
  OutputEntry,
  OutputStream,
  RunResult,
  TestResult,
  TestSpec,
} from "../types";
import { createAstHelpers } from "./ast-helpers";
import { formatConsoleArgs, formatValue } from "./format-value";
import { AssertionFailure, createTestApi, type JsTestApi, type VariantRun } from "./test-api";

/**
 * Environment-agnostic JavaScript execution core.
 *
 * In the browser it runs inside a dedicated Web Worker (see `js.worker.ts`),
 * never in the main application context. In unit tests it runs in Node, using
 * a separate `vm` realm for isolation.
 *
 * How tests see the learner's declarations: the learner code and the test
 * functions are compiled into ONE async function body. A one-line prefix
 * registers a getter for a hoisted `__cl_suite__` function placed after the
 * learner code, so the tests close over the learner's top-level scope even if
 * their program throws halfway through.
 */

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

export interface EngineOptions {
  code: string;
  fileName?: string;
  /** When provided, the engine evaluates these tests after running the code. */
  tests?: TestSpec[];
  /** Streamed console output (run mode). */
  onOutput?: (entry: OutputEntry) => void;
  /** Maximum time to wait for pending timers after the program finishes. */
  settleMs?: number;
  maxOutputChars?: number;
  /** Override the realm used to compile code (unit tests pass a vm realm). */
  AsyncFunction?: AsyncFunctionConstructor;
}

export interface EngineResult {
  run: RunResult;
  tests?: TestResult[];
}

export interface EngineController {
  /** Report an error that escaped asynchronously (e.g. an unhandled rejection). */
  reportAsyncError(error: unknown): void;
}

const DefaultAsyncFunction = Object.getPrototypeOf(async function () {}).constructor as AsyncFunctionConstructor;

const PARAMS = ["console", "setTimeout", "setInterval", "clearTimeout", "clearInterval", "__cl"] as const;
const PREFIX = "__cl.register(function () { return __cl_suite__(); });";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const realSetTimeout = globalThis.setTimeout.bind(globalThis);
const realClearTimeout = globalThis.clearTimeout.bind(globalThis);
const realSetInterval = globalThis.setInterval.bind(globalThis);
const realClearInterval = globalThis.clearInterval.bind(globalThis);
const delay = (ms: number) => new Promise<void>((resolve) => realSetTimeout(resolve, ms));

type TimerHandle = ReturnType<typeof setTimeout>;

const lineBaseCache = new WeakMap<AsyncFunctionConstructor, Promise<number>>();

/** Find which physical line the function body starts on (engines differ). */
function probeLineBase(Ctor: AsyncFunctionConstructor): Promise<number> {
  let cached = lineBaseCache.get(Ctor);
  if (!cached) {
    cached = (async () => {
      try {
        await new Ctor(...PARAMS, 'throw new Error("probe");\n//# sourceURL=__probe__.js')();
      } catch (error) {
        const match = /__probe__\.js:(\d+):(\d+)/.exec(String((error as Error)?.stack ?? ""));
        if (match) return Number(match[1]);
      }
      return 3;
    })();
    lineBaseCache.set(Ctor, cached);
  }
  return cached;
}

function isErrorLike(value: unknown): value is { name: string; message: string; stack?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { message?: unknown }).message === "string" &&
    typeof (value as { name?: unknown }).name === "string"
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface LocationMapper {
  map(stack: string | undefined): { line?: number; column?: number; traceback?: string };
}

function createLocationMapper(fileName: string, lineBase: number, prefixLength: number): LocationMapper {
  const pattern = new RegExp(`${escapeRegExp(fileName)}:(\\d+):(\\d+)`, "g");
  const toUser = (rawLine: number, rawColumn: number) => {
    const line = rawLine - lineBase + 1;
    const column = line === 1 ? rawColumn - prefixLength : rawColumn;
    return { line, column: Math.max(1, column) };
  };
  return {
    map(stack) {
      if (!stack) return {};
      let first: { line: number; column: number } | undefined;
      const frames: string[] = [];
      for (const rawFrame of stack.split("\n").slice(1)) {
        if (!rawFrame.includes(fileName)) continue;
        const frame = rawFrame.replace(pattern, (_match, l: string, c: string) => {
          const mapped = toUser(Number(l), Number(c));
          first ??= mapped;
          return `${fileName}:${mapped.line}:${mapped.column}`;
        });
        frames.push(frame.replace(/\(eval at [^)]*\), /, "").replace(/eval at .*?<anonymous>\), /, ""));
      }
      return { line: first?.line, column: first?.column, traceback: frames.length ? frames.join("\n") : undefined };
    },
  };
}

function toExecutionError(error: unknown, mapper: LocationMapper): ExecutionError {
  if (isErrorLike(error)) {
    const located = mapper.map(error.stack);
    const traceback = `${error.name}: ${error.message}${located.traceback ? `\n${located.traceback}` : ""}`;
    return {
      kind: "runtime",
      name: error.name,
      message: error.message,
      line: located.line,
      column: located.column,
      traceback,
    };
  }
  return { kind: "runtime", name: "Uncaught", message: formatValue(error) };
}

function syntaxError(error: unknown): ExecutionError {
  const raw = error as { message?: string; loc?: { line: number; column: number } };
  const message = (raw.message ?? "Invalid syntax").replace(/\s*\(\d+:\d+\)$/, "");
  return {
    kind: "syntax",
    name: "SyntaxError",
    message,
    line: raw.loc?.line,
    column: raw.loc ? raw.loc.column + 1 : undefined,
  };
}

const PARSE_OPTIONS = {
  ecmaVersion: "latest",
  sourceType: "script",
  locations: true,
  allowAwaitOutsideFunction: true,
  allowReturnOutsideFunction: true,
  allowHashBang: true,
} as const;

/** Parse a test body on its own to detect broken test definitions early. */
function testBodyIsValid(testCode: string): boolean {
  try {
    parse(`(async function (t) {\n${testCode}\n})`, PARSE_OPTIONS);
    return true;
  } catch {
    return false;
  }
}

/** A console object whose methods forward formatted arguments to `write`. */
function createConsole(write: (stream: OutputStream, args: unknown[]) => void) {
  const counters = new Map<string, number>();
  return {
    log: (...args: unknown[]) => write("log", args),
    info: (...args: unknown[]) => write("info", args),
    warn: (...args: unknown[]) => write("warn", args),
    error: (...args: unknown[]) => write("error", args),
    debug: (...args: unknown[]) => write("debug", args),
    trace: (...args: unknown[]) => write("debug", args),
    dir: (value: unknown) => write("log", [value]),
    table: (value: unknown) => write("log", [value]),
    group: (...args: unknown[]) => write("log", args),
    groupCollapsed: (...args: unknown[]) => write("log", args),
    groupEnd: () => {},
    clear: () => {},
    time: () => {},
    timeEnd: () => {},
    timeLog: () => {},
    assert: (condition: unknown, ...args: unknown[]) => {
      if (!condition) write("error", ["Assertion failed:", ...args]);
    },
    count: (label: unknown = "default") => {
      const key = String(label);
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      write("log", [`${key}: ${next}`]);
    },
  };
}

/** Source text for a JSON-compatible value (used to replace declarations). */
function toSourceLiteral(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error("runWith only supports JSON-compatible values.");
  return `(${json})`;
}

/** The first top-level `const/let/var name = <init>` declarator, if any. */
function findTopLevelInit(program: Program, name: string): { start: number; end: number } | undefined {
  for (const statement of program.body as unknown as Array<Record<string, unknown>>) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const declarator of statement.declarations as Array<Record<string, unknown>>) {
      const id = declarator.id as { type: string; name?: string };
      const init = declarator.init as { start: number; end: number } | null;
      if (id.type === "Identifier" && id.name === name && init) return { start: init.start, end: init.end };
    }
  }
  return undefined;
}

export function createJavaScriptExecution(options: EngineOptions): EngineController & {
  start(): Promise<EngineResult>;
} {
  const fileName = options.fileName ?? "index.js";
  const maxOutputChars = options.maxOutputChars ?? 100_000;
  const settleMs = options.settleMs ?? 2_000;
  const Ctor = options.AsyncFunction ?? DefaultAsyncFunction;

  const output: OutputEntry[] = [];
  const logs: string[] = [];
  let outputChars = 0;
  let truncated = false;
  let phase: "main" | "tests" = "main";
  let captureSink: string[] | null = null;
  let asyncError: ExecutionError | undefined;
  let mapper: LocationMapper = { map: () => ({}) };

  function emit(stream: OutputStream, args: unknown[]) {
    const text = formatConsoleArgs(args);
    if (captureSink) {
      captureSink.push(text);
      return;
    }
    if (phase !== "main") return;
    logs.push(text);
    if (truncated) return;
    if (outputChars + text.length > maxOutputChars) {
      truncated = true;
      return;
    }
    outputChars += text.length;
    const entry: OutputEntry = { stream, text };
    output.push(entry);
    options.onOutput?.(entry);
  }

  const consoleProxy = createConsole(emit);

  const pending = new Map<TimerHandle, "timeout" | "interval">();

  function guard(callback: unknown, args: unknown[]) {
    if (typeof callback !== "function") {
      throw new TypeError("The callback must be a function.");
    }
    return () => {
      try {
        const result = callback(...args);
        if (result && typeof (result as Promise<unknown>).catch === "function") {
          (result as Promise<unknown>).catch(reportAsyncError);
        }
      } catch (error) {
        reportAsyncError(error);
      }
    };
  }

  const timers = {
    setTimeout(callback: unknown, ms?: number, ...args: unknown[]) {
      const run = guard(callback, args);
      const handle: TimerHandle = realSetTimeout(() => {
        pending.delete(handle);
        run();
      }, Number(ms) || 0);
      pending.set(handle, "timeout");
      return handle;
    },
    setInterval(callback: unknown, ms?: number, ...args: unknown[]) {
      const run = guard(callback, args);
      const handle: TimerHandle = realSetInterval(run, Math.max(1, Number(ms) || 0));
      pending.set(handle, "interval");
      return handle;
    },
    clearTimeout(handle: TimerHandle) {
      realClearTimeout(handle);
      pending.delete(handle);
    },
    clearInterval(handle: TimerHandle) {
      realClearInterval(handle);
      pending.delete(handle);
    },
  };

  function reportAsyncError(error: unknown) {
    if (phase === "main" && !asyncError) asyncError = toExecutionError(error, mapper);
  }

  function cancelPending(): number {
    const stopped = pending.size;
    for (const handle of pending.keys()) {
      realClearTimeout(handle);
      realClearInterval(handle);
    }
    pending.clear();
    return stopped;
  }

  /** Wait (bounded) for timers the program scheduled, then cancel the rest. */
  async function settle(): Promise<number> {
    await delay(0);
    const deadline = now() + settleMs;
    while (pending.size > 0 && now() < deadline) await delay(10);
    return cancelPending();
  }

  function capture<T>(fn: () => T): { result: T; logs: string[] } {
    const previous = captureSink;
    const collected: string[] = [];
    captureSink = collected;
    try {
      return { result: fn(), logs: collected };
    } finally {
      captureSink = previous;
    }
  }

  async function start(): Promise<EngineResult> {
    const startedAt = now();
    const tests = options.tests;
    const finish = (run: Omit<RunResult, "durationMs">, testResults?: TestResult[]): EngineResult => ({
      run: { ...run, durationMs: Math.round(now() - startedAt) },
      tests: testResults,
    });

    let program: Program;
    try {
      program = parse(options.code, PARSE_OPTIONS);
    } catch (error) {
      return finish(
        { status: "error", output, error: syntaxError(error) },
        tests?.map((test) => ({ id: test.id, status: "skipped" })),
      );
    }

    const validTests = tests?.filter((test) => testBodyIsValid(test.code)) ?? [];
    const suite = tests
      ? `\n;function __cl_suite__() {\n  return [\n${validTests
          .map((test) => `async function (t) {\n${test.code}\n}`)
          .join(",\n")}\n  ];\n}`
      : "";
    const prefix = tests ? PREFIX : "";
    const source = `${prefix}${options.code}\n${suite}\n//# sourceURL=${fileName}`;

    const lineBase = await probeLineBase(Ctor);
    mapper = createLocationMapper(fileName, lineBase, prefix.length);

    let compiled: (...args: unknown[]) => Promise<unknown>;
    try {
      compiled = new Ctor(...PARAMS, source);
    } catch (error) {
      // The learner code parsed, so this is an engine/test-suite problem.
      return finish(
        {
          status: "error",
          output,
          error: {
            kind: "internal",
            name: isErrorLike(error) ? error.name : "Error",
            message: isErrorLike(error) ? error.message : String(error),
          },
        },
        tests?.map((test) => ({ id: test.id, status: "error", message: "The test suite could not be compiled." })),
      );
    }

    let getSuite: (() => Array<(t: JsTestApi) => Promise<void>>) | undefined;
    const harness = {
      register(getter: () => Array<(t: JsTestApi) => Promise<void>>) {
        getSuite = getter;
      },
    };

    let runError: ExecutionError | undefined;
    try {
      await compiled(
        consoleProxy,
        timers.setTimeout,
        timers.setInterval,
        timers.clearTimeout,
        timers.clearInterval,
        harness,
      );
    } catch (error) {
      runError = toExecutionError(error, mapper);
    }
    const stoppedTimers = await settle();
    runError ??= asyncError;

    const run: Omit<RunResult, "durationMs"> = {
      status: runError ? "error" : "ok",
      output,
      error: runError,
      truncated: truncated || undefined,
      stoppedTimers: stoppedTimers || undefined,
    };
    if (!tests) return finish(run);

    phase = "tests";
    const ast = createAstHelpers(program);

    /**
     * Re-run the learner's program with the first top-level declaration of
     * each name initialised to a different value (like the Python harness's
     * `run()`), so tests can check behaviour for many inputs without forcing
     * the learner to write functions yet. Runs in a fresh function scope;
     * its output never reaches the console panel.
     */
    async function runWith(overrides: Record<string, unknown>): Promise<VariantRun> {
      const edits: { start: number; end: number; text: string }[] = [];
      const missing: string[] = [];
      for (const [name, value] of Object.entries(overrides)) {
        const init = findTopLevelInit(program, name);
        if (init) edits.push({ ...init, text: toSourceLiteral(value) });
        else missing.push(name);
      }
      if (missing.length) {
        throw new AssertionFailure(
          `The tests need a top-level declaration for: ${missing.join(", ")}`,
          missing.map((name) => `const ${name} = ...`).join(", "),
          "-",
        );
      }
      let source = options.code;
      for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
        source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
      }
      const variantLogs: string[] = [];
      const variantConsole = createConsole((_stream, args) => {
        if (variantLogs.length < 1_000) variantLogs.push(formatConsoleArgs(args));
      });
      let lookup: ((name: string) => unknown) | undefined;
      const variantHarness = {
        register(getter: (name: string) => unknown) {
          lookup = getter;
        },
      };
      let error: ExecutionError | undefined;
      try {
        // `eval` here is a direct eval inside the worker-only function scope,
        // used to read the learner's bindings by name.
        const fn = new Ctor(
          ...PARAMS,
          `__cl.register(function (__cl_name) { return eval(__cl_name); });${source}\n//# sourceURL=${fileName}`,
        );
        await fn(
          variantConsole,
          timers.setTimeout,
          timers.setInterval,
          timers.clearTimeout,
          timers.clearInterval,
          variantHarness,
        );
      } catch (caught) {
        error = toExecutionError(caught, mapper);
      }
      await delay(0);
      return {
        logs: variantLogs,
        output: variantLogs.join("\n"),
        error,
        value(name: string) {
          if (!lookup) throw new ReferenceError(`${name} is not defined`);
          return lookup(name);
        },
      };
    }

    let functions: Array<(t: JsTestApi) => Promise<void>> = [];
    try {
      functions = getSuite?.() ?? [];
    } catch {
      functions = [];
    }

    const results: TestResult[] = [];
    let index = 0;
    for (const test of tests) {
      if (!validTests.includes(test)) {
        results.push({ id: test.id, status: "error", message: "The test code has a syntax error." });
        continue;
      }
      const fn = functions[index++];
      if (!fn) {
        results.push({ id: test.id, status: "error", message: "The test could not be prepared." });
        continue;
      }
      const api = createTestApi({ code: options.code, ast, logs, capture, runWith });
      try {
        await fn(api);
        results.push({ id: test.id, status: "pass" });
      } catch (error) {
        if (error instanceof AssertionFailure) {
          results.push({
            id: test.id,
            status: "fail",
            expected: error.expected,
            actual: error.actual,
            message: error.message === "Assertion failed" ? undefined : error.message,
          });
        } else if (isErrorLike(error)) {
          results.push({ id: test.id, status: "fail", message: `${error.name}: ${error.message}` });
        } else {
          results.push({ id: test.id, status: "fail", message: `Uncaught ${formatValue(error)}` });
        }
      }
    }
    // Cancel any timers the tests started (e.g. by calling learner functions).
    cancelPending();
    return finish(run, results);
  }

  return { start, reportAsyncError };
}

export function runJavaScript(options: EngineOptions): Promise<EngineResult> {
  return createJavaScriptExecution(options).start();
}
