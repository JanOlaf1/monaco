"use client";

import { ArrowRight, CircleCheck, History, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { InlineMarkdown } from "@/components/content/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format, plural } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import { useGamification, usePractice, useProgress } from "@/lib/learner/hooks";
import { isExerciseCompleted } from "@/lib/progress/progress";
import { PRACTICE_LANGUAGES, type LocalizedPracticeActivity } from "@/lib/practice/content";
import type { PracticeLanguage } from "@/lib/practice/types";
import { PracticeSession } from "./practice-session";

const SESSION_SIZE = 5;
const LANGUAGE_NAMES: Record<PracticeLanguage, string> = { python: "Python", javascript: "JavaScript" };

/**
 * Practice overview: new activities, a review deck (answered activities and
 * activities of completed lessons, least recently practised first) and the
 * full list. Selecting any of them starts a short session.
 */
export function PracticeHub({ activities }: { activities: LocalizedPracticeActivity[] }) {
  const { locale, dict } = useI18n();
  const { courses } = useCatalog();
  const progress = useProgress();
  const practice = usePractice();
  const gamification = useGamification();
  const [chosenLanguage, setChosenLanguage] = useState<PracticeLanguage | null>(null);
  const [session, setSession] = useState<LocalizedPracticeActivity[] | null>(null);

  const exercises = useMemo(() => {
    const map = new Map<string, { title: string; courseId: string }>();
    for (const course of courses) {
      for (const chapter of course.chapters) {
        for (const exercise of chapter.exercises) map.set(exercise.id, { title: exercise.title, courseId: course.id });
      }
    }
    return map;
  }, [courses]);

  const preferred = courses.find((course) => course.id === gamification.value.preferredCourse)?.language;
  const language: PracticeLanguage =
    chosenLanguage ?? (PRACTICE_LANGUAGES.includes(preferred as PracticeLanguage) ? (preferred as PracticeLanguage) : "python");
  const hydrated = practice.hydrated && progress.hydrated;
  const passed = practice.value.activities;
  const forLanguage = activities.filter((activity) => activity.language === language);
  const fresh = forLanguage.filter((activity) => !passed[activity.id]);
  const review = forLanguage
    .filter((activity) => passed[activity.id] || isExerciseCompleted(progress.value, activity.exerciseId))
    .sort((a, b) => (passed[a.id]?.lastPassedAt ?? "").localeCompare(passed[b.id]?.lastPassedAt ?? ""));

  const start = (list: LocalizedPracticeActivity[]) => {
    setSession(list.slice(0, SESSION_SIZE));
    window.scrollTo({ top: 0 });
  };

  if (session) return <PracticeSession activities={session} onExit={() => setSession(null)} />;

  const last = progress.value.lastVisited;
  const lastLesson = last ? exercises.get(last.exerciseId) : undefined;

  return (
    <div className="space-y-6">
      <div role="group" aria-label={dict.practice.languages} className="inline-flex rounded-lg border border-line bg-surface p-1">
        {PRACTICE_LANGUAGES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === language}
            onClick={() => setChosenLanguage(option)}
            className={cn(
              "min-h-10 rounded-md px-4 text-sm font-medium transition-colors",
              option === language ? "bg-muted text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {LANGUAGE_NAMES[option]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="practice-new">
          <h2 id="practice-new" className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-accent" aria-hidden="true" />
            {dict.practice.startNew}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            {!hydrated ? dict.practice.loading : fresh.length ? plural(locale, dict.practice.newCount, fresh.length) : dict.practice.allDone}
          </p>
          <Button
            variant="primary"
            onClick={() => start(fresh)}
            disabled={!hydrated || fresh.length === 0}
            className="mt-4 h-11 w-full sm:h-9 sm:w-auto"
          >
            {dict.practice.startNew}
            <ArrowRight aria-hidden="true" />
          </Button>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card" aria-labelledby="practice-review">
          <h2 id="practice-review" className="flex items-center gap-2 text-base font-semibold">
            <History className="size-4 text-accent" aria-hidden="true" />
            {dict.practice.startReview}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{review.length ? dict.practice.reviewHint : dict.practice.noReview}</p>
          <Button
            onClick={() => start(review)}
            disabled={!hydrated || review.length === 0}
            className="mt-4 h-11 w-full sm:h-9 sm:w-auto"
          >
            {dict.practice.startReview}
          </Button>
        </section>
      </div>

      {last && lastLesson ? (
        <Link
          href={`/${locale}/courses/${lastLesson.courseId}/${last.exerciseId}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:bg-hover"
        >
          <span className="min-w-0">
            <span className="block text-xs text-fg-muted">{dict.practice.continueTitle}</span>
            <span className="block truncate font-medium">{lastLesson.title}</span>
            <span className="block text-xs text-fg-subtle">{dict.practice.continueBody}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
        </Link>
      ) : null}

      <section aria-labelledby="practice-all">
        <h2 id="practice-all" className="text-base font-semibold">
          {dict.practice.listTitle}
        </h2>
        <ul className="mt-3 space-y-2">
          {forLanguage.map((activity) => {
            const done = Boolean(passed[activity.id]);
            const lesson = exercises.get(activity.exerciseId);
            return (
              <li key={activity.id}>
                <button
                  type="button"
                  onClick={() => start([activity])}
                  disabled={!hydrated}
                  data-testid="practice-item"
                  className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:bg-hover disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-accent">{dict.practice.kinds[activity.kind]}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm">
                      <InlineMarkdown source={activity.prompt} />
                    </span>
                    {lesson ? (
                      <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                        {format(dict.practice.fromLesson, { title: lesson.title })}
                      </span>
                    ) : null}
                  </span>
                  {done ? (
                    <Badge tone="success" icon={<CircleCheck aria-hidden="true" />}>
                      {dict.practice.done}
                    </Badge>
                  ) : (
                    <Badge>{dict.practice.fresh}</Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-xs text-fg-subtle">{dict.practice.comingSoon}</p>
    </div>
  );
}
