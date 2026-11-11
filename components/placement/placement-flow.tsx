"use client";

import { ArrowRight, CircleCheck, CircleX, ClipboardCheck, Flag, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InlineMarkdown } from "@/components/content/markdown";
import { chapterName } from "@/components/learn/learning-path";
import { Mascot } from "@/components/mascot/mascot";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { languageNames } from "@/components/ui/language-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import type { CatalogCourse } from "@/lib/content/catalog";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/content/types";
import { getRunner } from "@/lib/execution/registry";
import type { CheckResult } from "@/lib/execution/types";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import type { TrackId } from "@/lib/learning/competency";
import { nextItemIndex, placementOutcome, type PlacementAnswer, type PlacementOutcome } from "@/lib/learning/placement";
import type { LocalizedPlacement, LocalizedPlacementItem } from "@/lib/learning/placement-content";
import { checkpointBefore, entryChapter } from "@/lib/learning/recommend";
import { useCatalog } from "@/lib/learner/catalog-context";
import { competencyActions, useCompetency } from "@/lib/learner/hooks";

const DONT_KNOW = "__dont-know__";

/** The optional placement check: intro → questions (with an adaptive early stop) → recommendation. */
export function PlacementFlow({ placement }: { placement: LocalizedPlacement }) {
  const { dict } = useI18n();
  const { courses } = useCatalog();
  const course = courses.find((candidate) => candidate.id === placement.courseId);
  const [phase, setPhase] = useState<"intro" | "questions" | "result">("intro");
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [outcome, setOutcome] = useState<PlacementOutcome | null>(null);
  const language = languageNames[placement.language];

  const index = nextItemIndex(placement.items, answers);
  const item = index === null ? undefined : placement.items[index];

  const record = (answer: PlacementAnswer) => {
    const next = [...answers, answer];
    setAnswers(next);
    if (nextItemIndex(placement.items, next) !== null) return;
    // Finished: score, save locally and show the recommendation.
    const result = placementOutcome(placement.items, next);
    setOutcome(result);
    setPhase("result");
    if (course) {
      competencyActions.savePlacement({
        course,
        result: {
          assessmentId: placement.id,
          version: placement.version,
          level: result.level,
          correct: result.correct,
          answered: result.answered,
          total: result.total,
          stoppedEarly: result.stoppedEarly,
          completedAt: new Date().toISOString(),
        },
        skills: result.skills,
      });
    }
  };

  const restart = () => {
    setAnswers([]);
    setOutcome(null);
    setPhase("intro");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {format(dict.placement.title, { language })}
      </h1>
      {phase === "intro" ? (
        <Intro placement={placement} onStart={() => setPhase("questions")} />
      ) : phase === "questions" && item ? (
        <Question
          key={item.id}
          item={item}
          position={answers.length + 1}
          total={placement.items.length}
          language={placement.language}
          finishesWith={(correct) =>
            nextItemIndex(placement.items, [...answers, { itemId: item.id, correct, skipped: !correct }]) === null
          }
          onDone={record}
        />
      ) : outcome && course ? (
        <Result outcome={outcome} course={course} onRetake={restart} />
      ) : null}
    </div>
  );
}

function Intro({ placement, onStart }: { placement: LocalizedPlacement; onStart: () => void }) {
  const { locale, dict } = useI18n();
  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="flex items-start gap-4">
        <Mascot mood="thinking" size={72} />
        <div className="min-w-0 space-y-3 text-sm leading-relaxed">
          <p>{format(dict.placement.intro, { minutes: placement.minutes })}</p>
          <p className="text-fg-muted">{dict.placement.notCertificate}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="primary" className="h-11 px-6" onClick={onStart}>
          <ClipboardCheck aria-hidden="true" />
          {dict.placement.start}
        </Button>
        <ButtonLink href={`/${locale}/courses/${placement.courseId}`} variant="ghost" className="h-11">
          {dict.placement.backToCourse}
        </ButtonLink>
      </div>
    </div>
  );
}

