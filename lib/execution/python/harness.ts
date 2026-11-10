/**
 * Python source of the evaluation harness, loaded into Pyodide as the module
 * `koodaamo_harness`. Kept as a string so it is versioned with the worker.
 *
 * Public entry points (called from the worker):
 *   run_program(source, emit) -> JSON  {error, truncated}
 *   run_tests(source, tests_json) -> JSON {run: {error, output, truncated}, tests: [...]}
 *   check_syntax(source) -> JSON error | "null"
 *
 * Test snippets (`TestDefinition.code`) run with these names available:
 *   code, tree, result, output, lines, ns, ast, math, re
 *   var(name, execution=None)          value of a top-level variable (fails if missing)
 *   has_var(name, execution=None)      True if the variable exists
 *   run(**values)                      re-run the program with the FIRST top-level
 *                                      assignment of each name replaced by a value;
 *                                      returns an Execution (.var(), .lines, .stdout, .error)
 *   find_nodes(*ast_types)             AST nodes of the given types
 *   calls(name)                        True if the code calls `name(...)` or `x.name(...)`
 *   numbers_in(text)                   numbers found in a string
 *   expect(cond, message="", expected=..., actual=...)
 *   expect_equal(actual, expected)
 *   expect_close(actual, expected, tolerance=1e-6)
 *   expect_type(value, *types)
 *   expect_line(text, execution=None)  output contains this exact line
 *   expect_number_in_output(value, execution=None)
 *   expect_no_error(execution=None)
 *
 * Written with String.raw so Python escape sequences are preserved; it must
 * not contain backticks or "${".
 */
