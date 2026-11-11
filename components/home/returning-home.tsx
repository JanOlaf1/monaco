"use client";

import { ArrowRight, ChevronDown, Clock, Flag, FlaskConical, Footprints, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArchipelagoMap } from "@/components/adventure/archipelago-map";
import { CrystalBalance } from "@/components/adventure/crystal-balance";
import { QuestCard } from "@/components/adventure/quest-card";
import { DailyGoalPicker } from "@/components/gamification/daily-goal-picker";
import { DailyGoalSummary, LevelProgress, StreakBadge } from "@/components/gamification/stats";
import { chapterName } from "@/components/learn/learning-path";
import { chapterIcons, tones } from "@/components/learn/theme";
import { MiniPath } from "@/components/learn/mini-path";
import { useLearnerSummary } from "@/components/learner/use-learner-summary";
import { ExplorerMascot as Mascot } from "@/components/adventure/explorer-mascot";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { LanguageMark, languageNames } from "@/components/ui/language-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { adventureDictionary } from "@/lib/i18n/adventure";
import { useI18n } from "@/lib/i18n/client";
import { format, plural } from "@/lib/i18n/format";
import type { CatalogCourse } from "@/lib/content/catalog";
import { effectiveLevel, type CompetencyState, type TrackId } from "@/lib/learning/competency";
import { skillStandings } from "@/lib/learning/recommend";
import { useCatalog } from "@/lib/learner/catalog-context";
import { competencyActions } from "@/lib/learner/hooks";
import { isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";
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
  const adventureText = adventureDictionary(locale);
  const { summary, hydrated, progress, gamification, competency } = useLearnerSummary();
  const [showStats, setShowStats] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [editGoal, setEditGoal] = useState(false);

  if (!hydrated) return <HomeSkeleton />;

  const target = summary.continueAt;
  const Icon = target ? chapterIcons[target.chapter.theme.icon] : null;
  const tone = target ? tones[target.chapter.theme.tone] : null;
  const trackOf = (course: CatalogCourse) => competency.tracks[course.language as TrackId];
  const targetLevel = target ? effectiveLevel(trackOf(target.course)) : null;
  const reasonText = target
    ? target.reason === "recommended" && targetLevel
      ? format(dict.home.reason.recommended, { level: dict.levels.names[targetLevel.level] })
      : dict.home.reason[target.reason === "recommended" ? "next" : target.reason]
    : null;
  // The optional placement prompt: only for a course that has one, before any result, until dismissed.
  const promptCourse = target?.course;
  const promptTrackId = promptCourse?.language as TrackId | undefined;
  const showPlacementPrompt = Boolean(
    promptCourse?.placement &&
      promptTrackId &&
      !trackOf(promptCourse)?.placementResult &&
      !trackOf(promptCourse)?.userOverride &&
      !competency.dismissedPrompts.includes(promptTrackId),
  );
  const chapterDone = target
    ? target.chapter.exercises.filter((exercise) => isExerciseCompleted(progress, exercise.id)).length
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
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
        <div className="sm:ml-auto"><CrystalBalance /></div>
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
                  {chapterName(target.chapter, dict)}
                </span>
              </div>
              {reasonText && !target.courseComplete ? (
                <p className="mt-3 text-xs font-medium text-accent" data-testid="continue-reason">
                  {reasonText}
                </p>
              ) : null}
              <h2 className={cn("text-xl font-semibold tracking-tight", reasonText && !target.courseComplete ? "mt-1" : "mt-3")}>
                {dict.home.continueTitle}
              </h2>
              {target.courseComplete ? (
                <p className="mt-2 text-sm text-fg-muted">{format(dict.home.allDone, { course: target.course.title })}</p>
              ) : (
                <>
                  <p className="mt-1 text-lg">{target.exercise.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      tone="accent"
                      icon={
                        target.exercise.type === "checkpoint" ? (
                          <Flag aria-hidden="true" />
                        ) : target.exercise.type === "lab" ? (
                          <FlaskConical aria-hidden="true" />
                        ) : (
                          <Footprints aria-hidden="true" />
                        )
                      }
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

          {showPlacementPrompt && promptCourse?.placement && promptTrackId ? (
            <Card className="flex flex-wrap items-center gap-4">
              <Mascot mood="thinking" size={48} />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">
                  {format(dict.home.placementPrompt.title, { language: languageNames[promptCourse.language] })}
                </h2>
                <p className="mt-0.5 text-sm text-fg-muted">
                  {format(dict.home.placementPrompt.body, { minutes: promptCourse.placement.minutes })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/${locale}/placement/${promptCourse.id}`} variant="secondary">
                  {dict.home.placementPrompt.action}
                </ButtonLink>
                <Button variant="ghost" onClick={() => competencyActions.dismissPlacementPrompt(promptTrackId)}>
                  {dict.home.placementPrompt.dismiss}
                </Button>
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
                      <p className="mt-0.5 text-xs text-fg-muted" data-testid={`level-${course.id}`}>
                        <LevelText competency={competency} trackId={course.language as TrackId} />
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href={`/${locale}/courses`} className="text-sm text-fg-muted hover:text-fg">
                {dict.home.exploreCourses}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setShowSkills((value) => !value)} aria-expanded={showSkills}>
                <ChevronDown className={cn("transition-transform", showSkills && "rotate-180")} aria-hidden="true" />
                {showSkills ? dict.home.hideSkills : dict.home.showSkills}
              </Button>
            </div>
            {showSkills ? (
              <div className="rise-in mt-3 grid gap-3 sm:grid-cols-2">
                {summary.courses.map(({ course }) => (
                  <SkillList key={course.id} course={course} progress={progress} competency={competency} />
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <LevelProgress level={summary.level} />
          </Card>
          <QuestCard />
          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowStats((value) => !value)} aria-expanded={showStats}>
              <ChevronDown className={cn("transition-transform", showStats && "rotate-180")} aria-hidden="true" />
              {showStats ? dict.home.hideStats : dict.home.showStats}
            </Button>
            {showStats ? (
              <div className="rise-in mt-3 space-y-4">
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
                <dl className="grid grid-cols-2 gap-2">
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
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      <details className="rounded-2xl border border-line bg-surface p-5">
        <summary className="cursor-pointer text-sm font-semibold">{adventureText.world}</summary>
        <div className="mt-4"><ArchipelagoMap /></div>
      </details>
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

function LevelText({ competency, trackId }: { competency: CompetencyState; trackId: TrackId }) {
  const { dict } = useI18n();
  const effective = effectiveLevel(competency.tracks[trackId]);
  if (!effective) return <>{dict.levels.notSet}</>;
  return (
    <>
      {format(dict.levels.withSource, {
        level: dict.levels.names[effective.level],
        source: dict.levels.sources[effective.source],
      })}
    </>
  );
}

/** Collapsible per-skill evidence: exercises completed and placement answers. */
function SkillList({
  course,
  progress,
  competency,
}: {
  course: CatalogCourse;
  progress: ProgressState;
  competency: CompetencyState;
}) {
  const { dict } = useI18n();
  const { skills } = useCatalog();
  const rows = skillStandings(course, skills, progress, competency.tracks[course.language as TrackId]);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold">{format(dict.progressPage.skillsTitle, { course: course.title })}</p>
      <ul className="mt-2 space-y-1.5 text-xs">
        {rows.map((row) => (
          <li key={row.skill.id} className="flex items-center justify-between gap-3">
            <span className="text-fg-muted">{row.skill.title}</span>
            <span className="shrink-0 tabular-nums text-fg-subtle">
              {format(dict.progressPage.exercisesDone, { done: row.exercises.completed, total: row.exercises.total })}
              {row.placement
                ? ` · ${format(dict.progressPage.placementScore, { correct: row.placement.correct, total: row.placement.total })}`
                : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