function Question({
  item,
  position,
  total,
  language,
  finishesWith,
  onDone,
}: {
  item: LocalizedPlacementItem;
  position: number;
  total: number;
  language: LocalizedPlacement["language"];
  /** Whether answering this item (correctly or not) ends the check. */
  finishesWith: (correct: boolean) => boolean;
  onDone: (answer: PlacementAnswer) => void;
}) {
  const { dict } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus to the new question so keyboard and screen-reader users start from its top.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" aria-labelledby={`q-${item.id}`}>
      <div className="flex items-center justify-between gap-3 text-xs text-fg-muted">
        <span>{format(dict.placement.progress, { current: position, total })}</span>
        <Badge>{dict.levels.bands[item.level]}</Badge>
      </div>
      <ProgressBar value={Math.round(((position - 1) / total) * 100)} label={dict.placement.progress} className="mt-2" />
      <h2 id={`q-${item.id}`} ref={heading} tabIndex={-1} className="mt-5 text-base font-semibold leading-relaxed outline-none">
        <InlineMarkdown source={item.prompt} />
      </h2>
      {item.kind === "code" ? (
        <CodeQuestion item={item} language={language} finishesWith={finishesWith} onDone={onDone} />
      ) : (
        <ChoiceQuestion item={item} finishesWith={finishesWith} onDone={onDone} />
      )}
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[13px] leading-relaxed">
      <code>{code.replace(/\n$/, "")}</code>
    </pre>
  );
}

