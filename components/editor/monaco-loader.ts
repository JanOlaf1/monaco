import type * as MonacoNamespace from "monaco-editor";

/**
 * Loads the self-hosted Monaco Editor (AMD build in /public/vendor, copied by
 * scripts/copy-runtime-assets.mjs). Monaco is only downloaded on pages that
 * show an editor and never enters the server bundle.
 */
export type Monaco = typeof MonacoNamespace;

const MONACO_BASE = "/vendor/monaco-editor/vs";

type AmdRequire = {
  (deps: string[], onLoad: (...modules: unknown[]) => void, onError?: (error: unknown) => void): void;
  config(config: Record<string, unknown>): void;
};

type MonacoWindow = Window & { monaco?: Monaco; require?: AmdRequire };

let loading: Promise<Monaco> | null = null;

export function loadMonaco(): Promise<Monaco> {
  if (loading) return loading;
  const win = window as unknown as MonacoWindow;
  loading = new Promise<Monaco>((resolve, reject) => {
    if (win.monaco) {
      resolve(win.monaco);
      return;
    }
    const start = () => {
      const amdRequire = win.require;
      if (!amdRequire || typeof amdRequire.config !== "function") {
        reject(new Error("The Monaco loader did not initialise."));
        return;
      }
      amdRequire.config({ paths: { vs: MONACO_BASE } });
      amdRequire(
        ["vs/editor/editor.main"],
        (exports) => {
          const monaco = (win.monaco ?? exports) as Monaco;
          try {
            configureMonaco(monaco);
          } catch (error) {
            console.warn("[editor] Optional Monaco configuration failed:", error);
          }
          resolve(monaco);
        },
        (error) => reject(error instanceof Error ? error : new Error("Monaco Editor failed to load.")),
      );
    };
    if (win.require && typeof win.require.config === "function") {
      start();
      return;
    }
    const script = document.createElement("script");
    script.src = `${MONACO_BASE}/loader.js`;
    script.async = true;
    script.dataset.monacoLoader = "true";
    script.onload = start;
    script.onerror = () => reject(new Error("Could not download the Monaco Editor loader."));
    document.head.appendChild(script);
  });
  loading.catch(() => {
    // Allow a retry after a failed load.
    loading = null;
    document.querySelector("script[data-monaco-loader]")?.remove();
  });
  return loading;
}

export const MONACO_THEMES = { light: "koodaamo-light", dark: "koodaamo-dark" } as const;

const PYTHON_KEYWORDS = [
  "and", "as", "assert", "break", "class", "continue", "def", "del", "elif", "else", "except",
  "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None",
  "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield",
];

const PYTHON_BUILTINS = [
  "abs", "all", "any", "bool", "dict", "enumerate", "filter", "float", "format", "int", "isinstance",
  "len", "list", "map", "max", "min", "print", "range", "reversed", "round", "set", "sorted", "str",
  "sum", "tuple", "type", "zip",
];

const PYTHON_SNIPPETS: { label: string; body: string }[] = [
  { label: "if", body: "if ${1:condition}:\n\t${0:pass}" },
  { label: "if / else", body: "if ${1:condition}:\n\t${2:pass}\nelse:\n\t${0:pass}" },
  { label: "elif", body: "elif ${1:condition}:\n\t${0:pass}" },
  { label: "for", body: "for ${1:item} in ${2:items}:\n\t${0:pass}" },
  { label: "while", body: "while ${1:condition}:\n\t${0:pass}" },
  { label: "def", body: "def ${1:name}(${2:parameters}):\n\t${0:pass}" },
];

// The JavaScript runner has no DOM, so the editor only knows these globals.
const JS_RUNTIME_TYPES = `
interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  debug(...data: any[]): void;
  table(data: any): void;
  count(label?: string): void;
}
declare var console: Console;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id?: number): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id?: number): void;
`;

function configureMonaco(monaco: Monaco) {
  monaco.editor.defineTheme(MONACO_THEMES.light, {
    base: "vs",
    inherit: true,
    rules: [{ token: "comment", foreground: "7b8494", fontStyle: "italic" }],
    colors: {
      "editor.background": "#ffffff",
      "editor.lineHighlightBackground": "#f4f6f9",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#a2aab6",
      "editorLineNumber.activeForeground": "#4a5464",
      "editorIndentGuide.background1": "#eceff3",
      "editorIndentGuide.activeBackground1": "#cdd3dc",
      "editorGutter.background": "#ffffff",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#e1e5eb",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#e1e5eb",
      "editorSuggestWidget.selectedBackground": "#e9eefc",
      "scrollbarSlider.background": "#cdd3dc80",
    },
  });
  monaco.editor.defineTheme(MONACO_THEMES.dark, {
    base: "vs-dark",
    inherit: true,
    rules: [{ token: "comment", foreground: "6b7584", fontStyle: "italic" }],
    colors: {
      "editor.background": "#0e1116",
      "editor.lineHighlightBackground": "#151922",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#4b5361",
      "editorLineNumber.activeForeground": "#a1aab8",
      "editorIndentGuide.background1": "#1b2029",
      "editorIndentGuide.activeBackground1": "#313846",
      "editorGutter.background": "#0e1116",
      "editorWidget.background": "#151922",
      "editorWidget.border": "#232832",
      "editorSuggestWidget.background": "#151922",
      "editorSuggestWidget.border": "#232832",
      "editorSuggestWidget.selectedBackground": "#222a3d",
      "scrollbarSlider.background": "#31384680",
    },
  });

  // JavaScript: keep syntax errors, skip semantic diagnostics that are confusing
  // for beginners (and wrong for our DOM-less runner).
  // Monaco 0.55+ exposes the TypeScript/JavaScript service as `monaco.typescript`.
  const typescript = monaco.typescript as Monaco["typescript"] | undefined;
  const js = typescript?.javascriptDefaults;
  if (js) {
    js.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
    js.setCompilerOptions({
      target: typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: false,
      noLib: false,
      lib: ["esnext"],
    });
    js.addExtraLib(JS_RUNTIME_TYPES, "file:///koodaamo/runtime.d.ts");
  }

  // Python: Monaco only ships a tokenizer, so offer keywords, built-ins,
  // snippets and names already used in the file.
  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
      const known = new Set([...PYTHON_KEYWORDS, ...PYTHON_BUILTINS]);
      const identifiers = new Set(model.getValue().match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
      identifiers.delete(word.word);
      return {
        suggestions: [
          ...PYTHON_KEYWORDS.map((label) => ({ label, kind: CompletionItemKind.Keyword, insertText: label, range })),
          ...PYTHON_BUILTINS.map((label) => ({
            label,
            kind: CompletionItemKind.Function,
            insertText: `${label}($0)`,
            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
          ...PYTHON_SNIPPETS.map((snippet) => ({
            label: snippet.label,
            kind: CompletionItemKind.Snippet,
            insertText: snippet.body,
            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: `~${snippet.label}`,
          })),
          ...[...identifiers]
            .filter((name) => !known.has(name))
            .map((label) => ({ label, kind: CompletionItemKind.Variable, insertText: label, range })),
        ],
      };
    },
  });
}
