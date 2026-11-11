"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ChevronDown,
  CircleCheck,
  Clock,
  Flag,
  FlaskConical,
  Footprints,
  ListChecks,
  RotateCcw,
  Star,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { InlineMarkdown, Markdown } from "@/components/content/markdown";
import { LevelProgress } from "@/components/gamification/stats";
import { chapterIcons, tones } from "@/components/learn/theme";
import { Mascot } from "@/components/mascot/mascot";
import { DeadlineControl } from "@/components/schedule/deadline-control";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { LocalizedExercise } from "@/lib/content/localize";
import type { Rewards } from "@/lib/gamification/engine";
import { levelInfo } from "@/lib/gamification/levels";
import type { CheckResult } from "@/lib/execution/types";
import { useI18n } from "@/lib/i18n/client";
import { format, plural } from "@/lib/i18n/format";
import { Hints } from "./hints";
import { StepNav } from "./step-nav";
import { TestList } from "./test-list";
import type { WorkspaceNav } from "./types";

/** A collapsible section with a consistent look. Closed by default. */
function Disclosure({ summary, icon, children }: { summary: string; icon: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-line">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
        {icon}
        <span className="flex-1">{summary}</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-line px-3.5 py-3.5">{children}</div>
    </details>
  );
}

export function InstructionsPanel({
  exercise,
  nav,
  stepIndex,
  completedStepIds,
  exerciseCompleted,
  check,
  checkCount,
  rewards,
  changedSinceCheck,
  hintsRevealed,
  onRevealHint,
  onSelectStep,
  testsRef,
}: {
  exercise: LocalizedExercise;
  nav: WorkspaceNav;
  stepIndex: number;
  completedStepIds: string[];
  exerciseCompleted: boolean;
  check?: CheckResult;
  /** Increments with every check, to replay the feedback animation. */
  checkCount: number;
  rewards?: Rewards | null;
  changedSinceCheck: boolean;
  hintsRevealed: number;
  onRevealHint: () => void;
  onSelectStep: (index: number) => void;
  testsRef: RefObject<HTMLElement | null>;
}) {
  const { locale, dict } = useI18n();
  const w = dict.workspace;
  const step = exercise.steps[stepIndex];
  // Labs and checkpoints share the bigger-task layout (requirements, example output).
  const isLab = exercise.type !== "challenge";
  const multiStep = exercise.steps.length > 1;
  const isLastStep = stepIndex === exercise.steps.length - 1;
  const tone = tones[nav.chapterTheme.tone];
  const ChapterIcon = chapterIcons[nav.chapterTheme.icon];
  const failing = check?.tests.filter((test) => test.status !== "pass") ?? [];
  const passingIds = new Set(check?.tests.filter((test) => test.status === "pass").map((test) => test.id));

  return (
    <div data-scroll-container className="relative min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <header>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium">
            <span className={cn("inline-flex items-center gap-1", tone.text)}>
              <ChapterIcon className="size-3.5" aria-hidden="true" />
              {nav.chapterNumber === null
                ? format(w.checkpointLabel, { title: nav.chapterTitle })
                : format(w.chapterLabel, { number: nav.chapterNumber, title: nav.chapterTitle })}
            </span>
            <span className="text-fg-subtle">
              · {format(w.positionInChapter, { position: nav.positionInChapter, total: nav.chapterSize })}
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight">{exercise.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              tone="accent"
              icon={
                exercise.type === "checkpoint" ? (
                  <Flag aria-hidden="true" />
                ) : isLab ? (
                  <FlaskConical aria-hidden="true" />
                ) : (
                  <Footprints aria-hidden="true" />
                )
              }
            >
              {dict.course.type[exercise.type]}
            </Badge>
            <Badge icon={<Clock aria-hidden="true" />}>{format(dict.common.minutes, { count: exercise.estimatedMinutes })}</Badge>
            {exerciseCompleted ? (
              <Badge tone="success" icon={<CircleCheck aria-hidden="true" />}>
                {dict.course.status.completed}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{exercise.summary}</p>
        </header>

        {multiStep ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-fg-subtle">
              {format(w.stepOf, { current: stepIndex + 1, total: exercise.steps.length })}
            </p>
            <StepNav
              steps={exercise.steps}
              currentIndex={stepIndex}
              completedStepIds={completedStepIds}
              onSelect={onSelectStep}
            />
          </div>
        ) : null}

        <section aria-labelledby="task-title" className="rounded-xl border border-line bg-muted/40 p-4">
          <h2 id="task-title" className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {multiStep ? `${format(w.stepLabel, { number: stepIndex + 1 })} · ${step.title}` : w.instructions}
          </h2>
          <Markdown source={step.instructions} className="mt-2 text-[14.5px] text-fg" />
          {exercise.expectedOutput && (isLab || isLastStep) ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-fg-subtle">{w.expectedOutput}</p>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-code px-3 py-2 font-mono text-[13px]">
                {exercise.expectedOutput.text}
              </pre>
              {exercise.expectedOutput.note ? (
                <p className="mt-1 text-xs text-fg-subtle">{exercise.expectedOutput.note}</p>
              ) : null}
            </div>
          ) : null}
        </section>

        {isLab && exercise.requirements.length > 0 ? (
          <Disclosure
            summary={format(w.requirements, { count: exercise.requirements.length })}
            icon={<ListChecks className="size-4" aria-hidden="true" />}
          >
            <ol className="space-y-2">
              {exercise.requirements.map((requirement, index) => (
                <li key={index} className="flex gap-2.5 text-[13.5px] leading-snug text-fg-muted">
                  <span className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] text-fg-subtle">
                    {index + 1}
                  </span>
                  <span>
                    <InlineMarkdown source={requirement} />
                  </span>
                </li>
              ))}
            </ol>
          </Disclosure>
        ) : null}

        <Hints hints={step.hints} revealed={hintsRevealed} onReveal={onRevealHint} />

        <Disclosure summary={w.theory} icon={<BookOpen className="size-4" aria-hidden="true" />}>
          <Markdown source={exercise.concept} />
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{w.objectives}</h3>
          <ul className="mt-2 space-y-1.5 text-[13.5px] text-fg-muted">
            {exercise.objectives.map((objective) => (
              <li key={objective} className="flex gap-2">
                <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                {objective}
              </li>
            ))}
          </ul>
        </Disclosure>

        <section ref={testsRef} aria-labelledby="checks-title" className="scroll-mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="checks-title"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle"
            >
              <ListChecks className="size-3.5" aria-hidden="true" />
              {w.tests.title}
            </h2>
            {check ? (
              <span className="text-xs tabular-nums text-fg-muted">
                {format(w.tests.summary, { passed: check.tests.length - failing.length, total: check.tests.length })}
              </span>
            ) : null}
          </div>

          {!check ? (
            <p className="text-[13px] text-fg-subtle">
              {exerciseCompleted ? w.feedback.alreadyCompleted : plural(locale, w.tests.beforeCheck, step.tests.length)}
            </p>
          ) : (
            <Feedback
              key={checkCount}
              check={check}
              rewards={rewards}
              failingCount={failing.length}
              isLastStep={isLastStep}
              exerciseType={exercise.type}
              nav={nav}
              onNextStep={() => onSelectStep(stepIndex + 1)}
            />
          )}

          {check && changedSinceCheck ? (
            <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {w.tests.stale}
            </p>
          ) : null}

          {check && failing.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-fg">{w.tests.toFix}</p>
              <TestList tests={step.tests.filter((test) => !passingIds.has(test.id))} allTests={step.tests} results={check.tests} />
            </div>
          ) : null}

          {check && passingIds.size > 0 ? (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
                {plural(locale, w.tests.showPassed, passingIds.size)}
              </summary>
              <div className="mt-2">
                <TestList tests={step.tests.filter((test) => passingIds.has(test.id))} allTests={step.tests} results={check.tests} />
              </div>
            </details>
          ) : null}

          {step.tests.some((test) => test.hidden) && check ? (
            <p className="text-xs text-fg-subtle">{w.tests.hiddenNote}</p>
          ) : null}
        </section>

        <div className="space-y-2 border-t border-line pt-4">
          <Disclosure summary={w.deadline} icon={<CalendarClock className="size-4" aria-hidden="true" />}>
            <DeadlineControl
              target={{ type: "exercise", courseId: exercise.courseId, exerciseId: exercise.id }}
              completed={exerciseCompleted}
            />
          </Disclosure>
          <p className="text-xs text-fg-subtle">{w.savedLocallyHint}</p>
        </div>
      </div>
    </div>
  );
}