export const PYTHON_HARNESS = String.raw`
"""Koodaamo evaluation harness. Runs learner code and evaluates tests."""
import ast
import builtins
import contextlib
import io
import json
import linecache
import math
import re
import traceback

STUDENT_FILE = "main.py"
MAX_CAPTURE_CHARS = 200_000
_BLOCKED_MODULES = {"js", "pyodide", "pyodide_js", "micropip", "_pyodide"}
_MISSING = object()
_BUILTINS_SNAPSHOT = dict(builtins.__dict__)
_real_import = builtins.__import__


class _Text(str):
    """A string shown as-is (without quotes) in expected/actual details."""

    def __repr__(self):
        return str(self)


class ExpectationError(AssertionError):
    def __init__(self, message="", expected=_MISSING, actual=_MISSING):
        super().__init__(message)
        self.message = message
        self.expected = expected
        self.actual = actual

    def details(self):
        result = {}
        if self.message:
            result["message"] = self.message
        if self.expected is not _MISSING:
            result["expected"] = _show(self.expected)
        if self.actual is not _MISSING:
            result["actual"] = _show(self.actual)
        return result


class OverrideError(ExpectationError):
    pass


def _show(value):
    text = repr(value)
    return text if len(text) <= 500 else text[:500] + "..."


def _guarded_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = name.split(".")[0]
    if level == 0 and root in _BLOCKED_MODULES:
        raise ImportError("The module '" + root + "' is not available in exercises.")
    return _real_import(name, globals, locals, fromlist, level)


def _input_unavailable(prompt=""):
    raise EOFError("input() is not available in this exercise; assign values directly in your code instead")


def _student_builtins():
    namespace = dict(_BUILTINS_SNAPSHOT)
    namespace["input"] = _input_unavailable
    namespace["__import__"] = _guarded_import
    return namespace


def _restore_builtins():
    # Undo changes a program may have made through "import builtins".
    builtins.__dict__.update(_BUILTINS_SNAPSHOT)


class _Sink:
    def __init__(self, emit=None, limit=MAX_CAPTURE_CHARS):
        self.parts = []
        self.size = 0
        self.truncated = False
        self._emit = emit
        self._limit = limit

    def add(self, stream, text):
        if self.truncated:
            return
        remaining = self._limit - self.size
        if len(text) > remaining:
            text = text[:remaining]
            self.truncated = True
        if not text:
            return
        self.size += len(text)
        if self.parts and self.parts[-1][0] == stream:
            self.parts[-1] = (stream, self.parts[-1][1] + text)
        else:
            self.parts.append((stream, text))
        if self._emit is not None:
            self._emit(stream, text)

    def text(self, stream):
        return "".join(text for kind, text in self.parts if kind == stream)


class _Capture(io.TextIOBase):
    def __init__(self, stream, sink):
        super().__init__()
        self._stream = stream
        self._sink = sink

    def writable(self):
        return True

    def write(self, text):
        if not isinstance(text, str):
            raise TypeError("write() argument must be str, not " + type(text).__name__)
        self._sink.add(self._stream, text)
        return len(text)

    def flush(self):
        pass


class Execution:
    """The result of running the learner's program once."""

    def __init__(self, sink, error, namespace):
        self.parts = sink.parts
        self.error = error
        self.namespace = namespace
        self.stdout = sink.text("stdout")
        self.stderr = sink.text("stderr")
        self.truncated = sink.truncated

    @property
    def lines(self):
        return [line.rstrip() for line in self.stdout.splitlines() if line.strip()]

    def has(self, name):
        return name in self.namespace and not name.startswith("__")

    def var(self, name):
        if not self.has(name):
            raise ExpectationError(
                "No variable named '" + name + "' was created.",
                expected=_Text(name),
                actual=_Text("-"),
            )
        return self.namespace[name]


def _format_error(exc):
    name = type(exc).__name__
    if isinstance(exc, SyntaxError):
        return {
            "kind": "syntax",
            "name": name,
            "message": exc.msg or str(exc),
            "line": exc.lineno,
            "column": exc.offset,
            "traceback": "".join(traceback.format_exception_only(type(exc), exc)).rstrip(),
        }
    frames = [frame for frame in traceback.extract_tb(exc.__traceback__) if frame.filename == STUDENT_FILE]
    message = str(exc)
    lines = ["Traceback (most recent call last):"]
    for frame in frames:
        lines.append('  File "' + frame.filename + '", line ' + str(frame.lineno) + ", in " + frame.name)
        if frame.line:
            lines.append("    " + frame.line.strip())
    lines.append(name + ": " + message if message else name)
    info = {"kind": "runtime", "name": name, "message": message, "traceback": "\n".join(lines)}
    if frames:
        info["line"] = frames[-1].lineno
    return info


def _literal(value):
    return ast.parse(repr(value), mode="eval").body


class _Override(ast.NodeTransformer):
    """Replace the first top-level assignment of each overridden name."""

    def __init__(self, overrides):
        self.overrides = overrides
        self.applied = set()

    def visit_Module(self, node):
        for statement in node.body:
            if isinstance(statement, ast.Assign):
                names = [target.id for target in statement.targets if isinstance(target, ast.Name)]
            elif (
                isinstance(statement, ast.AnnAssign)
                and statement.value is not None
                and isinstance(statement.target, ast.Name)
            ):
                names = [statement.target.id]
            else:
                continue
            for name in names:
                if name in self.overrides and name not in self.applied:
                    statement.value = ast.copy_location(_literal(self.overrides[name]), statement.value)
                    self.applied.add(name)
                    break
        return node


def _register_source(source):
    linecache.cache[STUDENT_FILE] = (len(source), None, source.splitlines(True), STUDENT_FILE)


def execute(source, overrides=None, emit=None):
    """Run the program in a fresh namespace and capture its output."""
    sink = _Sink(emit)
    namespace = {"__name__": "__main__", "__builtins__": _student_builtins()}
    _register_source(source)
    try:
        tree = ast.parse(source, filename=STUDENT_FILE)
    except (SyntaxError, ValueError) as exc:
        if not isinstance(exc, SyntaxError):
            exc = SyntaxError(str(exc))
        return Execution(sink, _format_error(exc), namespace)
    if overrides:
        transformer = _Override(overrides)
        tree = transformer.visit(tree)
        missing = [name for name in overrides if name not in transformer.applied]
        if missing:
            raise OverrideError(
                "The tests need a top-level assignment for: " + ", ".join(missing),
                expected=_Text(", ".join(name + " = ..." for name in missing)),
                actual=_Text("-"),
            )
        ast.fix_missing_locations(tree)
    compiled = compile(tree, STUDENT_FILE, "exec")
    error = None
    try:
        with contextlib.redirect_stdout(_Capture("stdout", sink)), contextlib.redirect_stderr(
            _Capture("stderr", sink)
        ):
            try:
                exec(compiled, namespace)
            except SystemExit as exc:
                if exc.code not in (None, 0):
                    error = _format_error(exc)
            except BaseException as exc:  # noqa: BLE001 - report every learner error
                error = _format_error(exc)
    finally:
        _restore_builtins()
    return Execution(sink, error, namespace)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _numbers_in(text):
    return [float(match) for match in re.findall(r"-?\d+(?:\.\d+)?", str(text))]


def expect(condition, message="", expected=_MISSING, actual=_MISSING):
    if not condition:
        raise ExpectationError(message, expected, actual)


def expect_equal(actual, expected, message=""):
    same_kind = type(actual) is type(expected) or (_is_number(actual) and _is_number(expected))
    if not same_kind or actual != expected:
        raise ExpectationError(message, expected=expected, actual=actual)


def expect_close(actual, expected, tolerance=1e-6, message=""):
    if not _is_number(actual) or abs(actual - expected) > tolerance:
        raise ExpectationError(message, expected=expected, actual=actual)


def expect_type(value, *types, message=""):
    ok = isinstance(value, types) and not (isinstance(value, bool) and bool not in types)
    if not ok:
        raise ExpectationError(
            message,
            expected=_Text(" or ".join(kind.__name__ for kind in types)),
            actual=_Text(type(value).__name__),
        )


def _test_environment(source, tree, base):
    def pick(execution):
        return execution if execution is not None else base

    def run(**overrides):
        return execute(source, overrides)

    def var(name, execution=None):
        return pick(execution).var(name)

    def has_var(name, execution=None):
        return pick(execution).has(name)

    def find_nodes(*node_types):
        return [node for node in ast.walk(tree) if isinstance(node, node_types)]

    def calls(name):
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                func = node.func
                if isinstance(func, ast.Name) and func.id == name:
                    return True
                if isinstance(func, ast.Attribute) and func.attr == name:
                    return True
        return False

    def output_text(execution):
        return execution.stdout.rstrip() or "-"

    def expect_line(expected_line, execution=None, message=""):
        execution = pick(execution)
        if expected_line not in execution.lines:
            raise ExpectationError(message, expected=_Text(expected_line), actual=_Text(output_text(execution)))

    def expect_number_in_output(value, execution=None, tolerance=1e-6, message=""):
        execution = pick(execution)
        if not any(abs(number - value) <= tolerance for number in _numbers_in(execution.stdout)):
            raise ExpectationError(message, expected=_Text(format(value, "g")), actual=_Text(output_text(execution)))

    def expect_no_error(execution=None, message=""):
        execution = pick(execution)
        if execution.error:
            raise ExpectationError(
                message,
                expected=_Text("-"),
                actual=_Text(execution.error["name"] + ": " + execution.error["message"]),
            )

    return {
        "__builtins__": builtins,
        "ast": ast,
        "math": math,
        "re": re,
        "code": source,
        "tree": tree,
        "result": base,
        "output": base.stdout,
        "lines": base.lines,
        "ns": base.namespace,
        "run": run,
        "var": var,
        "has_var": has_var,
        "find_nodes": find_nodes,
        "calls": calls,
        "numbers_in": _numbers_in,
        "expect": expect,
        "expect_equal": expect_equal,
        "expect_close": expect_close,
        "expect_type": expect_type,
        "expect_line": expect_line,
        "expect_number_in_output": expect_number_in_output,
        "expect_no_error": expect_no_error,
        "ExpectationError": ExpectationError,
    }


def _run_one(test, source, tree, base):
    test_id = test["id"]
    try:
        compiled = compile(test["code"], "<test:" + test_id + ">", "exec")
    except SyntaxError as exc:
        return {"id": test_id, "status": "error", "message": "Invalid test code: " + str(exc.msg) + " (line " + str(exc.lineno) + ")"}
    environment = _test_environment(source, tree, base)
    sink = _Sink()
    try:
        with contextlib.redirect_stdout(_Capture("stdout", sink)), contextlib.redirect_stderr(
            _Capture("stderr", sink)
        ):
            exec(compiled, environment)
        return {"id": test_id, "status": "pass"}
    except ExpectationError as exc:
        return {"id": test_id, "status": "fail", **exc.details()}
    except AssertionError as exc:
        result = {"id": test_id, "status": "fail"}
        if str(exc):
            result["message"] = str(exc)
        return result
    except BaseException as exc:  # noqa: BLE001 - learner code may raise anything
        return {"id": test_id, "status": "fail", "message": type(exc).__name__ + ": " + str(exc)}
    finally:
        _restore_builtins()


def _serialize_output(execution):
    return [{"stream": stream, "text": text} for stream, text in execution.parts]


def run_program(source, emit=None):
    if emit is not None:
        execution = execute(source, emit=lambda stream, text: emit(stream, text))
    else:
        execution = execute(source)
    return json.dumps({"error": execution.error, "truncated": execution.truncated, "output": _serialize_output(execution) if emit is None else None})


def run_tests(source, tests_json):
    tests = json.loads(tests_json)
    base = execute(source)
    report = {
        "run": {"error": base.error, "output": _serialize_output(base), "truncated": base.truncated},
        "tests": [],
    }
    if base.error and base.error.get("kind") == "syntax":
        report["tests"] = [{"id": test["id"], "status": "skipped"} for test in tests]
        return json.dumps(report)
    tree = ast.parse(source, filename=STUDENT_FILE)
    for test in tests:
        report["tests"].append(_run_one(test, source, tree, base))
    return json.dumps(report)


def check_syntax(source):
    try:
        ast.parse(source, filename=STUDENT_FILE)
    except SyntaxError as exc:
        return json.dumps(_format_error(exc))
    except ValueError as exc:
        return json.dumps(_format_error(SyntaxError(str(exc))))
    return "null"
`;
