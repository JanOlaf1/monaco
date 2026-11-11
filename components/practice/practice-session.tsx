"use client";

import { PartyPopper, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import type { LocalizedPracticeActivity } from "@/lib/practice/content";
import { ActivityView, type ActivityResult } from "./activity-view";

/** A short run of activities, one at a time, ending with a summary. */
export function PracticeSession({
  activities,
  onExit,
}: {
  activities: LocalizedPracticeActivity[];
  onExit: () => void;
}) {
  const { dict } = useI18n();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const finished = index >= activities.length;

  useEffect(() => {
    if (finished) summaryHeading.current?.focus();
  }, [finished]);

  if (finished) {
    const correct = results.filter((result) => result.firstTry).length;
    const xp = results.reduce((sum, result) => sum + result.xp, 0);
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 text-center shadow-card sm:p-6" data-testid="practice-summary">
        <PartyPopper className="mx-auto size-8 text-accent" aria-hidden="true" />
        <h2 ref={summaryHeading} tabIndex={-1} className="mt-3 text-lg font-semibold outline-none">
          {dict.practice.summaryTitle}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {format(dict.practice.summaryBody, { correct, total: activities.length })}
        </p>
        {xp > 0 ? (
          <p className="mt-2 text-sm font-semibold text-xp">{format(dict.practice.summaryXp, { xp })}</p>
        ) : null}
        <Button variant="primary" onClick={onExit} className="mt-5 h-11 sm:h-9">
          {dict.practice.back}
        </Button>
      </section>
    );
  }

  const activity = activities[index];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3 text-xs text-fg-muted">
        <span>{format(dict.practice.progress, { current: index + 1, total: activities.length })}</span>
        <Button variant="ghost" size="sm" onClick={onExit} className="-mr-2 h-10 sm:h-8">
          <X aria-hidden="true" />
          {dict.practice.endSession}
        </Button>
      </div>
      <ProgressBar
        value={Math.round((index / activities.length) * 100)}
        label={format(dict.practice.progress, { current: index + 1, total: activities.length })}
        className="mt-1"
      />
      <div className="mt-5">
        <ActivityView
          key={activity.id}
          activity={activity}
          isLast={index === activities.length - 1}
          onDone={(result) => {
            setResults((previous) => [...previous, result]);
            setIndex((previous) => previous + 1);
          }}
        />
      </div>
    </div>
  );
}