function Feedback({
  check,
  rewards,
  failingCount,
  isLastStep,
  exerciseType,
  nav,
  onNextStep,
}: {
  check: CheckResult;
  rewards?: Rewards | null;
  failingCount: number;
  isLastStep: boolean;
  exerciseType: LocalizedExercise["type"];
  nav: WorkspaceNav;
  onNextStep: () => void;
}) {
  const { locale, dict } = useI18n();
  const f = dict.workspace.feedback;
  const g = dict.gamification;

  if (check.passed) {
    const title = rewards?.chapterCompleted
      ? f.chapterComplete
      : isLastStep
        ? exerciseType === "lab"
          ? f.labComplete
          : exerciseType === "checkpoint"
            ? f.checkpointComplete
            : f.exerciseComplete
        : f.stepComplete;
    const continueHref = nav.next ? `/${locale}/courses/${nav.courseId}/${nav.next.id}` : `/${locale}/courses/${nav.courseId}`;
    return (
      <div role="status" className="rise-in rounded-xl border border-success/30 bg-success-soft p-4">
        <div className="flex items-start gap-3">
          <Mascot mood="celebrating" size={64} animate label={dict.mascot.success} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-success">{title}</p>
            <p className="mt-0.5 text-[13px] text-fg-muted">{dict.mascot.success}</p>
            {rewards && rewards.awards.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={format(g.xpGained, { xp: rewards.xpGained })}>
                {rewards.awards.map((award) => (
                  <li
                    key={award.id}
                    className="rise-in inline-flex items-center gap-1 rounded-full bg-xp-soft px-2 py-0.5 text-xs font-semibold text-xp"
                  >
                    <Star className="size-3" fill="currentColor" aria-hidden="true" />
                    <span>
                      {format(g.xpGained, { xp: award.xp })}{" "}
                      <span className="font-medium text-fg-muted">
                        ·{" "}
                        {award.kind === "step"
                          ? g.reward.step
                          : award.kind === "chapter"
                            ? g.reward.chapter
                            : g.reward[exerciseType]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : rewards ? (
              <p className="mt-2 text-xs text-fg-muted">{f.practiceNoXp}</p>
            ) : null}
          </div>
        </div>
        {rewards && rewards.xpGained > 0 ? (
          <div className="mt-3 rounded-lg bg-surface/70 p-2.5">
            <LevelProgress level={levelInfo(rewards.totalXp)} compact />
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {!isLastStep ? (
            <Button variant="primary" onClick={onNextStep}>
              {f.nextStep}
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <ButtonLink href={continueHref} variant="primary">
              {nav.next ? f.nextExercise : f.backToPath}
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          )}
          {isLastStep && nav.next ? (
            <ButtonLink href={`/${locale}/courses/${nav.courseId}`} variant="ghost">
              {f.backToPath}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    );
  }

  const runtimeError = check.run.status === "error";
  return (
    <div role="status" className="rise-in flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4">
      <Mascot mood="encouraging" size={52} animate />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-warning">{f.notYet}</p>
        <p className="mt-0.5 text-[13px] text-fg-muted">
          {runtimeError ? f.runtimeErrorBody : plural(locale, f.notYetBody, failingCount)}
        </p>
      </div>
    </div>
  );
}
