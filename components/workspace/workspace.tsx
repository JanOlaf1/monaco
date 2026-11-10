"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodeEditor, type CodeEditorHandle } from "@/components/editor/code-editor";
import { EditorErrorBoundary } from "@/components/editor/editor-boundary";
import { Button } from "@/components/ui/button";
import { languageNames } from "@/components/ui/language-mark";
import type { LocalizedExercise } from "@/lib/content/localize";
import type { CheckResult } from "@/lib/execution/types";
import type { Rewards } from "@/lib/gamification/engine";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import {
  draftActions,
  progressActions,
  recordCheckResult,
  useDraftsHydrated,
  useGamification,
  useProgress,
} from "@/lib/learner/hooks";
import { draftsStore } from "@/lib/learner/stores";
import { resolveFiles } from "@/lib/progress/drafts";
import { initialStepIndex, isExerciseCompleted } from "@/lib/progress/progress";
import { useTheme } from "@/lib/theme/theme";
import { EditorPanel, EditorPlaceholder, RunCheckButtons, type BusyState } from "./editor-panel";
import { InstructionsPanel } from "./instructions-panel";
import { OutputPanel, type LastRun } from "./output-panel";
import type { WorkspaceNav } from "./types";
import { useCodeRunner } from "./use-code-runner";
import { useOutputLog } from "./use-output-log";
import { WorkspaceLayout, type PanelId } from "./workspace-layout";

/**
 * The learning workspace: instructions + tests, Monaco editor and output.
 * Content comes from the exercise definition; execution goes through the
 * language runner; progress and drafts go through the learner stores.
 */
