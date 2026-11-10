"use client";

import { ProgressBar } from "@/components/ui/progress-bar";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { useProgress } from "@/lib/learner/hooks";
import { courseProgress } from "@/lib/progress/progress";

/** Progress for a course card. Renders a neutral placeholder until storage is loaded. */
export function CourseProgress({ exerciseIds, label }: { exerciseIds: string[]; label: string }) {
  const { dict } = useI18n();
  const { value, hydrated } = useProgress();
  const progress = courseProgress(value, exerciseIds);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-fg-subtle">
        <span className={hydrated ? undefined : "invisible"}>
          {format(dict.course.progress, { done: progress.completed, total: progress.total })}
        </span>
        <span className={hydrated ? "tabular-nums" : "invisible"}>{progress.percent}%</span>
      </div>
      <ProgressBar value={hydrated ? progress.percent : 0} label={label} />
    </div>
  );
}
