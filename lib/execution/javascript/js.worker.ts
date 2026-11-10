/// <reference lib="webworker" />
/**
 * Dedicated worker that executes ONE JavaScript run or check, then is
 * terminated by the main thread. A fresh worker per run means learner code
 * never shares globals with previous runs and infinite loops can be stopped
 * with `worker.terminate()`.
 *
 * Security note: a same-origin worker has no DOM, cookies-by-script or
 * localStorage access, but it is not a hardened sandbox. Network and storage
 * APIs are removed below as a best-effort measure. See docs/ARCHITECTURE.md.
 */
import { createJavaScriptExecution } from "./engine";
import type { JsWorkerRequest, JsWorkerResponse } from "./protocol";

declare const self: DedicatedWorkerGlobalScope;

const post = self.postMessage.bind(self) as (message: JsWorkerResponse) => void;

function lockDown() {
  const blocked = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "WebSocketStream",
    "EventSource",
    "importScripts",
    "indexedDB",
    "caches",
    "BroadcastChannel",
    "Worker",
    "SharedWorker",
    "WebTransport",
  ];
  for (const name of blocked) {
    try {
      Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false });
    } catch {
      // Some properties may be non-configurable in certain browsers.
    }
  }
  // Learner code must not be able to impersonate the runner's messages.
  try {
    Object.defineProperty(self, "postMessage", { value: () => {}, configurable: false, writable: false });
  } catch {
    // ignore
  }
}

self.onmessage = async (event: MessageEvent<JsWorkerRequest>) => {
  self.onmessage = null;
  const request = event.data;
  const execution = createJavaScriptExecution({
    code: request.code,
    fileName: request.fileName,
    tests: request.mode === "check" ? (request.tests ?? []) : undefined,
    onOutput: request.mode === "run" ? (entry) => post({ type: "output", entry }) : undefined,
  });
  self.addEventListener("unhandledrejection", (rejection) => {
    rejection.preventDefault();
    execution.reportAsyncError(rejection.reason);
  });
  self.addEventListener("error", (errorEvent) => {
    errorEvent.preventDefault();
    execution.reportAsyncError(errorEvent.error ?? new Error(errorEvent.message));
  });
  lockDown();
  const result = await execution.start();
  post({ type: "result", result });
};
