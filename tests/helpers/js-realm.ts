import vm from "node:vm";

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

/**
 * A fresh V8 realm per call, so learner code in tests cannot leak globals into
 * the test process (in the browser, each run gets a fresh Web Worker instead).
 */
export function isolatedAsyncFunction(): AsyncFunctionConstructor {
  const context = vm.createContext({});
  return vm.runInContext("(async function () {}).constructor", context) as AsyncFunctionConstructor;
}
