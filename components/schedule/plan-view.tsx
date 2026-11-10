"use client";

import { CalendarDays, CircleCheck, Clock, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageMark } from "@/components/ui/language-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { CatalogCourse } from "@/lib/content/catalog";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { scheduleActions, useProgress, useSchedule } from "@/lib/learner/hooks";
import { courseProgress, isExerciseCompleted, type ProgressState } from "@/lib/progress/progress";
import { todayKey } from "@/lib/schedule/dates";
import { groupDeadlines, type Deadline, type DeadlineTarget } from "@/lib/schedule/deadlines";
import { DeadlineDialog } from "./deadline-control";
import { DeadlineStatusBadge } from "./deadline-status";

function isTargetCompleted(target: DeadlineTarget, progress: ProgressState, catalog: CatalogCourse[]): boolean {
  if (target.type === "exercise") return isExerciseCompleted(progress, target.exerciseId);
  const course = catalog.find((candidate) => candidate.id === target.courseId);
  if (!course || course.exerciseIds.length === 0) return false;
  return course.exerciseIds.every((id) => isExerciseCompleted(progress, id));
}

export function PlanView({ catalog }: { catalog: CatalogCourse[] }) {
  const { locale, dict } = useI18n();
  const { value: schedule, hydrated: scheduleHydrated } = useSchedule();
  const { value: progress, hydrated: progressHydrated } = useProgress();
  const [editing, setEditing] = useState<Deadline | null>(null);

  if (!scheduleHydrated || !progressHydrated) {
    return (
      <div className="mt-8 space-y-3" aria-busy="true">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const today = todayKey();
  const deadlines = Object.values(schedule.deadlines);
  const completed = (target: DeadlineTarget) => isTargetCompleted(target, progress, catalog);
  const groups = groupDeadlines(deadlines, today, completed);
  const available = catalog.filter((course) => course.status === "available" && course.exerciseIds.length > 0);

  const sections = [
    { id: "upcoming", title: dict.plan.upcoming, items: groups.upcoming, empty: dict.plan.emptyUpcoming },
    { id: "overdue", title: dict.plan.overdue, items: groups.overdue, empty: dict.plan.emptyOverdue },
    { id: "completed", title: dict.plan.completed, items: groups.completed, empty: dict.plan.emptyCompleted },
  ];

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        {deadlines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
            <CalendarDays className="mx-auto size-6 text-fg-subtle" aria-hidden="true" />
            <p className="mx-auto mt-3 max-w-sm text-sm text-fg-muted">{dict.plan.emptyAll}</p>
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.id} aria-labelledby={`plan-${section.id}`}>
              <h2 id={`plan-${section.id}`} className="flex items-center gap-2 text-sm font-semibold">
                {section.title}
                <span className="rounded-full bg-muted px-1.5 text-xs font-medium tabular-nums text-fg-subtle">
                  {section.items.length}
                </span>
              </h2>
              {section.id === "overdue" && section.items.length > 0 ? (
                <p className="mt-1 text-xs text-fg-subtle">{dict.deadlines.gentleOverdue}</p>
              ) : null}
              {section.items.length === 0 ? (
                <p className="mt-2 text-sm text-fg-subtle">{section.empty}</p>
              ) : (
                <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                  {section.items.map((deadline) => (
                    <DeadlineRow
                      key={deadline.key}
                      deadline={deadline}
                      catalog={catalog}
                      today={today}
                      completed={completed(deadline.target)}
                      onReschedule={() => setEditing(deadline)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </div>

      <aside aria-labelledby="plan-progress">
        <h2 id="plan-progress" className="text-sm font-semibold">
          {dict.plan.progressTitle}
        </h2>
        <ul className="mt-3 space-y-3">
          {available.map((course) => {
            const ids = course.exerciseIds;
            const value = courseProgress(progress, ids);
            return (
              <li key={course.id} className="rounded-xl border border-line bg-surface p-4">
                <Link href={`/${locale}/courses/${course.id}`} className="flex items-center gap-3 hover:text-accent">
                  <LanguageMark language={course.language} size="sm" />
                  <span className="text-sm font-medium">{course.title}</span>
                </Link>
                <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
                  <span>{format(dict.course.progress, { done: value.completed, total: value.total })}</span>
                  <span className="tabular-nums">{value.percent}%</span>
                </div>
                <ProgressBar value={value.percent} label={course.title} className="mt-1.5" />
              </li>
            );
          })}
        </ul>
      </aside>

      {editing ? (
        <DeadlineDialog
          target={editing.target}
          currentDate={editing.dueDate}
          today={today}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function DeadlineRow({
  deadline,
  catalog,
  today,
  completed,
  onReschedule,
}: {
  deadline: Deadline;
  catalog: CatalogCourse[];
  today: string;
  completed: boolean;
  onReschedule: () => void;
}) {
  const { locale, dict } = useI18n();
  const course = catalog.find((candidate) => candidate.id === deadline.target.courseId);
  const exercise =
    deadline.target.type === "exercise"
      ? course?.chapters.flatMap((chapter) => chapter.exercises).find((candidate) => candidate.id === (deadline.target as { exerciseId: string }).exerciseId)
      : undefined;
  const title = deadline.target.type === "course" ? course?.title : exercise?.title;
  if (!course || !title) return null;
  const href =
    deadline.target.type === "course"
      ? `/${locale}/courses/${course.id}`
      : `/${locale}/courses/${course.id}/${deadline.target.exerciseId}`;

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <LanguageMark language={course.language} size="sm" className="mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs text-fg-subtle">
            {deadline.target.type === "course" ? dict.plan.courseTarget : `${dict.plan.exerciseTarget} · ${course.title}`}
          </p>
          <Link href={href} className="text-sm font-medium hover:text-accent">
            {title}
          </Link>
          <div className="mt-1.5">
            <DeadlineStatusBadge dueDate={deadline.dueDate} today={today} completed={completed} />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:justify-end">
        {completed ? (
          <span className="mr-2 inline-flex items-center gap-1 text-xs text-success">
            <CircleCheck className="size-3.5" aria-hidden="true" />
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={onReschedule}>
            <Clock aria-hidden="true" />
            {dict.plan.reschedule}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scheduleActions.remove(deadline.target)}
          aria-label={`${dict.deadlines.remove}: ${title}`}
          title={dict.deadlines.remove}
        >
          <Trash aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