export function Workspace({ exercise, nav }: { exercise: LocalizedExercise; nav: WorkspaceNav }) {
  const { locale, dict } = useI18n();
  const { resolved: theme } = useTheme();
  const { value: progress, hydrated: progressHydrated } = useProgress();
  const { hydrated: gamificationHydrated } = useGamification();
  const { gamification: catalog } = useCatalog();
  const draftsHydrated = useDraftsHydrated();
  const { available: runnerAvailable, runner, status: runnerStatus } = useCodeRunner(exercise.language);

  const stepIds = useMemo(() => exercise.steps.map((candidate) => candidate.id), [exercise.steps]);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const stepIndex = selectedStep ?? (progressHydrated ? initialStepIndex(progress, exercise.id, stepIds) : 0);
  const step = exercise.steps[stepIndex];
  const completedStepIds = progress.exercises[exercise.id]?.completedStepIds ?? [];
  const exerciseCompleted = progressHydrated && isExerciseCompleted(progress, exercise.id);

  const entryName = (exercise.starterFiles.find((file) => file.entry) ?? exercise.starterFiles[0]).name;
  const [activeFile, setActiveFile] = useState(entryName);
  const [mobilePanel, setMobilePanel] = useState<PanelId>("instructions");
  const [busy, setBusy] = useState<BusyState>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  const [rewardsByStep, setRewardsByStep] = useState<Record<string, Rewards | null>>({});
  const [checkCount, setCheckCount] = useState(0);
  const [changedSinceCheck, setChangedSinceCheck] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const output = useOutputLog();

  const editorRef = useRef<CodeEditorHandle>(null);
  const testsRef = useRef<HTMLElement>(null);
  const busyRef = useRef(false);
  const latestFiles = useRef<Record<string, string>>({});

  useEffect(() => {
    progressActions.visit(exercise.courseId, exercise.id);
  }, [exercise.courseId, exercise.id]);

  // Current content of every file: edits in this session, else the saved draft, else starter code.
  const currentFiles = useCallback(() => {
    const saved = resolveFiles(draftsStore.getSnapshot().value, exercise.id, step.starterFiles);
    return step.starterFiles.map((file) => ({
      name: file.name,
      content: latestFiles.current[file.name] ?? saved[file.name] ?? file.content,
      entry: file.entry,
    }));
  }, [exercise.id, step.starterFiles]);

  const getInitialValue = useCallback(
    (fileName: string) =>
      latestFiles.current[fileName] ??
      resolveFiles(draftsStore.getSnapshot().value, exercise.id, step.starterFiles)[fileName] ??
      "",
    [exercise.id, step.starterFiles],
  );

  const handleChange = useCallback(
    (fileName: string, value: string) => {
      latestFiles.current[fileName] = value;
      draftActions.saveFile(exercise.id, fileName, value);
      setChangedSinceCheck(true);
    },
    [exercise.id],
  );

  const handleRun = useCallback(async () => {
    if (busyRef.current || !runner) return;
    busyRef.current = true;
    setBusy("run");
    setLastRun(null);
    output.replace([]);
    setMobilePanel("output");
    try {
      const result = await runner.run({ files: currentFiles() }, { onOutput: output.append });
      output.replace(result.output);
      setLastRun({ kind: "run", result });
      setAnnouncement(
        result.status === "ok"
          ? format(dict.workspace.output.finished, { ms: result.durationMs })
          : dict.workspace.output.stopped,
      );
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, [runner, currentFiles, output, dict]);

  const handleCheck = useCallback(async () => {
    if (busyRef.current || !runner) return;
    busyRef.current = true;
    // Pin the visible step: recording progress must not move the learner on.
    setSelectedStep(stepIndex);
    setBusy("check");
    setLastRun(null);
    output.replace([]);
    try {
      const result = await runner.check({
        files: currentFiles(),
        tests: step.tests.map((test) => ({ id: test.id, code: test.code })),
      });
      const passed = result.tests.filter((test) => test.status === "pass").length;
      // Progress and XP are recorded from the check result only: XP is awarded
      // once per accomplishment, and failures are remembered for "Bug Hunter".
      const rewards = recordCheckResult({
        catalog,
        exerciseId: exercise.id,
        stepId: step.id,
        allStepIds: stepIds,
        passed: result.passed,
      });
      setChecks((previous) => ({ ...previous, [step.id]: result }));
      setRewardsByStep((previous) => ({ ...previous, [step.id]: rewards }));
      setCheckCount((count) => count + 1);
      setChangedSinceCheck(false);
      output.replace(result.run.output);
      setLastRun({ kind: "check", result: result.run, passed, total: result.tests.length });
      setAnnouncement(format(dict.workspace.tests.summary, { passed, total: result.tests.length }));
      setMobilePanel("instructions");
      // Scroll only the instructions panel (scrollIntoView would also scroll
      // the overflow-hidden page container and shift the whole workspace).
      requestAnimationFrame(() => {
        const target = testsRef.current;
        const scroller = target?.closest<HTMLElement>("[data-scroll-container]");
        if (target && scroller) scroller.scrollTo({ top: Math.max(0, target.offsetTop - 16), behavior: "smooth" });
      });
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, [runner, currentFiles, step, stepIndex, stepIds, exercise.id, output, dict, catalog]);

  const handleReset = useCallback(() => {
    const starter = step.starterFiles.find((file) => file.name === activeFile);
    if (!starter) return;
    editorRef.current?.setValue(activeFile, starter.content);
    editorRef.current?.focus();
  }, [step.starterFiles, activeFile]);

  const selectStep = useCallback(
    (index: number) => {
      const target = exercise.steps[index];
      if (!target) return;
      setSelectedStep(index);
      setChangedSinceCheck(false);
      progressActions.setCurrentStep(exercise.id, target.id);
    },
    [exercise.id, exercise.steps],
  );

  const runDisabled = !runnerAvailable || !runner;
  const editorReady = draftsHydrated && progressHydrated && gamificationHydrated;
  const check = checks[step.id];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <li className="shrink-0">
              <Link href={`/${locale}/courses/${nav.courseId}`} className="text-fg-muted hover:text-fg">
                {nav.courseTitle}
              </Link>
            </li>
            <li aria-hidden="true" className="text-fg-subtle">
              /
            </li>
            <li className="shrink-0 text-fg-muted max-md:hidden">{nav.chapterTitle}</li>
            <li aria-hidden="true" className="text-fg-subtle max-md:hidden">
              /
            </li>
            <li className="truncate font-medium" aria-current="page">
              {exercise.title}
            </li>
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          {nav.previous ? (
            <Link
              href={`/${locale}/courses/${nav.courseId}/${nav.previous.id}`}
              className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
              title={`${dict.workspace.previousExercise}: ${nav.previous.title}`}
              aria-label={`${dict.workspace.previousExercise}: ${nav.previous.title}`}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
          {nav.next ? (
            <Link
              href={`/${locale}/courses/${nav.courseId}/${nav.next.id}`}
              className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
              title={`${dict.workspace.nextExercise}: ${nav.next.title}`}
              aria-label={`${dict.workspace.nextExercise}: ${nav.next.title}`}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      <WorkspaceLayout
        mobilePanel={mobilePanel}
        onMobilePanelChange={setMobilePanel}
        badges={{
          instructions: check ? (
            <span
              className={`ml-0.5 size-1.5 rounded-full ${check.passed ? "bg-success" : "bg-warning"}`}
              aria-hidden="true"
            />
          ) : null,
        }}
        instructions={
          <InstructionsPanel
            exercise={exercise}
            nav={nav}
            stepIndex={stepIndex}
            completedStepIds={completedStepIds}
            exerciseCompleted={exerciseCompleted}
            check={check}
            checkCount={checkCount}
            rewards={rewardsByStep[step.id]}
            changedSinceCheck={changedSinceCheck}
            hintsRevealed={hintsRevealed[step.id] ?? 0}
            onRevealHint={() =>
              setHintsRevealed((previous) => ({ ...previous, [step.id]: (previous[step.id] ?? 0) + 1 }))
            }
            onSelectStep={selectStep}
            testsRef={testsRef}
          />
        }
        editor={
          <EditorPanel
            files={step.starterFiles}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            languageName={languageNames[exercise.language]}
            busy={busy}
            runDisabled={runDisabled}
            onRun={handleRun}
            onCheck={handleCheck}
            onReset={handleReset}
          >
            <EditorErrorBoundary
              fallback={(retry) => (
                <EditorPlaceholder message={dict.workspace.editor.failed}>
                  <Button size="sm" onClick={retry}>
                    {dict.common.retry}
                  </Button>
                </EditorPlaceholder>
              )}
            >
              <Suspense fallback={<EditorPlaceholder message={dict.workspace.editor.loading} />}>
                {editorReady ? (
                  <CodeEditor
                    ref={editorRef}
                    scope={exercise.id}
                    files={step.starterFiles}
                    activeFile={activeFile}
                    theme={theme}
                    ariaLabel={format(dict.workspace.editor.ariaLabel, { file: activeFile })}
                    getInitialValue={getInitialValue}
                    onChange={handleChange}
                    onRun={handleRun}
                    onCheck={handleCheck}
                  />
                ) : (
                  <EditorPlaceholder message={dict.workspace.editor.loading} />
                )}
              </Suspense>
            </EditorErrorBoundary>
          </EditorPanel>
        }
        output={
          <OutputPanel
            language={exercise.language}
            entries={output.entries}
            lastRun={lastRun}
            busy={busy}
            runnerStatus={runnerStatus}
            runnerAvailable={runnerAvailable}
            onClear={() => {
              output.replace([]);
              setLastRun(null);
            }}
          />
        }
        mobileActions={
          <RunCheckButtons busy={busy} disabled={runDisabled} onRun={handleRun} onCheck={handleCheck} compact />
        }
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
