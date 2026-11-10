// @ts-check
/**
 * Python runner worker (an ES module worker, served as a static file).
 *
 * Pyodide 314+ only runs in *module* workers, while Turbopack bundles
 * `new Worker(new URL(...))` as classic workers. This file is therefore not
 * bundled: it is loaded with `new Worker("/workers/python.worker.mjs",
 * { type: "module" })` and imports the self-hosted Pyodide directly.
 *
 * The evaluation harness (Python source) is sent by the main thread in the
 * `init` message, so the browser and the unit tests use the same harness.
 *
 * Message protocol: lib/execution/python/protocol.ts
 */
import { loadPyodide } from "../vendor/pyodide/pyodide.mjs";

const INDEX_URL = new URL("../vendor/pyodide/", import.meta.url).href;

/** @type {Promise<{ pyodide: any, harness: any }> | null} */
let runtime = null;

/** @param {any} message */
const post = (message) => self.postMessage(message);

/** @param {string} harnessSource */
function load(harnessSource) {
  if (!runtime) {
    runtime = (async () => {
      const pyodide = await loadPyodide({
        indexURL: INDEX_URL,
        // Learner output is captured inside Python by the harness.
        stdout: () => {},
        stderr: () => {},
      });
      pyodide.FS.writeFile("/home/pyodide/koodaamo_harness.py", harnessSource);
      return { pyodide, harness: pyodide.pyimport("koodaamo_harness") };
    })();
    runtime.catch(() => {
      runtime = null;
    });
  }
  return runtime;
}

/**
 * Splits streamed text into one entry per line.
 * @param {(entry: { stream: "stdout" | "stderr", text: string }) => void} onEntry
 */
function createLineBuffer(onEntry) {
  /** @type {Record<string, string>} */
  const buffers = { stdout: "", stderr: "" };
  return {
    /** @param {"stdout" | "stderr"} stream @param {string} text */
    push(stream, text) {
      let buffer = buffers[stream] + text;
      let index = buffer.indexOf("\n");
      while (index >= 0) {
        onEntry({ stream, text: buffer.slice(0, index) });
        buffer = buffer.slice(index + 1);
        index = buffer.indexOf("\n");
      }
      buffers[stream] = buffer;
    },
    flush() {
      for (const stream of /** @type {const} */ (["stdout", "stderr"])) {
        if (buffers[stream]) onEntry({ stream, text: buffers[stream] });
        buffers[stream] = "";
      }
    },
  };
}

/** @param {unknown} error @param {any} pyodide */
function isFatal(error, pyodide) {
  const message = String(/** @type {Error} */ (error)?.message ?? error);
  return (
    message.includes("fatally failed") ||
    message.includes("Maximum call stack") ||
    Boolean(pyodide?._api?.fatal_error_occurred)
  );
}

self.onmessage = async (event) => {
  const request = event.data;
  /** @type {any} */
  let pyodide;
  try {
    if (request.type === "init") {
      await load(request.harness);
      post({ id: request.id, type: "ready" });
      return;
    }
    if (!runtime) throw new Error("The Python runtime has not been initialised.");
    const loaded = await runtime;
    pyodide = loaded.pyodide;

    if (request.type === "run") {
      const buffer = createLineBuffer((entry) => post({ id: request.id, type: "output", entry }));
      const json = loaded.harness.run_program(request.code, (/** @type {string} */ stream, /** @type {string} */ text) =>
        buffer.push(stream === "stderr" ? "stderr" : "stdout", text),
      );
      buffer.flush();
      post({ id: request.id, type: "run-result", report: JSON.parse(json) });
    } else if (request.type === "check") {
      const json = loaded.harness.run_tests(request.code, JSON.stringify(request.tests));
      post({ id: request.id, type: "check-result", report: JSON.parse(json) });
    } else if (request.type === "syntax") {
      post({ id: request.id, type: "syntax-result", error: JSON.parse(loaded.harness.check_syntax(request.code)) });
    }
  } catch (error) {
    post({
      id: request.id,
      type: "failure",
      message: String(/** @type {Error} */ (error)?.message ?? error),
      // Init failures are reported to the UI; they must not trigger automatic restarts.
      fatal: request.type !== "init" && isFatal(error, pyodide),
    });
  }
};
