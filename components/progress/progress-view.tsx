"use client";

import { CrystalBalance } from "@/components/adventure/crystal-balance";

import { ArrowRight, CalendarDays, CircleCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AchievementMedal } from "@/components/gamification/achievement-badge";
import { DailyGoalPicker } from "@/components/gamification/daily-goal-picker";
import { DailyGoalSummary, LevelProgress, StreakBadge } from "@/components/gamification/stats";
import { chapterIcons, tones } from "@/components/learn/theme";
import { useLearnerSummary } from "@/components/learner/use-learner-summary";
import { Mascot } from "@/components/mascot/mascot";
import { ButtonLink } from "@/components/ui/button";
import { LanguageMark } from "@/components/ui/language-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SkillLevels } from "./skill-levels";
import { cn } from "@/lib/cn";
import { ACHIEVEMENTS } from "@/lib/gamification/achievements";
import { buildAchievementContext } from "@/lib/gamification/engine";
import { recentDays } from "@/lib/gamification/streaks";
import { useI18n } from "@/lib/i18n/client";
import { format, formatDateKey } from "@/lib/i18n/format";
import { useCatalog } from "@/lib/learner/catalog-context";
import { toDateKey } from "@/lib/schedule/dates";

function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface p-5 shadow-card", className)}>
      {title ? <h2 className="mb-4 text-sm font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function ProgressView() {
  const { locale, dict } = useI18n();
  const { gamification: catalog } = useCatalog();
  const { summary, hydrated, progress, gamification, today } = useLearnerSummary();

  if (!hydrated) {
    return (
      <div className="mt-8 grid gap-4 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const context = buildAchievementContext(gamification, progress, catalog);
  const days = recentDays(gamification.activeDays, today, 14);

  return (
    <div className="mt-8 space-y-6">
      <CrystalBalance />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title={dict.progressPage.levelTitle}>
          <LevelProgress level={summary.level} />
          <p className="mt-3 text-xs text-fg-subtle">{format(dict.gamification.xp, { xp: summary.level.totalXp })}</p>
          <details className="mt-3 text-xs text-fg-muted">
            <summary className="cursor-pointer font-medium text-fg">{dict.progressPage.howLevels}</summary>
            <p className="mt-2 leading-relaxed">{dict.progressPage.howLevelsBody}</p>
          </details>
        </Panel>
        <Panel title={dict.progressPage.streakTitle}>
          <StreakBadge streak={summary.streak} />
          <p className="mt-4 text-xs text-fg-subtle">{format(dict.gamification.lastDays, { count: days.length })}</p>
          <ol className="mt-1.5 grid grid-cols-14 gap-1" aria-label={format(dict.gamification.lastDays, { count: days.length })}>
            {days.map(({ day, active }) => (
              <li
                key={day}
                title={format(active ? dict.gamification.activeDay : dict.gamification.inactiveDay, {
                  date: formatDateKey(locale, day),
                })}
                className={cn(
                  "aspect-square rounded-sm",
                  active ? "bg-streak" : "bg-muted",
                  day === today && "ring-2 ring-streak/40 ring-offset-1 ring-offset-surface",
                )}
              >
                <span className="sr-only">
                  {format(active ? dict.gamification.activeDay : dict.gamification.inactiveDay, {
                    date: formatDateKey(locale, day),
                  })}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">{dict.progressPage.streakBody}</p>
        </Panel>
        <Panel title={dict.gamification.dailyGoal}>
          <DailyGoalSummary done={summary.daily.done} target={summary.daily.target} />
          <div className="mt-4">
            <DailyGoalPicker value={gamification.dailyGoal} />
          </div>
        </Panel>
      </div>

      <SkillLevels />

      <Panel>
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{dict.achievements.title}</h2>
          <p className="text-xs text-fg-subtle">
            {format(dict.achievements.earned, { earned: summary.achievementsEarned, total: ACHIEVEMENTS.length })}
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((definition) => {
            const earned = gamification.achievements[definition.id];
            const { value, target } = definition.progress(context);
            const text = dict.achievements.items[definition.id];
            return (
              <li
                key={definition.id}
                data-achievement={definition.id}
                data-earned={earned ? "true" : "false"}
                className={cn("flex items-center gap-3 rounded-xl border p-3", earned ? "border-line" : "border-dashed border-line")}
              >
                <AchievementMedal definition={definition} earned={Boolean(earned)} />
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold", !earned && "text-fg-muted")}>{text.title}</p>
                  <p className="text-xs text-fg-muted">{text.description}</p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {earned
                      ? format(dict.achievements.earnedOn, { date: formatDateKey(locale, toDateKey(new Date(earned.at))) })
                      : target > 1
                        ? `${value}/${target}`
                        : dict.achievements.notYet}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={dict.progressPage.pathsTitle}>
          <ul className="space-y-4">
            {summary.courses.map(({ course, progress: value }) => (
              <li key={course.id}>
                <Link href={`/${locale}/courses/${course.id}`} className="flex items-center gap-3 hover:text-accent">
                  <LanguageMark language={course.language} size="sm" />
                  <span className="flex-1 text-sm font-medium">{course.title}</span>
                  <span className="text-xs tabular-nums text-fg-subtle">{value.percent}%</span>
                </Link>
                <ProgressBar value={value.percent} label={course.title} className="mt-2" />
                <p className="mt-1 text-xs text-fg-subtle">
                  {format(dict.course.progress, { done: value.completed, total: value.total })}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={dict.progressPage.chaptersTitle}>
          {summary.completedChapters.length === 0 ? (
            <div className="flex items-center gap-3">
              <Mascot mood="encouraging" size={56} />
              <p className="text-sm text-fg-muted">{dict.progressPage.noChapters}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {summary.completedChapters.map(({ course, chapter }) => {
                const Icon = chapterIcons[chapter.theme.icon];
                return (
                  <li key={`${course.id}-${chapter.id}`} className="flex items-center gap-3">
                    <span className={cn("flex size-8 items-center justify-center rounded-lg", tones[chapter.theme.tone].tile)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{chapter.title}</span>
                      <span className="text-fg-subtle"> · {course.title}</span>
                    </span>
                    <CircleCheck className="size-4 text-success" aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">{dict.progressPage.planTitle}</h2>
            <p className="text-sm text-fg-muted">{dict.progressPage.planBody}</p>
          </div>
          <ButtonLink href={`/${locale}/plan`} variant="secondary" size="sm">
            {dict.progressPage.openPlan}
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
