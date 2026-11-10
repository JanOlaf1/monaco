import { loadPyodide, type PyodideAPI } from "pyodide";
import { PYTHON_HARNESS } from "@/lib/execution/python/harness";
import type { PyCheckReport, PyRunReport } from "@/lib/execution/python/protocol";

export interface PythonHarness {
  pyodide: PyodideAPI;
  runTests(source: string, tests: { id: string; code: string }[]): PyCheckReport;
  runProgram(source: string): PyRunReport;
  checkSyntax(source: string): unknown;
}

let instance: Promise<PythonHarness> | null = null;

/** Loads Pyodide in Node with the same harness the browser worker uses. */
export function loadHarness(): Promise<PythonHarness> {
  instance ??= (async () => {
    const pyodide = await loadPyodide({ stdout: () => {}, stderr: () => {} });
    pyodide.FS.writeFile("/home/pyodide/koodaamo_harness.py", PYTHON_HARNESS);
    const harness = pyodide.pyimport("koodaamo_harness") as unknown as {
      run_tests(source: string, tests: string): string;
      run_program(source: string): string;
      check_syntax(source: string): string;
    };
    return {
      pyodide,
      runTests: (source, tests) => JSON.parse(harness.run_tests(source, JSON.stringify(tests))),
      runProgram: (source) => JSON.parse(harness.run_program(source)),
      checkSyntax: (source) => JSON.parse(harness.check_syntax(source)),
    };
  })();
  return instance;
}
