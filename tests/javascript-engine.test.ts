import { describe, expect, it } from "vitest";
import { runJavaScript } from "@/lib/execution/javascript/engine";
import { isolatedAsyncFunction } from "./helpers/js-realm";

const run = (code: string, tests?: { id: string; code: string }[]) =>
  runJavaScript({ code, tests, AsyncFunction: isolatedAsyncFunction(), settleMs: 300 });

describe("JavaScript engine: running code", () => {
  it("captures console output with devtools-like formatting", async () => {
    const { run: result } = await run(
      'console.log("Hello", 42, { a: [1, "x"] });\nconsole.warn("careful");\nconsole.log("%s is %d", "Ada", 36.6);',
    );
    expect(result.status).toBe("ok");
    expect(result.output).toEqual([
      { stream: "log", text: 'Hello 42 { a: [1, "x"] }' },
      { stream: "warn", text: "careful" },
      { stream: "log", text: "Ada is 36" },
    ]);
  });

  it("reports syntax errors with the learner's line and column", async () => {
    const { run: result, tests } = await run('const a = 1;\nconsole.log("x"\n', [{ id: "t1", code: "t.ok(true)" }]);
    expect(result.status).toBe("error");
    expect(result.error?.kind).toBe("syntax");
    expect(result.error?.line).toBe(3);
    expect(tests).toEqual([{ id: "t1", status: "skipped" }]);
  });

  it("maps runtime error lines to the learner's file", async () => {
    const { run: result } = await run("const a = 1;\n\nconsole.log(missingName);\n");
    expect(result.error).toMatchObject({ kind: "runtime", name: "ReferenceError", line: 3 });
    expect(result.error?.message).toContain("missingName");
  });

  it("waits for timers and promises before finishing", async () => {
    const { run: result } = await run(
      'setTimeout(() => console.log("later"), 20);\nPromise.resolve().then(() => console.log("micro"));\nconsole.log("now");',
    );
    expect(result.output.map((entry) => entry.text)).toEqual(["now", "micro", "later"]);
  });

  it("supports top-level await", async () => {
    const { run: result } = await run(
      "const value = await new Promise((resolve) => setTimeout(() => resolve(5), 5));\nconsole.log(value * 2);",
    );
    expect(result.output.map((entry) => entry.text)).toEqual(["10"]);
  });

  it("cancels intervals that never stop", async () => {
    const { run: result } = await run('setInterval(() => {}, 50);\nconsole.log("started");');
    expect(result.status).toBe("ok");
    expect(result.stoppedTimers).toBe(1);
  });

  it("reports errors thrown inside timer callbacks", async () => {
    const { run: result } = await run('setTimeout(() => { throw new TypeError("boom"); }, 1);');
    expect(result.error).toMatchObject({ kind: "runtime", name: "TypeError", message: "boom" });
  });

  it("truncates excessive output", async () => {
    const { run: result } = await runJavaScript({
      code: 'for (let i = 0; i < 5000; i++) console.log("line " + i);',
      AsyncFunction: isolatedAsyncFunction(),
      maxOutputChars: 1000,
    });
    expect(result.truncated).toBe(true);
    expect(result.output.length).toBeLessThan(200);
  });
});

