import { chunksToEntries } from "../output";
import { StatusEmitter } from "../runner-status";
import {
  EXECUTION_LIMITS,
  entryFile,
  finalizeCheck,
  type CheckRequest,
  type CheckResult,
  type CodeRunner,
  type ExecutionError,
  type OutputEntry,
  type RunCallbacks,
  type RunRequest,
  type RunResult,
} from "../types";
import { PYTHON_HARNESS } from "./harness";
import type { PyWorkerRequest, PyWorkerResponse } from "./protocol";

/**
 * Static ES module worker (see public/workers/python.worker.mjs). It is not
 * bundled because Pyodide requires a module worker and Turbopack emits
 * classic workers.
 */
const WORKER_URL = "/workers/python.worker.mjs";

type Outcome =
  | { kind: "message"; message: PyWorkerResponse }
  | { kind: "timeout" }
  | { kind: "aborted" }
  | { kind: "crash"; message: string };

type Pending = {
  resolve: (outcome: Outcome) => void;
  onOutput?: (entry: OutputEntry) => void;
};

type RawError = Omit<ExecutionError, "line" | "column" | "traceback"> & {
  line?: number | null;
  column?: number | null;
  traceback?: string | null;
};

function normalizeError(error: RawError | null | undefined): ExecutionError | undefined {
  if (!error) return undefined;
  return {
    kind: error.kind,
    name: error.name,
    message: error.message,
    line: error.line ?? undefined,
    column: error.column ?? undefined,
    traceback: error.traceback ?? undefined,
  };
}

/**
 * Runs Python through Pyodide in a persistent worker. Requests are processed
 * one at a time. A timeout or fatal interpreter error terminates the worker;
 * a new one is started in the background so the next run is ready sooner.
 *
 * The time limit starts after the runtime is loaded, so the first (slow)
 * Pyodide download never counts against the learner's code.
 */
export class PythonRunner implements CodeRunner {
  readonly language = "python" as const;
  readonly capabilities = { run: true, check: true, preview: false };
  private readonly status = new StatusEmitter("idle");
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private readonly pending = new Map<number, Pending>();
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();

  getStatus = () => this.status.get();
  subscribe = (listener: () => void) => this.status.subscribe(listener);

  prepare(): Promise<void> {
    return this.ensureReady();
  }

  run(request: RunRequest, callbacks: RunCallbacks = {}): Promise<RunResult> {
    return this.enqueue(async () => {
      const code = entryFile(request.files).content;
      const loadError = await this.load();
      if (loadError) return loadError;
      const started = performance.now();
      const streamed: OutputEntry[] = [];
      const outcome = await this.send(
        { id: this.nextId++, type: "run", code },
        EXECUTION_LIMITS.python.runMs,
        callbacks.signal,
        (entry) => {
          streamed.push(entry);
          callbacks.onOutput?.(entry);
        },
      );
      const durationMs = Math.round(performance.now() - started);
      if (outcome.kind === "message" && outcome.message.type === "run-result") {
        const error = normalizeError(outcome.message.report.error);
        return {
          status: error ? "error" : "ok",
          output: streamed,
          error,
          truncated: outcome.message.report.truncated || undefined,
          durationMs,
        };
      }
      return this.failureResult(outcome, streamed, durationMs, EXECUTION_LIMITS.python.runMs);
    });
  }

  check(request: CheckRequest, callbacks: RunCallbacks = {}): Promise<CheckResult> {
    return this.enqueue(async () => {
      const code = entryFile(request.files).content;
      const skipped = request.tests.map((test) => ({ id: test.id, status: "skipped" as const }));
      const loadError = await this.load();
      if (loadError) return finalizeCheck(loadError, skipped, 0);
      const started = performance.now();
      const outcome = await this.send(
        { id: this.nextId++, type: "check", code, tests: request.tests },
        EXECUTION_LIMITS.python.checkMs,
        callbacks.signal,
      );
      const durationMs = Math.round(performance.now() - started);
      if (outcome.kind === "message" && outcome.message.type === "check-result") {
        const { run, tests } = outcome.message.report;
        const error = normalizeError(run.error);
        const result: RunResult = {
          status: error ? "error" : "ok",
          output: chunksToEntries(run.output),
          error,
          truncated: run.truncated || undefined,
          durationMs,
        };
        return finalizeCheck(result, tests, durationMs);
      }
      return finalizeCheck(
        this.failureResult(outcome, [], durationMs, EXECUTION_LIMITS.python.checkMs),
        skipped,
        durationMs,
      );
    });
  }

