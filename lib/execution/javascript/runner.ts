import { StatusEmitter } from "../runner-status";
import {
  EXECUTION_LIMITS,
  entryFile,
  finalizeCheck,
  type CheckRequest,
  type CheckResult,
  type CodeRunner,
  type OutputEntry,
  type RunCallbacks,
  type RunRequest,
  type RunResult,
  type TestResult,
} from "../types";
import type { EngineResult } from "./engine";
import type { JsWorkerRequest, JsWorkerResponse } from "./protocol";

/**
 * Runs JavaScript in a fresh dedicated Web Worker per request. The worker is
 * always terminated afterwards — on completion, timeout, abort or crash.
 */
export class JavaScriptRunner implements CodeRunner {
  readonly language = "javascript" as const;
  readonly capabilities = { run: true, check: true, preview: false };
  private readonly status = new StatusEmitter("ready");
  private readonly active = new Set<Worker>();

  prepare(): Promise<void> {
    return Promise.resolve();
  }

  getStatus = () => this.status.get();
  subscribe = (listener: () => void) => this.status.subscribe(listener);

  async run(request: RunRequest, callbacks: RunCallbacks = {}): Promise<RunResult> {
    const file = entryFile(request.files);
    const { run } = await this.execute(
      { mode: "run", code: file.content, fileName: file.name },
      EXECUTION_LIMITS.javascript.runMs,
      callbacks,
    );
    return run;
  }

  async check(request: CheckRequest, callbacks: RunCallbacks = {}): Promise<CheckResult> {
    const file = entryFile(request.files);
    const started = performance.now();
    const { run, tests } = await this.execute(
      { mode: "check", code: file.content, fileName: file.name, tests: request.tests },
      EXECUTION_LIMITS.javascript.checkMs,
      { signal: callbacks.signal },
      request.tests.map((test) => test.id),
    );
    return finalizeCheck(run, tests ?? [], Math.round(performance.now() - started));
  }

  dispose() {
    for (const worker of this.active) worker.terminate();
    this.active.clear();
  }

  private execute(
    message: JsWorkerRequest,
    timeoutMs: number,
    callbacks: RunCallbacks,
    testIds: string[] = [],
  ): Promise<EngineResult> {
    return new Promise<EngineResult>((resolve) => {
      const started = performance.now();
      const streamed: OutputEntry[] = [];
      const skipped = (): TestResult[] => testIds.map((id) => ({ id, status: "skipped" }));
      let worker: Worker;
      try {
        worker = new Worker(new URL("./js.worker.ts", import.meta.url), {
          type: "module",
          name: "koodaamo-javascript",
        });
      } catch (error) {
        resolve({
          run: {
            status: "error",
            output: [],
            durationMs: 0,
            error: { kind: "internal", name: "WorkerError", message: String(error) },
          },
          tests: skipped(),
        });
        return;
      }
      this.active.add(worker);

      let settled = false;
      const finish = (result: EngineResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        callbacks.signal?.removeEventListener("abort", onAbort);
        worker.terminate();
        this.active.delete(worker);
        resolve(result);
      };
      const failure = (kind: "timeout" | "internal", name: string, text: string): EngineResult => ({
        run: {
          status: "error",
          output: streamed,
          durationMs: Math.round(performance.now() - started),
          error: { kind, name, message: text, timeoutMs: kind === "timeout" ? timeoutMs : undefined },
        },
        tests: skipped(),
      });

      const timer = setTimeout(
        () => finish(failure("timeout", "TimeoutError", `Execution exceeded ${timeoutMs} ms.`)),
        timeoutMs,
      );
      const onAbort = () => finish(failure("internal", "AbortError", "The run was cancelled."));
      callbacks.signal?.addEventListener("abort", onAbort, { once: true });

      worker.onmessage = (event: MessageEvent<JsWorkerResponse>) => {
        const data = event.data;
        if (data.type === "output") {
          streamed.push(data.entry);
          callbacks.onOutput?.(data.entry);
        } else if (data.type === "result") {
          finish(data.result);
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        finish(failure("internal", "WorkerError", event.message || "The JavaScript worker crashed."));
      };
      worker.onmessageerror = () => finish(failure("internal", "WorkerError", "Could not read the worker's response."));
      worker.postMessage(message);
    });
  }
}