function ChoiceQuestion({
  item,
  finishesWith,
  onDone,
}: {
  item: Extract<LocalizedPlacementItem, { kind: "predict" | "debug" }>;
  finishesWith: (correct: boolean) => boolean;
  onDone: (answer: PlacementAnswer) => void;
}) {
  const { dict } = useI18n();
  const [choice, setChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = choice === item.answer;
  const dontKnow = choice === DONT_KNOW;
  const answerText =
    item.kind === "predict"
      ? item.options.find((option) => option.id === item.answer)?.output
      : item.options.find((option) => option.id === item.answer)?.label;

  return (
    <div>
      <CodeBlock code={item.code} />
      <fieldset className="mt-4" disabled={submitted}>
        <legend className="text-xs text-fg-muted">
          {item.kind === "predict" ? dict.placement.predictHint : dict.placement.debugHint}
        </legend>
        <div className="mt-2 space-y-2">
          {[...item.options.map((option) => option.id), DONT_KNOW].map((id) => {
            const option = item.options.find((candidate) => candidate.id === id);
            const isAnswer = submitted && id === item.answer;
            const isWrongChoice = submitted && id === choice && !correct && id !== DONT_KNOW;
            return (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-surface p-3 text-sm transition-colors",
                  "has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                  isAnswer && "border-success bg-success-soft",
                  isWrongChoice && "border-danger bg-danger-soft",
                  !isAnswer && !isWrongChoice && "border-line",
                  submitted && "cursor-default",
                )}
              >
                <input
                  type="radio"
                  name={`choice-${item.id}`}
                  value={id}
                  checked={choice === id}
                  onChange={() => setChoice(id)}
                  className="mt-0.5 accent-accent"
                />
                <span className="min-w-0 flex-1">
                  {id === DONT_KNOW ? (
                    <span className="text-fg-muted">{dict.placement.dontKnow}</span>
                  ) : item.kind === "predict" ? (
                    <code className="whitespace-pre-wrap font-mono text-[13px]">
                      {(option as { output: string }).output}
                    </code>
                  ) : (
                    <InlineMarkdown source={(option as { label: string }).label} />
                  )}
                </span>
                {isAnswer ? <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" /> : null}
                {isWrongChoice ? <CircleX className="size-4 shrink-0 text-danger" aria-hidden="true" /> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {submitted ? (
        <div role="status" className="mt-4 rounded-xl border border-line bg-muted p-4 text-sm">
          <p className={cn("font-semibold", correct ? "text-success" : "text-fg")}>
            {correct ? dict.placement.correct : dontKnow ? dict.placement.skipped : dict.placement.incorrect}
          </p>
          {!correct && answerText ? (
            <p className="mt-1">
              {item.kind === "predict" ? (
                <>
                  {format(dict.placement.rightAnswer, { answer: "" })}
                  <code className="whitespace-pre-wrap font-mono text-[13px]">{answerText}</code>
                </>
              ) : (
                <InlineMarkdown source={format(dict.placement.rightAnswer, { answer: answerText })} />
              )}
            </p>
          ) : null}
          <p className="mt-1 text-fg-muted">
            <InlineMarkdown source={item.explanation} />
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {submitted ? (
          <Button
            variant="primary"
            onClick={() => onDone({ itemId: item.id, correct, skipped: dontKnow })}
          >
            {finishesWith(correct) ? dict.placement.finish : dict.placement.next}
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="primary" disabled={choice === null} onClick={() => setSubmitted(true)}>
            {dict.placement.answer}
          </Button>
        )}
      </div>
    </div>
  );
}

function CodeQuestion({
  item,
  language,
  finishesWith,
  onDone,
}: {
  item: Extract<LocalizedPlacementItem, { kind: "code" }>;
  language: LocalizedPlacement["language"];
  finishesWith: (correct: boolean) => boolean;
  onDone: (answer: PlacementAnswer) => void;
}) {
  const { dict } = useI18n();
  const [source, setSource] = useState(item.starter);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [everPassed, setEverPassed] = useState(false);
  const fileName = language === "python" ? "main.py" : "index.js";

  // Start loading the runtime (Pyodide can take a few seconds the first time).
  useEffect(() => {
    void getRunner(language)?.then((runner) => runner.prepare()).catch(() => {});
  }, [language]);

  const check = async () => {
    const loading = getRunner(language);
    if (!loading) return;
    setChecking(true);
    setFailure(null);
    try {
      const runner = await loading;
      const outcome = await runner.check({
        files: [{ name: fileName, content: source, entry: true }],
        tests: item.tests.map((test) => ({ id: test.id, code: test.code })),
      });
      setResult(outcome);
      if (outcome.passed) setEverPassed(true);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      setChecking(false);
    }
  };

  const passedCount = result?.tests.filter((test) => test.status === "pass").length ?? 0;
  const runError = result?.run.error;

  return (
    <div>
      <label className="mt-4 block text-xs font-medium text-fg-muted" htmlFor={`code-${item.id}`}>
        {dict.placement.yourCode}
      </label>
      <textarea
        id={`code-${item.id}`}
        value={source}
        onChange={(event) => setSource(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={Math.max(6, source.split("\n").length + 1)}
        className="mt-1 w-full resize-y rounded-lg border border-line bg-code p-3 font-mono text-[13px] leading-relaxed text-fg"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={check} disabled={checking}>
          {checking ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Flag aria-hidden="true" />}
          {checking ? dict.placement.checking : dict.placement.checkCode}
        </Button>
        {checking && language === "python" ? (
          <span className="text-xs text-fg-subtle">{format(dict.placement.loadingRuntime, { language: "Python" })}</span>
        ) : null}
      </div>

      <div aria-live="polite">
        {failure ? <p className="mt-3 text-sm text-danger">{failure}</p> : null}
        {result ? (
          <div className="mt-4 rounded-xl border border-line bg-muted p-4 text-sm">
            <p className={cn("font-semibold", result.passed ? "text-success" : "text-fg")}>
              {result.passed
                ? dict.placement.codePassed
                : format(dict.placement.checksPassed, { passed: passedCount, total: result.tests.length })}
            </p>
            {runError ? (
              <p className="mt-1 font-mono text-xs text-danger">
                {runError.name}: {runError.message}
              </p>
            ) : null}
            <ul className="mt-2 space-y-1.5">
              {item.tests.map((test) => {
                const status = result.tests.find((candidate) => candidate.id === test.id)?.status;
                const passed = status === "pass";
                return (
                  <li key={test.id} className="flex items-start gap-2" data-test-id={test.id} data-status={status}>
                    {passed ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                    )}
                    <span>
                      <InlineMarkdown source={test.label} />
                      {!passed ? (
                        <span className="block text-xs text-fg-muted">
                          <InlineMarkdown source={test.failure} />
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            {result.passed ? (
              <p className="mt-2 text-fg-muted">
                <InlineMarkdown source={item.explanation} />
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {everPassed ? (
          <Button variant="primary" onClick={() => onDone({ itemId: item.id, correct: true, skipped: false })}>
            {finishesWith(true) ? dict.placement.finish : dict.placement.next}
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => onDone({ itemId: item.id, correct: everPassed, skipped: !everPassed })}>
          {dict.placement.skipQuestion}
        </Button>
      </div>
    </div>
  );
}

function Result({ outcome, course, onRetake }: { outcome: PlacementOutcome; course: CatalogCourse; onRetake: () => void }) {
  const { locale, dict } = useI18n();
  const { skills } = useCatalog();
  const { value: competency } = useCompetency();
  const track = competency.tracks[course.language as TrackId];
  const override = track?.userOverride ?? null;
  const [own, setOwn] = useState<SkillLevel>(override ?? outcome.level);
  const [choosing, setChoosing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const entry = entryChapter(course, outcome.level);
  const start = entry?.exercises[0];
  const checkpoint = entry ? checkpointBefore(course, entry.id) : undefined;
  const skillRows = Object.entries(outcome.skills)
    .map(([id, score]) => ({ id, score, title: skills.find((skill) => skill.id === id)?.title ?? id }))
    .sort((a, b) => a.title.localeCompare(b.title, locale));

  return (
    <section className="mt-6 space-y-4" aria-labelledby="placement-result">
      <div className="rounded-2xl border border-success/30 bg-success-soft p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Mascot mood="celebrating" size={72} animate />
          <div className="min-w-0">
            <h2 id="placement-result" ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">
              {dict.placement.resultTitle}
            </h2>
            <p className="mt-1 text-base" data-testid="placement-level">
              {format(dict.placement.resultLevel, { level: dict.levels.names[outcome.level] })}
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              {format(dict.placement.resultScore, { correct: outcome.correct, answered: outcome.answered })}
            </p>
            {outcome.stoppedEarly ? <p className="mt-1 text-sm text-fg-muted">{dict.placement.resultStoppedEarly}</p> : null}
          </div>
        </div>
        <p className="mt-4 text-xs text-fg-muted">{dict.placement.notCertificate}</p>
      </div>

      {override ? (
        <div className="rounded-xl border border-line bg-surface p-4 text-sm" role="status">
          <p>{format(dict.placement.overrideActive, { level: dict.levels.names[override] })}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => competencyActions.setOverride(course, course.language as TrackId, null)}>
            {dict.placement.useSuggestion}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {entry && start ? (
          <ButtonLink href={`/${locale}/courses/${course.id}/${start.id}`} variant="primary" className="h-11 px-5">
            {entry.number !== null
              ? format(dict.placement.resultStart, { number: entry.number, title: entry.title })
              : chapterName(entry, dict)}
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        ) : null}
        <Button variant="ghost" className="h-11" onClick={() => setChoosing((value) => !value)} aria-expanded={choosing}>
          {dict.placement.chooseOwn}
        </Button>
        <Button variant="ghost" className="h-11" onClick={onRetake}>
          <RotateCcw aria-hidden="true" />
          {dict.placement.retake}
        </Button>
      </div>
      {checkpoint?.exercises[0] ? (
        <p className="text-sm">
          <a
            href={`/${locale}/courses/${course.id}/${checkpoint.exercises[0].id}`}
            className="text-accent underline-offset-4 hover:underline"
          >
            {format(dict.placement.resultCheckpoint, { title: checkpoint.title })}
          </a>
        </p>
      ) : null}

      {choosing ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-col gap-1 text-xs text-fg-muted">
            <label htmlFor="placement-own-level">{dict.placement.ownLevel}</label>
            <select
              id="placement-own-level"
              value={own}
              onChange={(event) => setOwn(event.target.value as SkillLevel)}
              className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {dict.levels.names[level]}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              competencyActions.setOverride(course, course.language as TrackId, own);
              setChoosing(false);
            }}
          >
            {dict.placement.saveOwn}
          </Button>
        </div>
      ) : null}

      {skillRows.length > 0 ? (
        <details className="rounded-xl border border-line bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-medium">{dict.placement.skillsTitle}</summary>
          <ul className="mt-3 space-y-1.5">
            {skillRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span>{row.title}</span>
                <span className="tabular-nums text-fg-muted">
                  {format(dict.placement.skillScore, { correct: row.score.correct, total: row.score.total })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
