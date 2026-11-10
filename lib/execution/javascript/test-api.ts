import type { AstHelpers } from "./ast-helpers";
import { formatValue } from "./format-value";

/** Thrown by assertions; carries formatted expected/actual values for the UI. */
export class AssertionFailure extends Error {
  readonly expected?: string;
  readonly actual?: string;

  constructor(message: string, expected?: string, actual?: string) {
    super(message || "Assertion failed");
    this.name = "AssertionFailure";
    this.expected = expected;
    this.actual = actual;
  }
}

export type ValueType =
  | "string"
  | "number"
  | "boolean"
  | "function"
  | "object"
  | "array"
  | "undefined"
  | "bigint"
  | "symbol";

/**
 * The `t` object available inside JavaScript test definitions.
 * Test code runs in the same scope as the learner's code, so it can call
 * their functions directly, e.g. `t.equal(greet("Ada"), "Hello, Ada!")`.
 */
export interface JsTestApi {
  /** The learner's source code. */
  readonly code: string;
  /** Structural helpers over the parsed code. */
  readonly ast: AstHelpers;
  /** Console lines printed while the program ran. */
  readonly logs: readonly string[];
  /** `logs` joined with newlines. */
  readonly output: string;
  ok(value: unknown, message?: string): void;
  equal(actual: unknown, expected: unknown, message?: string): void;
  notEqual(actual: unknown, expected: unknown, message?: string): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  closeTo(actual: unknown, expected: number, tolerance?: number, message?: string): void;
  isType(value: unknown, type: ValueType, message?: string): void;
  includes(container: string | readonly unknown[], item: unknown, message?: string): void;
  /** The program printed exactly this line (one console.log call). */
  logged(line: string, message?: string): void;
  fail(message?: string): never;
  /** Run `fn` and collect what it logs, without showing it in the console. */
  capture<T>(fn: () => T): { result: T; logs: string[] };
  /**
   * Re-run the whole program with the first top-level declaration of each
   * name initialised to a different value, e.g.
   * `const run = await t.runWith({ age: 18 }); t.equal(run.value("isAdult"), true);`
   */
  runWith(overrides: Record<string, unknown>): Promise<VariantRun>;
}

/** Result of `t.runWith()`. */
export interface VariantRun {
  /** Console lines printed by the re-run. */
  logs: string[];
  output: string;
  /** Set when the re-run threw. */
  error?: { name: string; message: string };
  /** Read a top-level binding of the re-run by name. Throws if it doesn't exist. */
  value(name: string): unknown;
}

function typeOf(value: unknown): ValueType {
  if (Array.isArray(value)) return "array";
  if (value === null) return "object";
  return typeof value as ValueType;
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  return typeOf(value);
}

export function deepEqual(a: unknown, b: unknown, seen = new WeakMap<object, object>()): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key), seen)) return false;
    }
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    for (const value of a) if (!b.has(value)) return false;
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], seen),
  );
}

export function createTestApi(context: {
  code: string;
  ast: AstHelpers;
  logs: readonly string[];
  capture: <T>(fn: () => T) => { result: T; logs: string[] };
  runWith: (overrides: Record<string, unknown>) => Promise<VariantRun>;
}): JsTestApi {
  const fail = (message = "", expected?: string, actual?: string): never => {
    throw new AssertionFailure(message, expected, actual);
  };

  return {
    code: context.code,
    ast: context.ast,
    logs: context.logs,
    output: context.logs.join("\n"),
    ok(value, message) {
      if (!value) fail(message ?? "", "truthy value", formatValue(value));
    },
    equal(actual, expected, message) {
      if (!Object.is(actual, expected) && !(actual === 0 && expected === 0)) {
        fail(message ?? "", formatValue(expected), formatValue(actual));
      }
    },
    notEqual(actual, expected, message) {
      if (Object.is(actual, expected)) fail(message ?? "", `not ${formatValue(expected)}`, formatValue(actual));
    },
    deepEqual(actual, expected, message) {
      if (!deepEqual(actual, expected)) fail(message ?? "", formatValue(expected), formatValue(actual));
    },
    closeTo(actual, expected, tolerance = 1e-9, message) {
      if (typeof actual !== "number" || Number.isNaN(actual) || Math.abs(actual - expected) > tolerance) {
        fail(message ?? "", formatValue(expected), formatValue(actual));
      }
    },
    isType(value, type, message) {
      const actualType = typeOf(value);
      const matches = type === "object" ? actualType === "object" && value !== null : actualType === type;
      if (!matches) fail(message ?? "", type, describeType(value));
    },
    includes(container, item, message) {
      const found =
        typeof container === "string"
          ? typeof item === "string" && container.includes(item)
          : Array.isArray(container) && container.some((entry) => deepEqual(entry, item));
      if (!found) fail(message ?? "", formatValue(item), formatValue(container));
    },
    logged(line, message) {
      if (!context.logs.includes(line)) {
        fail(message ?? "", line, context.logs.length ? context.logs.join("\n") : "-");
      }
    },
    fail: (message) => fail(message ?? ""),
    capture: context.capture,
    runWith: context.runWith,
  };
}
