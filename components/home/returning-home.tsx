"use client";

import { ArrowRight, ChevronDown, Clock, FlaskConical, Footprints, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DailyGoalPicker } from "@/components/gamification/daily-goal-picker";
import { DailyGoalSummary, LevelProgress, StreakBadge } from "@/components/gamification/stats";
import { chapterIcons, tones } from "@/components/learn/theme";
import { MiniPath } from "@/components/learn/mini-path";
import { useLearnerSummary } from "@/components/learner/use-learner-summary";
import { Mascot } from "@/components/mascot/mascot";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { LanguageMark } from "@/components/ui/language-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { format, plural } from "@/lib/i18n/format";
import { isExerciseCompleted } from "@/lib/progress/progress";
import type { Milestone } from "@/lib/learner/summary";

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-card", className)}>{children}</div>;
}

function HomeSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-busy="true">
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

/** The returning learner's home: continue first, then progress at a glance. */
export function ReturningHome() {
  const { locale, dict } = useI18n();
  const { summary, hydrated, progress, gamification } = useLearnerSummary();
  const [showStats, setShowStats] = useState(false);
  const [editGoal, setEditGoal] = useState(false);

  if (!hydrated) return <HomeSkeleton />;

  const target = summary.continueAt;
  const Icon = target ? chapterIcons[target.chapter.theme.icon] : null;
  const tone = target ? tones[target.chapter.theme.tone] : null;
  const chapterDone = target
    ? target.chapter.exercises.filter((exercise) => isExerciseCompleted(progress, exercise.id)).length
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Mascot mood="welcome" size={64} animate />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.home.welcomeBack}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {summary.streak.current > 0
              ? `${plural(locale, dict.gamification.streak, summary.streak.current)} · ${
                  summary.streak.activeToday ? dict.gamification.streakActiveToday : dict.gamification.streakKeepGoing
                }`
              : dict.gamification.streakNone}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {target && Icon && tone ? (
            <Card className="relative overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-fg-muted">
                <LanguageMark language={target.course.language} size="sm" />
                <span>{target.course.title}</span>
                <span aria-hidden="true">·</span>
                <span className={cn("inline-flex items-center gap-1", tone.text)}>
                  <Icon className="size-3.5" aria-hidden="true" />
                  {format(dict.home.chapterLine, { number: target.chapter.number, title: target.chapter.title })}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{dict.home.continueTitle}</h2>
              {target.courseComplete ? (
                <p className="mt-2 text-sm text-fg-muted">{format(dict.home.allDone, { course: target.course.title })}</p>
              ) : (
                <>
                  <p className="mt-1 text-lg">{target.exercise.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      tone="accent"
                      icon={target.exercise.type === "lab" ? <FlaskConical aria-hidden="true" /> : <Footprints aria-hidden="true" />}
                    >
                      {dict.course.type[target.exercise.type]}
                    </Badge>
                    <Badge icon={<Clock aria-hidden="true" />}>
                      {format(dict.common.minutes, { count: target.exercise.estimatedMinutes })}
                    </Badge>
                  </div>
                </>
              )}
              <div className="mt-5">
                <MiniPath chapter={target.chapter} progress={progress} currentId={target.courseComplete ? undefined : target.exercise.id} />
                <p className="mt-2 text-xs text-fg-subtle">
                  {format(dict.home.chapterProgress, { done: chapterDone, total: target.chapter.exercises.length })}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <ButtonLink
                  href={
                    target.courseComplete
                      ? `/${locale}/courses/${target.course.id}`
                      : `/${locale}/courses/${target.course.id}/${target.exercise.id}`
                  }
                  variant="primary"
                  className="h-10 px-5"
                >
                  {target.courseComplete ? dict.course.review : dict.home.continueAction}
                  <ArrowRight aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href={`/${locale}/courses/${target.course.id}`} variant="ghost" className="h-10">
                  {dict.workspace.feedback.backToPath}
                </ButtonLink>
              </div>
            </Card>
          ) : null}

          <section aria-labelledby="paths-title">
            <h2 id="paths-title" className="text-sm font-semibold text-fg-muted">
              {dict.home.pathsTitle}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {summary.courses.map(({ course, progress: value }) => (
                <li key={course.id}>
                  <Link
                    href={`/${locale}/courses/${course.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                  >
                    <LanguageMark language={course.language} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{course.title}</p>
                      <ProgressBar value={value.percent} label={course.title} className="mt-2" />
                      <p className="mt-1 text-xs text-fg-subtle">
                        {format(dict.course.progress, { done: value.completed, total: value.total })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/${locale}/courses`} className="mt-3 inline-block text-sm text-fg-muted hover:text-fg">
              {dict.home.exploreCourses}
            </Link>
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <LevelProgress level={summary.level} />
          </Card>
          <Card>
            <StreakBadge streak={summary.streak} />
          </Card>
          <Card>
            <DailyGoalSummary done={summary.daily.done} target={summary.daily.target} />
            {gamification.dailyGoal === null || editGoal ? (
              <div className="mt-4">
                <DailyGoalPicker value={gamification.dailyGoal} />
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="-ml-2 mt-2" onClick={() => setEditGoal(true)}>
                {dict.deadlines.change}
              </Button>
            )}
          </Card>
          {summary.milestone ? (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{dict.home.nextMilestone}</p>
              <p className="mt-2 flex items-start gap-2 text-sm">
                <Trophy className="mt-0.5 size-4 shrink-0 text-xp" aria-hidden="true" />
                <MilestoneText milestone={summary.milestone} />
              </p>
            </Card>
          ) : null}
          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowStats((value) => !value)} aria-expanded={showStats}>
              <ChevronDown className={cn("transition-transform", showStats && "rotate-180")} aria-hidden="true" />
              {showStats ? dict.home.hideStats : dict.home.showStats}
            </Button>
            {showStats ? (
              <dl className="rise-in mt-2 grid grid-cols-2 gap-2">
                {[
                  [dict.home.stats.completed, summary.completedExercises],
                  [dict.home.stats.labs, summary.completedLabs],
                  [dict.home.stats.achievements, summary.achievementsEarned],
                  [dict.home.stats.bestStreak, summary.streak.longest],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-surface p-3">
                    <dt className="text-xs text-fg-subtle">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MilestoneText({ milestone }: { milestone: Milestone }) {
  const { locale, dict } = useI18n();
  if (milestone.kind === "chapter") {
    return <span>{plural(locale, dict.home.milestoneChapter, milestone.remaining, { chapter: milestone.chapter.title })}</span>;
  }
  if (milestone.kind === "achievement") {
    return (
      <span>
        {format(dict.home.milestoneAchievement, {
          name: dict.achievements.items[milestone.id].title,
          value: milestone.value,
          target: milestone.target,
        })}
      </span>
    );
  }
  return <span>{format(dict.home.milestoneLevel, { xp: milestone.xpToNext, level: milestone.level })}</span>;
}
