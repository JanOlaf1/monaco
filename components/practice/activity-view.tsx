"use client";

import { Star } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { InlineMarkdown } from "@/components/content/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Rewards } from "@/lib/gamification/engine";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import { recordPracticeAnswer, useGamification, usePractice, useProgress } from "@/lib/learner/hooks";
import type { LocalizedPracticeActivity } from "@/lib/practice/content";
import { BLANK } from "@/lib/practice/evaluate";
import type { PracticeResponse } from "@/lib/practice/types";
import { ChoiceList, CodeView, type ChoiceOption } from "./choice-list";
import { ReorderLines } from "./reorder-lines";

type Phase = "answering" | "wrong" | "correct" | "revealed";

export interface ActivityResult {
  /** Correct on the first check, without showing the answer. */
  firstTry: boolean;
  xp: number;
}

function correctChoiceIds(activity: LocalizedPracticeActivity): string[] {
  switch (activity.kind) {
    case "predict":
    case "quiz":
      return [activity.answer];
    case "complete":
    case "select":
      return activity.answers;
    case "bug":
      return [String(activity.bugLine)];
    case "reorder":
      return [];
  }
}

function ExpectedOutput({ output }: { output: string }) {
  const { dict } = useI18n();
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-fg-muted">{dict.practice.expectedOutput}</p>
      <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed">
        <code>{output}</code>
      </pre>
    </div>
  );
}

/** The code of a "complete" activity with the blank shown as the current choice. */
function CodeWithBlank({ code, fill }: { code: string; fill: string | null }) {
  const [before, after] = code.split(BLANK);
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[13px] leading-relaxed">
      <code>
        {before}
        <mark className="rounded bg-accent-soft px-1 text-accent">{fill ?? BLANK}</mark>
        {after}
      </code>
    </pre>
  );
}

/**
 * One practice activity. The answer is evaluated by `recordPracticeAnswer`
 * against the authoritative answer key; only a correct answer is saved and
 * rewarded (XP once per activity).
 */
