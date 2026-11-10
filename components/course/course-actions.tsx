"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { DeadlineControl } from "@/components/schedule/deadline-control";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useProgress } from "@/lib/learner/hooks";
import { courseProgress, nextExerciseInCourse } from "@/lib/progress/progress";

export function CourseActions({
  courseId,
  courseTitle,
  exerciseIds,
}: {
  courseId: string;
  courseTitle: string;
  exerciseIds: string[];
}) {
  const { locale, dict } = useI18n();
  const { value, hydrated } = useProgress();
  const progress = courseProgress(value, exerciseIds);
  const nextId = nextExerciseInCourse(value, exerciseIds);
  const complete = progress.total > 0 && progress.completed === progress.total;
  const label = !hydrated || !progress.started ? dict.course.start : complete ? dict.course.review : dict.course.continue;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between text-xs text-fg-muted">
        <span>{format(dict.course.progress, { done: hydrated ? progress.completed : 0, total: progress.total })}</span>
        <span className="tabular-nums">{hydrated ? progress.percent : 0}%</span>
      </div>
      <ProgressBar value={hydrated ? progress.percent : 0} label={courseTitle} className="mt-2" />
      {hydrated && complete ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
          <CircleCheck className="size-4" aria-hidden="true" />
          {dict.course.courseComplete}
        </p>
      ) : null}
      {nextId ? (
        <ButtonLink href={`/${locale}/courses/${courseId}/${nextId}`} variant="primary" className="mt-4 w-full">
          {label}
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      ) : null}
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-1 text-xs font-medium text-fg-subtle">{dict.deadlines.courseTitle}</p>
        <DeadlineControl target={{ type: "course", courseId }} completed={hydrated && complete} />
      </div>
    </div>
  );
}
