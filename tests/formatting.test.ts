import { describe, expect, it } from "vitest";
import { clampSizes } from "@/components/workspace/layout-store";
import { parseInline, parseMarkdown } from "@/lib/content/markdown";
import { explainError } from "@/lib/execution/explain";
import { formatConsoleArgs, formatValue } from "@/lib/execution/javascript/format-value";
import { chunksToEntries } from "@/lib/execution/output";
import { en } from "@/lib/i18n/dictionaries/en";
import { fi } from "@/lib/i18n/dictionaries/fi";

describe("markdown subset", () => {
  it("parses paragraphs, code fences, lists and headings", () => {
    const blocks = parseMarkdown("Intro **bold** and `code`.\n\n~~~python\nx = 1\n~~~\n\n- one\n- two\n\n### Title");
    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "code", "list", "heading"]);
    expect(blocks[1]).toEqual({ type: "code", language: "python", value: "x = 1" });
  });

  it("keeps snake_case and code content intact", () => {
    expect(parseInline("Use `first_name` and distance_km here")).toEqual([
      { type: "text", value: "Use " },
      { type: "code", value: "first_name" },
      { type: "text", value: " and distance_km here" },
    ]);
    expect(parseInline("`**not bold**`")).toEqual([{ type: "code", value: "**not bold**" }]);
  });

  it("never produces raw HTML", () => {
    const nodes = parseInline("<img src=x onerror=alert(1)>");
    expect(nodes).toEqual([{ type: "text", value: "<img src=x onerror=alert(1)>" }]);
  });
});

describe("console value formatting", () => {
  it("formats values like devtools", () => {
    expect(formatConsoleArgs(["Hi", 1, true, null, undefined])).toBe("Hi 1 true null undefined");
    expect(formatValue({ name: "Ada", tags: ["x"], "two words": 1 })).toBe('{ name: "Ada", tags: ["x"], "two words": 1 }');
    expect(formatValue(new Map([["a", 1]]))).toBe('Map(1) { "a" => 1 }');
    expect(formatValue([1, , 3])).toBe("[1, <empty>, 3]");
    expect(formatValue(-0)).toBe("-0");
    expect(formatValue(function greet() {})).toBe("[Function: greet]");
  });

  it("handles circular and deeply nested values", () => {
    const value: Record<string, unknown> = { a: 1 };
    value.self = value;
    expect(formatValue(value)).toBe("{ a: 1, self: [Circular] }");
    expect(formatValue({ a: { b: { c: { d: { e: 1 } } } } })).toBe("{ a: { b: { c: { d: [Object] } } } }");
  });

  it("supports printf-style placeholders", () => {
    expect(formatConsoleArgs(["%s scored %d%%", "Ada", 99.5])).toBe("Ada scored 99%");
  });
});

describe("output chunks", () => {
  it("splits streamed text into lines", () => {
    expect(
      chunksToEntries([
        { stream: "stdout", text: "a\nb" },
        { stream: "stdout", text: "c\n" },
        { stream: "stderr", text: "oops" },
      ]),
    ).toEqual([
      { stream: "stdout", text: "a" },
      { stream: "stdout", text: "bc" },
      { stream: "stderr", text: "oops" },
    ]);
  });
});

describe("friendly error explanations", () => {
  it("explains common Python errors in the UI language", () => {
    expect(explainError("python", { kind: "runtime", name: "NameError", message: "name 'totl' is not defined" }, en)).toContain(
      "“totl”",
    );
    expect(explainError("python", { kind: "syntax", name: "IndentationError", message: "", line: 4 }, fi)).toContain("Rivin 4");
  });

  it("explains common JavaScript errors", () => {
    expect(explainError("javascript", { kind: "runtime", name: "TypeError", message: "greet is not a function" }, en)).toContain(
      "“greet” is not a function",
    );
    expect(explainError("javascript", { kind: "timeout", name: "TimeoutError", message: "", timeoutMs: 5000 }, en)).toContain(
      "5 seconds",
    );
  });
});

describe("workspace panel sizes", () => {
  it("keeps panels within limits and leaves room for the editor", () => {
    expect(clampSizes({ left: 5, right: 90 })).toEqual({ left: 20, right: 45 });
    expect(clampSizes({ left: 48, right: 45 })).toEqual({ left: 48, right: 24 });
  });
});