describe("JavaScript engine: tests", () => {
  it("lets tests call the learner's functions and reports expected/actual", async () => {
    const code = "function greet(name) {\n  return `Hello ${name}`;\n}\n";
    const { tests } = await run(code, [
      { id: "fn", code: 't.isType(greet, "function");' },
      { id: "value", code: 't.equal(greet("Ada"), "Hello, Ada!");' },
    ]);
    expect(tests?.[0]).toEqual({ id: "fn", status: "pass" });
    expect(tests?.[1]).toMatchObject({
      id: "value",
      status: "fail",
      expected: '"Hello, Ada!"',
      actual: '"Hello Ada"',
    });
  });

  it("still runs tests when the program throws after defining things", async () => {
    const code = 'function double(n) { return n * 2; }\nnotDefined();\n';
    const { run: result, tests } = await run(code, [{ id: "double", code: "t.equal(double(4), 8);" }]);
    expect(result.status).toBe("error");
    expect(tests).toEqual([{ id: "double", status: "pass" }]);
  });

  it("fails tests that reference missing declarations", async () => {
    const { tests } = await run("const x = 1;", [{ id: "missing", code: "t.equal(greet(), 1);" }]);
    expect(tests?.[0].status).toBe("fail");
    expect(tests?.[0].message).toMatch(/ReferenceError/);
  });

  it("exposes console logs and structural helpers", async () => {
    const code = 'const learnerName = "Aino";\nconsole.log(`Hi ${learnerName}`);\nif (learnerName) {}\n';
    const { tests } = await run(code, [
      { id: "logged", code: 't.logged("Hi Aino");' },
      { id: "const", code: 't.equal(t.ast.declarationKind("learnerName"), "const");' },
      { id: "if", code: 't.ok(t.ast.has("IfStatement"));' },
      { id: "calls", code: 't.ok(t.ast.calls("console.log"));' },
    ]);
    expect(tests?.every((test) => test.status === "pass")).toBe(true);
  });

  it("captures logs from function calls without printing them", async () => {
    const code = 'function shout(text) { console.log(text.toUpperCase()); }\n';
    const { run: result, tests } = await run(code, [
      { id: "capture", code: 'const { logs } = t.capture(() => shout("hey"));\nt.deepEqual(logs, ["HEY"]);' },
    ]);
    expect(tests?.[0].status).toBe("pass");
    expect(result.output).toEqual([]);
  });

  it("marks broken test definitions as errors without affecting others", async () => {
    const { tests } = await run("const a = 1;", [
      { id: "broken", code: "t.ok(" },
      { id: "fine", code: "t.equal(a, 1);" },
    ]);
    expect(tests).toEqual([
      { id: "broken", status: "error", message: "The test code has a syntax error." },
      { id: "fine", status: "pass" },
    ]);
  });

  it("re-runs the program with replaced top-level values (runWith)", async () => {
    const code = 'const age = 17;\nconst isAdult = age >= 18;\nconsole.log(isAdult ? "adult" : "minor");\n';
    const { run: result, tests } = await run(code, [
      {
        id: "variant",
        code: 'const r = await t.runWith({ age: 18 });\nt.equal(r.value("isAdult"), true);\nt.deepEqual(r.logs, ["adult"]);',
      },
      { id: "original-unchanged", code: "t.equal(isAdult, false);" },
      { id: "missing", code: "await t.runWith({ nope: 1 });" },
      { id: "objects", code: 'const r = await t.runWith({ age: 40 });\nt.equal(r.value("age"), 40);' },
    ]);
    expect(result.output).toEqual([{ stream: "log", text: "minor" }]);
    expect(tests?.map((test) => test.status)).toEqual(["pass", "pass", "fail", "pass"]);
    expect(tests?.[2].message).toContain("top-level declaration for: nope");
  });

  it("reports errors and missing bindings from runWith variants", async () => {
    const code = "const items = [1, 2];\nconst first = items[0].toFixed(1);\n";
    const { tests } = await run(code, [
      { id: "error", code: 'const r = await t.runWith({ items: [] });\nt.ok(r.error);\nt.equal(r.error.name, "TypeError");' },
      { id: "binding", code: 'const r = await t.runWith({ items: [5] });\nt.equal(r.value("first"), "5.0");' },
      { id: "unknown", code: 'const r = await t.runWith({ items: [5] });\nr.value("nothing");' },
    ]);
    expect(tests?.map((test) => test.status)).toEqual(["pass", "pass", "fail"]);
  });

  it("does not leak sloppy-mode globals between runs", async () => {
    await run('leaked = "yes";');
    const { tests } = await run("const a = 1;", [{ id: "leak", code: 't.equal(typeof leaked, "undefined");' }]);
    expect(tests?.[0].status).toBe("pass");
  });
});
