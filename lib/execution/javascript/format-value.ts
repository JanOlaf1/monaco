/**
 * Formats JavaScript values for console output and test details, similar to
 * what browser devtools print, e.g. `{ name: "Ada", tags: ["a", "b"] }`.
 */

const MAX_DEPTH = 3;
const MAX_ITEMS = 50;
const MAX_STRING = 10_000;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function quote(value: string): string {
  return JSON.stringify(value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value);
}

function formatKey(key: string | symbol): string {
  if (typeof key === "symbol") return `[${key.toString()}]`;
  return IDENTIFIER.test(key) ? key : quote(key);
}

function constructorName(value: object): string | undefined {
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return "[Object: null prototype]";
  const name = proto?.constructor?.name;
  return typeof name === "string" && name !== "Object" ? name : undefined;
}

function formatNumber(value: number): string {
  return Object.is(value, -0) ? "-0" : String(value);
}

function inner(value: unknown, depth: number, seen: Set<object>): string {
  switch (typeof value) {
    case "string":
      return quote(value);
    case "number":
      return formatNumber(value);
    case "bigint":
      return `${value}n`;
    case "boolean":
      return String(value);
    case "undefined":
      return "undefined";
    case "symbol":
      return value.toString();
    case "function": {
      const source = Function.prototype.toString.call(value);
      if (source.startsWith("class ")) return `[class ${value.name || "(anonymous)"}]`;
      return value.name ? `[Function: ${value.name}]` : "[Function (anonymous)]";
    }
  }
  if (value === null) return "null";
  const object = value as object;
  if (seen.has(object)) return "[Circular]";

  if (object instanceof Error) return `${object.name}: ${object.message}`;
  if (object instanceof Date) return Number.isNaN(object.getTime()) ? "Invalid Date" : object.toISOString();
  if (object instanceof RegExp) return object.toString();
  if (object instanceof Promise) return "Promise { … }";
  if (object instanceof WeakMap) return "WeakMap { … }";
  if (object instanceof WeakSet) return "WeakSet { … }";

  if (depth > MAX_DEPTH) {
    if (Array.isArray(object)) return "[Array]";
    return `[${constructorName(object) ?? "Object"}]`;
  }

  seen.add(object);
  try {
    if (Array.isArray(object)) {
      if (object.length === 0) return "[]";
      const items: string[] = [];
      const limit = Math.min(object.length, MAX_ITEMS);
      for (let i = 0; i < limit; i++) {
        items.push(i in object ? inner(object[i], depth + 1, seen) : "<empty>");
      }
      if (object.length > MAX_ITEMS) items.push(`… ${object.length - MAX_ITEMS} more items`);
      return `[${items.join(", ")}]`;
    }

    if (object instanceof Map) {
      const entries = [...object.entries()]
        .slice(0, MAX_ITEMS)
        .map(([k, v]) => `${inner(k, depth + 1, seen)} => ${inner(v, depth + 1, seen)}`);
      return entries.length ? `Map(${object.size}) { ${entries.join(", ")} }` : `Map(0) {}`;
    }

    if (object instanceof Set) {
      const entries = [...object.values()].slice(0, MAX_ITEMS).map((v) => inner(v, depth + 1, seen));
      return entries.length ? `Set(${object.size}) { ${entries.join(", ")} }` : `Set(0) {}`;
    }

    const prefix = constructorName(object);
    const keys = Reflect.ownKeys(object).filter((key) =>
      Object.prototype.propertyIsEnumerable.call(object, key),
    );
    if (keys.length === 0) return prefix ? `${prefix} {}` : "{}";
    const parts = keys.slice(0, MAX_ITEMS).map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(object, key);
      const rendered =
        descriptor && "value" in descriptor ? inner(descriptor.value, depth + 1, seen) : "[Getter/Setter]";
      return `${formatKey(key)}: ${rendered}`;
    });
    if (keys.length > MAX_ITEMS) parts.push(`… ${keys.length - MAX_ITEMS} more properties`);
    return `${prefix ? `${prefix} ` : ""}{ ${parts.join(", ")} }`;
  } catch {
    return "[Object]";
  } finally {
    seen.delete(object);
  }
}

/** Format a value the way it appears inside other values (strings quoted). */
export function formatValue(value: unknown): string {
  return inner(value, 0, new Set());
}

/**
 * Format console.log arguments: top-level strings print without quotes and
 * basic printf-style placeholders (%s %d %i %f %o %O %%) are supported.
 */
export function formatConsoleArgs(args: unknown[]): string {
  if (args.length === 0) return "";
  const rest = [...args];
  const parts: string[] = [];
  if (typeof rest[0] === "string" && /%[sdifoOc%]/.test(rest[0])) {
    const template = rest.shift() as string;
    const head = template.replace(/%([sdifoOc%])/g, (match, type: string) => {
      if (type === "%") return "%";
      if (rest.length === 0) return match;
      const arg = rest.shift();
      switch (type) {
        case "s":
          return typeof arg === "string" ? arg : formatValue(arg);
        case "d":
        case "i":
          return typeof arg === "bigint" ? `${arg}n` : formatNumber(Math.trunc(Number(arg)));
        case "f":
          return formatNumber(Number(arg));
        case "c":
          return "";
        default:
          return formatValue(arg);
      }
    });
    parts.push(head);
  }
  for (const arg of rest) parts.push(typeof arg === "string" ? arg : formatValue(arg));
  return parts.join(" ");
}