  dispose() {
    this.teardown("disposed");
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task, task);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async load(): Promise<RunResult | null> {
    try {
      await this.ensureReady();
      return null;
    } catch (error) {
      return {
        status: "error",
        output: [],
        durationMs: 0,
        error: { kind: "internal", name: "RuntimeLoadError", message: String((error as Error)?.message ?? error) },
      };
    }
  }

  private failureResult(outcome: Outcome, output: OutputEntry[], durationMs: number, limitMs: number): RunResult {
    let error: ExecutionError;
    if (outcome.kind === "timeout") {
      error = { kind: "timeout", name: "TimeoutError", message: `Execution exceeded ${limitMs} ms.`, timeoutMs: limitMs };
    } else if (outcome.kind === "aborted") {
      error = { kind: "internal", name: "AbortError", message: "The run was cancelled." };
    } else if (outcome.kind === "crash") {
      error = { kind: "internal", name: "WorkerError", message: outcome.message };
    } else {
      const message = outcome.message.type === "failure" ? outcome.message.message : "Unexpected response.";
      error = { kind: "internal", name: "RunnerError", message };
    }
    return { status: "error", output, error, durationMs };
  }

  private ensureReady(): Promise<void> {
    if (this.ready) return this.ready;
    this.status.set("loading");
    let worker: Worker;
    try {
      worker = new Worker(WORKER_URL, { type: "module", name: "koodaamo-python" });
    } catch (error) {
      this.status.set("error");
      return Promise.reject(error);
    }
    this.worker = worker;
    worker.onmessage = (event: MessageEvent<PyWorkerResponse>) => this.handleMessage(event.data);
    worker.onerror = (event) => {
      event.preventDefault();
      this.teardown(event.message || "The Python worker crashed.");
    };

    const ready = this.send({ id: this.nextId++, type: "init", harness: PYTHON_HARNESS }, null).then((outcome) => {
      if (outcome.kind === "message" && outcome.message.type === "ready") {
        this.status.set("ready");
        return;
      }
      const message =
        outcome.kind === "message" && outcome.message.type === "failure"
          ? outcome.message.message
          : outcome.kind === "crash"
            ? outcome.message
            : "The Python runtime could not be started.";
      throw new Error(message);
    });
    this.ready = ready;
    ready.catch((error) => {
      console.error("[python] The runtime could not be started:", error);
      // Ignore failures of a worker that has already been replaced. Never
      // restart automatically here, or a broken runtime would loop forever.
      if (this.ready === ready || this.ready === null) {
        this.teardown("init failed");
        this.status.set("error");
      }
    });
    return ready;
  }

  private send(
    request: PyWorkerRequest,
    timeoutMs: number | null,
    signal?: AbortSignal,
    onOutput?: (entry: OutputEntry) => void,
  ): Promise<Outcome> {
    const worker = this.worker;
    if (!worker) return Promise.resolve({ kind: "crash", message: "The Python worker is not running." });
    return new Promise<Outcome>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const done = (outcome: Outcome) => {
        if (timer) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        this.pending.delete(request.id);
        resolve(outcome);
      };
      const onAbort = () => {
        done({ kind: "aborted" });
        this.restart();
      };
      this.pending.set(request.id, { resolve: done, onOutput });
      if (timeoutMs !== null) {
        timer = setTimeout(() => {
          done({ kind: "timeout" });
          // Python code cannot be interrupted without cross-origin isolation,
          // so stop the whole interpreter and start a fresh one.
          this.restart();
        }, timeoutMs);
      }
      signal?.addEventListener("abort", onAbort, { once: true });
      worker.postMessage(request);
    });
  }

  private handleMessage(message: PyWorkerResponse) {
    const pending = this.pending.get(message.id);
    if (!pending) return;
    if (message.type === "output") {
      pending.onOutput?.(message.entry);
      return;
    }
    pending.resolve({ kind: "message", message });
    // A fatal interpreter error during a run: replace the worker. (Init
    // failures are never marked fatal by the worker.)
    if (message.type === "failure" && message.fatal && this.status.get() === "ready") this.restart();
  }

  private restart() {
    this.teardown("restarting");
    void this.ensureReady().catch(() => undefined);
  }

  private teardown(reason: string) {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.status.set("idle");
    for (const pending of [...this.pending.values()]) {
      pending.resolve({ kind: "crash", message: `The Python worker stopped (${reason}).` });
    }
    this.pending.clear();
  }
}
