"use client";

import type { editor as MonacoEditor } from "monaco-editor";
import { use, useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref } from "react";
import { browser } from "react-dom";
import type { EditorLanguage } from "@/lib/content/types";
import { loadMonaco, MONACO_THEMES } from "./monaco-loader";

export interface CodeEditorHandle {
  /** Replace a file's content as one undoable edit. */
  setValue(fileName: string, value: string): void;
  focus(): void;
}

export interface EditorFile {
  name: string;
  language: EditorLanguage;
  readOnly?: boolean;
}

// Cursor/scroll positions survive the editor being recreated (e.g. when the
// route is hidden and shown again by Cache Components' <Activity>).
const viewStates = new Map<string, MonacoEditor.ICodeEditorViewState | null>();

function monoFontFamily(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
  return `${value ? `${value}, ` : ""}ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
}

/**
 * Monaco editor wrapper. Rendered only in the browser (`browser()` suspends
 * during server rendering) and safe to hide/show: the editor and its models
 * are created in an effect and disposed in its cleanup, and the initial
 * content always comes from `getInitialValue` (the learner's saved draft).
 */
export function CodeEditor({
  ref,
  scope,
  files,
  activeFile,
  theme,
  ariaLabel,
  getInitialValue,
  onChange,
  onRun,
  onCheck,
}: {
  ref?: Ref<CodeEditorHandle>;
  /** Unique per exercise; used for model URIs. */
  scope: string;
  files: EditorFile[];
  activeFile: string;
  theme: "light" | "dark";
  ariaLabel: string;
  getInitialValue: (fileName: string) => string;
  onChange: (fileName: string, value: string) => void;
  onRun: () => void;
  onCheck: () => void;
}) {
  use(browser("Monaco Editor needs the browser DOM."));
  const monaco = use(loadMonaco());

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const modelsRef = useRef(new Map<string, MonacoEditor.ITextModel>());

  const emitChange = useEffectEvent((fileName: string, value: string) => onChange(fileName, value));
  const emitRun = useEffectEvent(() => onRun());
  const emitCheck = useEffectEvent(() => onCheck());
  const readInitial = useEffectEvent((fileName: string) => getInitialValue(fileName));
  const currentTheme = useEffectEvent(() => theme);
  const fileInfo = useEffectEvent((fileName: string) => files.find((file) => file.name === fileName));

  // Create the editor (once per mount / exercise).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const models = modelsRef.current;
    const editor = monaco.editor.create(container, {
      model: null,
      theme: MONACO_THEMES[currentTheme()],
      ariaLabel,
      automaticLayout: true,
      minimap: { enabled: false },
      fontFamily: monoFontFamily(),
      fontSize: 14,
      lineHeight: 22,
      fontLigatures: false,
      scrollBeyondLastLine: false,
      padding: { top: 14, bottom: 14 },
      renderLineHighlight: "line",
      bracketPairColorization: { enabled: true },
      guides: { indentation: true, bracketPairs: false },
      matchBrackets: "always",
      autoClosingBrackets: "languageDefined",
      autoClosingQuotes: "languageDefined",
      autoIndent: "full",
      detectIndentation: false,
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      wordBasedSuggestions: "currentDocument",
      fixedOverflowWidgets: true,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      folding: true,
      stickyScroll: { enabled: false },
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        useShadows: false,
        alwaysConsumeMouseWheel: false,
      },
    });
    editorRef.current = editor;

    const contentListener = editor.onDidChangeModelContent(() => {
      const model = editor.getModel();
      const name = model ? [...models.entries()].find(([, candidate]) => candidate === model)?.[0] : undefined;
      if (model && name) emitChange(name, model.getValue());
    });
    editor.addAction({
      id: "koodaamo.run",
      label: "Run",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => emitRun(),
    });
    editor.addAction({
      id: "koodaamo.check",
      label: "Check answer",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => emitCheck(),
    });
    // Re-measure once web fonts are ready so the cursor lines up with text.
    void document.fonts?.ready.then(() => monaco.editor.remeasureFonts());

    return () => {
      const model = editor.getModel();
      const name = model ? [...models.entries()].find(([, candidate]) => candidate === model)?.[0] : undefined;
      if (name) viewStates.set(`${scope}/${name}`, editor.saveViewState());
      contentListener.dispose();
      editor.dispose();
      for (const existing of models.values()) existing.dispose();
      models.clear();
      editorRef.current = null;
    };
  }, [monaco, scope, ariaLabel]);

  // Show the active file, creating its model on first use.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const models = modelsRef.current;
    const info = fileInfo(activeFile);
    let model = models.get(activeFile);
    if (!model) {
      const uri = monaco.Uri.parse(`file:///${scope}/${activeFile}`);
      monaco.editor.getModel(uri)?.dispose();
      model = monaco.editor.createModel(readInitial(activeFile), info?.language ?? "plaintext", uri);
      model.updateOptions({ tabSize: info?.language === "python" ? 4 : 2, insertSpaces: true });
      models.set(activeFile, model);
    }
    const previous = editor.getModel();
    if (previous === model) return;
    if (previous) {
      const previousName = [...models.entries()].find(([, candidate]) => candidate === previous)?.[0];
      if (previousName) viewStates.set(`${scope}/${previousName}`, editor.saveViewState());
    }
    editor.setModel(model);
    editor.updateOptions({ readOnly: Boolean(info?.readOnly) });
    const state = viewStates.get(`${scope}/${activeFile}`);
    if (state) editor.restoreViewState(state);
  }, [monaco, scope, activeFile]);

  useEffect(() => {
    monaco.editor.setTheme(MONACO_THEMES[theme]);
  }, [monaco, theme]);

  useImperativeHandle(
    ref,
    () => ({
      setValue(fileName, value) {
        const editor = editorRef.current;
        const model = modelsRef.current.get(fileName);
        if (!editor || !model) return;
        if (editor.getModel() === model) {
          editor.pushUndoStop();
          editor.executeEdits("reset", [{ range: model.getFullModelRange(), text: value }]);
          editor.pushUndoStop();
        } else {
          model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null);
        }
      },
      focus() {
        editorRef.current?.focus();
      },
    }),
    [],
  );

  return <div ref={containerRef} className="monaco-host h-full w-full" />;
}
