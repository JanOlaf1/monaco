import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import type { ExecutionError, RunnerLanguage } from "./types";

/**
 * Turn a raw runtime error into a short, beginner-friendly explanation in the
 * UI language. The raw message stays visible too, because learning to read
 * real error messages is part of learning to program.
 */
export function explainError(
  language: RunnerLanguage,
  error: ExecutionError,
  dict: Dictionary,
): string {
  const runtime = dict.workspace.runtime;
  if (error.kind === "timeout") {
    return format(runtime.timeout, { seconds: Math.round((error.timeoutMs ?? 5000) / 1000) });
  }
  if (error.kind === "internal") return runtime.internal;

  const line = error.line ?? "?";
  if (language === "python") {
    const py = dict.errors.python;
    switch (error.name) {
      case "SyntaxError":
        return format(py.SyntaxError, { line });
      case "IndentationError":
      case "TabError":
        return format(py.IndentationError, { line });
      case "NameError":
      case "UnboundLocalError": {
        const name = /name '([^']+)'/.exec(error.message)?.[1];
        return name ? format(py.NameErrorNamed, { name }) : py.NameError;
      }
      case "TypeError":
        return py.TypeError;
      case "ValueError":
        return py.ValueError;
      case "ZeroDivisionError":
        return py.ZeroDivisionError;
      case "AttributeError":
        return py.AttributeError;
      case "IndexError":
        return py.IndexError;
      case "KeyError":
        return py.KeyError;
      case "EOFError":
        return py.EOFError;
      case "RecursionError":
        return py.RecursionError;
      default:
        return py.generic;
    }
  }

  const js = dict.errors.javascript;
  switch (error.name) {
    case "SyntaxError":
      return format(js.SyntaxError, { line });
    case "ReferenceError": {
      const name = /^(\S+) is not defined/.exec(error.message)?.[1];
      return name ? format(js.ReferenceErrorNamed, { name }) : js.ReferenceError;
    }
    case "TypeError": {
      const name = /^(\S+) is not a function/.exec(error.message)?.[1];
      return name ? format(js.TypeErrorNotFunction, { name }) : js.TypeError;
    }
    case "RangeError":
      return js.RangeError;
    default:
      return js.generic;
  }
}