export function ActivityView({
  activity,
  isLast,
  onDone,
}: {
  activity: LocalizedPracticeActivity;
  isLast: boolean;
  onDone: (result: ActivityResult) => void;
}) {
  const { dict } = useI18n();
  const { gamification: catalog } = useCatalog();
  const hydrated = [useProgress(), useGamification(), usePractice()].every((store) => store.hydrated);
  const [phase, setPhase] = useState<Phase>("answering");
  const [attempts, setAttempts] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [order, setOrder] = useState<number[]>(activity.kind === "reorder" ? activity.start : []);
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Start each activity from its question, for keyboard and screen-reader users too.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const locked = phase === "correct" || phase === "revealed";
  const response: PracticeResponse | null =
    activity.kind === "reorder"
      ? { type: "order", order }
      : choice === null
        ? null
        : activity.kind === "bug"
          ? { type: "line", index: Number(choice) }
          : { type: "choice", optionId: choice };

  const check = () => {
    if (!response) return;
    const outcome = recordPracticeAnswer({ catalog, activityId: activity.id, response });
    setAttempts((count) => count + 1);
    if (outcome.correct) {
      setRewards(outcome.rewards);
      setPhase("correct");
    } else {
      setPhase("wrong");
    }
  };

  const tryAgain = () => {
    if (activity.kind !== "reorder") setChoice(null);
    setPhase("answering");
  };

  const reveal = () => {
    if (activity.kind === "reorder") setOrder(activity.lines.map((_, index) => index));
    else setChoice(correctChoiceIds(activity)[0] ?? null);
    setPhase("revealed");
  };

  const finish = () => onDone({ firstTry: phase === "correct" && attempts === 1, xp: rewards?.xpGained ?? 0 });

  const choiceProps = {
    name: `practice-${activity.id}`,
    value: choice,
    onChange: (id: string) => {
      setChoice(id);
      if (phase === "wrong") setPhase("answering");
    },
    disabled: locked,
    correctIds: locked ? correctChoiceIds(activity) : [],
    wrongId: phase === "wrong" ? choice : null,
  };

  let body: ReactNode;
  switch (activity.kind) {
    case "predict":
      body = (
        <>
          <CodeView code={activity.code} />
          <ChoiceList
            {...choiceProps}
            legend={dict.practice.hints.predict}
            options={activity.options.map((option) => ({
              id: option.id,
              content: <code className="whitespace-pre-wrap font-mono text-[13px]">{option.output}</code>,
            }))}
          />
        </>
      );
      break;
    case "quiz":
      body = (
        <>
          {activity.code ? <CodeView code={activity.code} /> : null}
          <ChoiceList
            {...choiceProps}
            legend={dict.practice.hints.quiz}
            options={activity.options.map((option) => ({ id: option.id, content: <InlineMarkdown source={option.label} /> }))}
          />
        </>
      );
      break;
    case "complete": {
      const chosen = activity.options.find((option) => option.id === choice)?.text ?? null;
      body = (
        <>
          <CodeWithBlank code={activity.code} fill={chosen} />
          <ExpectedOutput output={activity.expectedOutput} />
          <ChoiceList
            {...choiceProps}
            legend={dict.practice.hints.complete}
            options={activity.options.map((option) => ({
              id: option.id,
              content: <code className="font-mono text-[13px]">{option.text}</code>,
            }))}
          />
        </>
      );
      break;
    }
    case "select":
      body = (
        <>
          <CodeView code={activity.harness} />
          <ExpectedOutput output={activity.expectedOutput} />
          <ChoiceList
            {...choiceProps}
            legend={dict.practice.hints.select}
            options={activity.options.map((option, index) => ({
              id: option.id,
              content: (
                <span className="block min-w-0">
                  <span className="text-xs font-semibold text-fg-muted">{String.fromCharCode(65 + index)}</span>
                  <pre className="mt-1 overflow-x-auto font-mono text-[12.5px] leading-relaxed">
                    <code>{option.code}</code>
                  </pre>
                </span>
              ),
            }))}
          />
        </>
      );
      break;
    case "bug": {
      const options: ChoiceOption[] = activity.code.split("\n").map((line, index) => ({
        id: String(index),
        content: (
          <span className="flex min-w-0 gap-2 font-mono text-[13px]">
            <span className="shrink-0 text-fg-subtle" aria-hidden="true">
              {index + 1}
            </span>
            <span className="sr-only">{format(dict.practice.line, { number: index + 1 })}: </span>
            <code className="min-w-0 overflow-x-auto whitespace-pre">{line}</code>
          </span>
        ),
      }));
      body = (
        <>
          <ExpectedOutput output={activity.expectedOutput} />
          <ChoiceList {...choiceProps} legend={dict.practice.hints.bug} options={options} />
        </>
      );
      break;
    }
    case "reorder":
      body = (
        <>
          <ExpectedOutput output={activity.expectedOutput} />
          <p className="mt-4 text-xs text-fg-muted">{dict.practice.hints.reorder}</p>
          <ReorderLines
            lines={activity.lines}
            order={order}
            onChange={(next) => {
              setOrder(next);
              if (phase === "wrong") setPhase("answering");
            }}
            disabled={locked}
            tone={phase === "correct" || phase === "revealed" ? "right" : phase === "wrong" ? "wrong" : "neutral"}
          />
        </>
      );
      break;
  }

  const otherAnswers =
    activity.kind === "complete" && phase === "correct"
      ? activity.options.filter((option) => activity.answers.includes(option.id) && option.id !== choice)
      : [];

  return (
    <section aria-labelledby={`activity-${activity.id}`} data-testid="practice-activity" data-activity={activity.id}>
      <Badge tone="accent">{dict.practice.kinds[activity.kind]}</Badge>
      <h2
        id={`activity-${activity.id}`}
        ref={heading}
        tabIndex={-1}
        className="mt-3 text-base font-semibold leading-relaxed outline-none"
      >
        <InlineMarkdown source={activity.prompt} />
      </h2>
      {body}

      <div role="status" aria-live="polite">
        {phase !== "answering" ? (
          <div
            className={cn(
              "mt-4 rounded-xl border p-4 text-sm",
              phase === "correct" ? "border-success bg-success-soft" : "border-line bg-muted",
            )}
            data-testid="practice-feedback"
          >
            <p className={cn("font-semibold", phase === "correct" ? "text-success" : "text-fg")}>
              {phase === "correct"
                ? dict.practice.correct
                : phase === "wrong"
                  ? dict.practice.incorrect
                  : dict.practice.answerShown}
            </p>
            {phase === "wrong" ? <p className="mt-1 text-fg-muted">{dict.practice.incorrectHint}</p> : null}
            {locked ? (
              <>
                <p className="mt-1">
                  <InlineMarkdown source={activity.explanation} />
                </p>
                {activity.kind === "bug" ? (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-fg-muted">{dict.practice.fixedLine}</p>
                    <CodeView code={activity.fix.trim()} />
                  </div>
                ) : null}
                {otherAnswers.length ? (
                  <p className="mt-2 text-fg-muted">
                    {dict.practice.alsoCorrect}{" "}
                    {otherAnswers.map((option) => (
                      <code key={option.id} className="mr-1 rounded bg-code px-1 font-mono text-[13px]">
                        {option.text}
                      </code>
                    ))}
                  </p>
                ) : null}
              </>
            ) : null}
            {phase === "correct" && rewards ? (
              rewards.xpGained > 0 ? (
                <p className="mt-2 inline-flex items-center gap-1 font-semibold text-xp" data-testid="practice-xp">
                  <Star className="size-4" fill="currentColor" aria-hidden="true" />
                  {format(dict.practice.xpEarned, { xp: rewards.xpGained })}
                </p>
              ) : (
                <p className="mt-2 text-fg-muted" data-testid="practice-no-xp">
                  {dict.practice.alreadyEarned}
                </p>
              )
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {phase === "answering" ? (
          <Button
            variant="primary"
            onClick={check}
            disabled={!hydrated || !response}
            className="h-11 min-w-32 sm:h-9"
          >
            {hydrated ? dict.practice.check : dict.practice.loading}
          </Button>
        ) : phase === "wrong" ? (
          <>
            <Button variant="primary" onClick={tryAgain} className="h-11 min-w-32 sm:h-9">
              {dict.practice.tryAgain}
            </Button>
            <Button onClick={reveal} className="h-11 sm:h-9">
              {dict.practice.showAnswer}
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={finish} className="h-11 min-w-32 sm:h-9">
            {isLast ? dict.practice.finish : dict.practice.next}
          </Button>
        )}
      </div>
    </section>
  );
}
